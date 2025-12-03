import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { ActivityService } from '../services/ActivityService';

const router = Router();
const prisma = new PrismaClient();

// --- HELPER: Dynamic Email Sender ---
async function sendEmail(to: string, subject: string, text: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } });
  
  if (!setting?.json_value) {
    throw new Error("SMTP not configured. Please configure Email Settings in the dashboard.");
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

// ==============================
// 1. LOGIN & AUTHENTICATION
// ==============================

router.post('/login', async (req, res) => {
  try {
    const { email, password, totpToken } = req.body;

    // 1. Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 2. Verify Password
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 3. Security: 2FA Enforcement
    if (user.two_factor_enabled) {
        if (!totpToken) {
            return res.json({ require2fa: true }); 
        }
        if (!user.two_factor_secret) {
             return res.status(500).json({ error: "2FA enabled but secret missing." });
        }
        const validTotp = authenticator.check(totpToken, user.two_factor_secret);
        if (!validTotp) {
            return res.status(400).json({ error: "Invalid 2FA Code" });
        }
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '12h' }
    );

    // 5. Log Activity
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
    res.status(500).json({ error: "Login failed" });
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

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    await sendEmail(email, "Password Reset Request", `Click here to reset: ${resetLink}`);

    await ActivityService.log(user.id, "FORGOT_PASSWORD", "Requested password reset link");

    res.json({ success: true, message: "Reset link sent to email." });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
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
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ==============================
// 3. SETUP & UTILS
// ==============================

// POST: Initial Admin Setup
router.post('/register-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        return res.status(403).json({ error: "System already initialized." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the SUPER ADMIN (Owner)
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: 'SUDO_ADMIN' // <--- Changed from ADMIN
      }
    });

    res.json({ message: "System initialized. Sudo Admin created.", userId: user.id });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Initialization failed" });
  }
});

export default router;