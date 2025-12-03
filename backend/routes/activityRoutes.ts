import { Router, Request, Response } from 'express';
import { ActivityService } from '../services/ActivityService';

const router = Router();

// GET: Recent Activity Logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await ActivityService.getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

export default router;