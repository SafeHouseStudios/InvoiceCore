import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/states', async (req, res) => {
  try {
    // @ts-ignore
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch states" });
  }
});

export default router;