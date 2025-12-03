import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET: List
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, two_factor_enabled: true, created_at: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST: Create
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email/Pass required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { email, password_hash: hashedPassword, role: role || 'USER' }
    });

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(
        authReq.user.id, "CREATE_USER", `Created user: ${email}`, "USER", newUser.id.toString(), ip as string
    );

    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// DELETE: Delete
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const target = await prisma.user.findUnique({ where: { id } });
    
    await prisma.user.delete({ where: { id } });

    if (target) {
        const authReq = req as AuthRequest;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await ActivityService.log(
            authReq.user.id, "DELETE_USER", `Deleted user: ${target.email}`, "USER", id.toString(), ip as string
        );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;