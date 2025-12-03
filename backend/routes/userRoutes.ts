import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest, authorize } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET: List Users (Admins can view)
router.get('/', authorize(['SUDO_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, two_factor_enabled: true, created_at: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST: Create User (SUDO ONLY)
router.post('/', authorize(['SUDO_ADMIN']), async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) return res.status(400).json({ error: "Email and Password are required" });

    // Prevent creating another Sudo Admin via this API (Safety check)
    if (role === 'SUDO_ADMIN') {
        return res.status(403).json({ error: "Cannot create Sudo Admin via this interface." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: role || 'USER'
      }
    });

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(
        authReq.user.id, 
        "CREATE_USER", 
        `Created user: ${email} as ${role}`, 
        "USER", 
        newUser.id.toString(), 
        ip as string
    );

    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// DELETE: Remove User (SUDO ONLY)
router.delete('/:id', authorize(['SUDO_ADMIN']), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const authReq = req as AuthRequest;

    // Prevent self-deletion
    if (id === authReq.user.id) {
        return res.status(400).json({ error: "Cannot delete yourself" });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: "User not found" });

    // Prevent deleting other Sudo Admins (if multiple existed)
    if (target.role === 'SUDO_ADMIN') {
        return res.status(403).json({ error: "Cannot delete the Owner" });
    }
    
    await prisma.user.delete({ where: { id } });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(
        authReq.user.id, 
        "DELETE_USER", 
        `Deleted user: ${target.email}`, 
        "USER", 
        id.toString(), 
        ip as string
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;