import { Router, Request, Response } from 'express';
import { BankService } from '../services/BankService';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET: List
router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await BankService.getAllAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bank accounts" });
  }
});

// POST: Create
router.post('/', async (req: Request, res: Response) => {
  try {
    const account = await BankService.createAccount(req.body);
    
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(
        authReq.user.id, "CREATE_BANK", `Added Bank Account: ${account.label}`, "BANK", account.id.toString(), ip as string
    );

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: "Failed to create bank account" });
  }
});

// PUT: Update
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const account = await BankService.updateAccount(id, req.body);

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(
        authReq.user.id, "UPDATE_BANK", `Updated Bank Account: ${account.label}`, "BANK", id.toString(), ip as string
    );

    res.json(account);
  } catch (error) {
    res.status(500).json({ error: "Failed to update bank account" });
  }
});

// PATCH: Set Default
router.patch('/:id/default', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await BankService.setAsDefault(id);
    
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(authReq.user.id, "DEFAULT_BANK", `Set Bank #${id} as default`, "BANK", id.toString(), ip as string);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update default status" });
  }
});

// DELETE: Delete
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await BankService.deleteAccount(id);

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(authReq.user.id, "DELETE_BANK", `Deleted Bank Account #${id}`, "BANK", id.toString(), ip as string);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;