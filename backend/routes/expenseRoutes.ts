import { Router, Request, Response } from 'express';
import { ExpenseService } from '../services/ExpenseService';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', async (req, res) => {
  const expenses = await ExpenseService.getAllExpenses();
  res.json(expenses);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const expense = await ExpenseService.createExpense(req.body);
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "CREATE_EXPENSE", `Expense: ${expense.category}`, "EXPENSE", expense.id.toString(), ip as string);
    res.status(201).json(expense);
  } catch (e) { res.status(500).json({ error: "Failed to create expense" }); }
});

// Delete restricted to Admins/Sudo
router.delete('/:id', authorize(['SUDO_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    await ExpenseService.deleteExpense(Number(req.params.id));
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "DELETE_EXPENSE", `Deleted Expense #${req.params.id}`, "EXPENSE", req.params.id, ip as string);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
});

export default router;