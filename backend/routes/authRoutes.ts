import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { ActivityService } from '../services/ActivityService';
import fs from 'fs'; 
import path from 'path'; 
import os from 'os'; 
import { exec } from 'child_process';

const router = Router();
const prisma = new PrismaClient();

// --- HELPER: Dynamic Email Sender (Uses external SMTP config) ---
async function sendEmail(to: string, subject: string, text: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } });
  
  if (!setting?.json_value) {
    // Log warning but don't crash if email isn't set up yet
    console.warn("SMTP not configured. Skipping email.");
    return;
  }

  const config = setting.json_value as any;
  
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Number(config.port) === 465,
    auth: { 
      user: config.user, 
      pass: config.password 
    }
  });

  await transporter.sendMail({ 
    from: config.fromEmail || config.user,
    to, 
    subject, 
    text 
  });
}

/**
 * Helper: Detects OS and returns the likely path for the Chromium executable.
 */
const getPuppeteerPath = () => {
  const platform = os.platform();
  const arch = os.arch();
  
  if (platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  if (platform === 'linux' || arch === 'arm64') {
    return '/usr/bin/chromium-browser'; 
  }
  if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; 
  }
  return '';
};

// ==============================
// 1. LOGIN & AUTHENTICATION
// ==============================

router.post('/login', async (req, res) => {
  try {
    const { email, password, totpToken } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ error: "Invalid password" });

    if (user.two_factor_enabled) {
        if (!totpToken) return res.json({ require2fa: true }); 
        if (!user.two_factor_secret) return res.status(500).json({ error: "2FA enabled but secret missing." });
        
        const validTotp = authenticator.check(totpToken, user.two_factor_secret);
        if (!validTotp) return res.status(400).json({ error: "Invalid 2FA Code" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '12h' }
    );

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(user.id, "LOGIN", "User logged in", "AUTH", undefined, ip as string);

    res.json({ 
      token, 
      user: { 
        id: user.id,
        email: user.email, 
        role: user.role,
        two_factor_enabled: user.two_factor_enabled 
      } 
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed. System might need setup." });
  }
});

// ==============================
// 2. PASSWORD RECOVERY
// ==============================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 Hour

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_token: token, reset_token_expiry: expiry }
    });

    // Use APP_URL from env or default to request origin
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;
    
    await sendEmail(email, "Password Reset Request", `Click here to reset: ${resetLink}`);
    await ActivityService.log(user.id, "FORGOT_PASSWORD", "Requested password reset link");

    res.json({ success: true, message: "Reset link sent to email." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to process request" });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Invalid request" });
    
    const user = await prisma.user.findFirst({
      where: { reset_token: token, reset_token_expiry: { gt: new Date() } }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword, reset_token: null, reset_token_expiry: null }
    });

    await ActivityService.log(user.id, "RESET_PASSWORD", "Password reset successfully");
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ==============================
// 3. SYSTEM INITIALIZATION & SETUP (FIXED)
// ==============================

router.post('/setup', async (req: Request, res: Response) => {
  const envPath = path.join(process.cwd(), '.env');

  // 1. Initial Check: Prevent overwrite if already installed
  try {
    if (fs.existsSync(envPath)) {
        // Create a temporary client to check if the DB is actually populated
        // We can't use the global 'prisma' because it might be using old/empty env vars
        // This check prevents malicious overwrites of a working system
        require('dotenv').config(); 
        if (process.env.DATABASE_URL) {
            const checkClient = new PrismaClient();
            const userCount = await checkClient.user.count().catch(() => 0);
            await checkClient.$disconnect();
            
            if (userCount > 0) {
                return res.status(403).json({ error: "System already initialized. Please login." });
            }
        }
    }
  } catch(e) { /* Ignore errors on fresh install */ }

  const { 
    dbHost, dbPort, dbUser, dbPassword, dbName,
    adminEmail, adminPassword 
  } = req.body;

  let tempPrisma: PrismaClient | null = null;

  try {
    // 2. CRITICAL FIX: URL Encode credentials to handle special chars (@, #, etc.)
    const encodedUser = encodeURIComponent(dbUser);
    const encodedPass = encodeURIComponent(dbPassword);
    
    // 3. Generate Configuration
    const newJwtSecret = crypto.randomBytes(32).toString('hex');
    const puppeteerPath = getPuppeteerPath();
    // Construct the Safe URL
    const dbUrl = `mysql://${encodedUser}:${encodedPass}@${dbHost}:${dbPort}/${dbName}`;

    // 4. Write .env File to Disk
    // Note: This writes the file, but the RUNNING process doesn't see it yet.
    const envContent = `
PORT=5000
DATABASE_URL="${dbUrl}"
JWT_SECRET="${newJwtSecret}"
PUPPETEER_EXECUTABLE_PATH="${puppeteerPath}"
# --- END GENERATED CONFIG ---
`;
    fs.writeFileSync(envPath, envContent.trim());

    // 5. Run Database Schema Push (Wait for completion)
    console.log("Running database setup...");
    await new Promise<void>((resolve, reject) => {
        // FIX: Use 'db push' instead of 'migrate deploy'. 
        // 'db push' ignores migration history mismatches and forces the schema state.
        // We explicitly pass the DATABASE_URL env var to the child process 
        // because the parent process (this one) hasn't reloaded .env yet.
        exec('npx prisma db push --skip-generate --accept-data-loss', { 
            cwd: process.cwd(),
            env: { ...process.env, DATABASE_URL: dbUrl } 
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`DB Setup Failed: ${stderr}`);
                reject(new Error(`Database connection failed: ${stderr}`));
            } else {
                console.log(`DB Setup Success: ${stdout}`);
                resolve();
            }
        });
    });

    // 6. Connect & Create Admin User
    // We initialize a specific PrismaClient with the new URL to insert data immediately.
    tempPrisma = new PrismaClient({
        datasources: { db: { url: dbUrl } }
    });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create User
    const user = await tempPrisma.user.create({
        data: {
            email: adminEmail,
            password_hash: hashedPassword,
            role: 'SUDO_ADMIN'
        }
    });

    // 7. Initialize Default Settings
    await tempPrisma.systemSetting.createMany({
        data: [
            { key: 'SOFTWARE_NAME', value: 'InvoiceCore', is_locked: true },
            { key: 'SMTP_CONFIG', json_value: {} } // Placeholder to prevent null errors
        ]
    });
    
    // 8. Send Success Response
    res.json({ 
        success: true, 
        message: "Setup complete. Restarting system..." 
    });

    // 9. CRITICAL: Force PM2 Restart
    // The process MUST restart to load the new .env file into `process.env` 
    // for the global Prisma instance to work in future requests.
    console.log("Setup successful. Exiting process to trigger PM2 restart.");
    setTimeout(() => {
        process.exit(0); 
    }, 1000);

  } catch (error: any) {
    console.error("System Setup Error:", error);
    
    // Clean up the invalid .env file so the user can try again without manual deletion
    if (fs.existsSync(envPath)) {
        try { fs.unlinkSync(envPath); } catch(e) {}
    }
    
    res.status(500).json({ error: error.message || "Setup failed. Check database credentials." });
  } finally {
    if (tempPrisma) {
      await tempPrisma.$disconnect();
    }
  }
});

export default router;