import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest, authorize } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// List: Admins only
router.get('/', authorize(['SUDO_ADMIN', 'ADMIN']), async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, two_factor_enabled: true } });
  res.json(users);
});

// Create: Admins only
router.post('/', authorize(['SUDO_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({ data: { email, password_hash: hash, role: role || 'USER' } });
    
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "CREATE_USER", `Created user: ${email}`, "USER", user.id.toString(), ip as string);
    
    res.status(201).json({ id: user.id });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

// Delete: SUDO Only
router.delete('/:id', authorize(['SUDO_ADMIN']), async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "DELETE_USER", `Deleted User #${req.params.id}`, "USER", req.params.id, ip as string);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

export default router;