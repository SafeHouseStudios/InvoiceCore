import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// POST: Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find User
    // @ts-ignore
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 2. Check Password
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 3. Create Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '12h' } // Token lasts 12 hours
    );

    res.json({ token, user: { email: user.email, role: user.role } });

  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// POST: Register First Admin (Run this once via Postman/Curl, then delete or protect)
router.post('/register-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // @ts-ignore
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: 'ADMIN'
      }
    });

    res.json({ message: "Admin created", userId: user.id });
  } catch (error) {
    res.status(500).json({ error: "Could not create user" });
  }
});

export default router;