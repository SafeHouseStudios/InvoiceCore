import { Router, Request, Response } from 'express';
import { ExpenseService } from '../services/ExpenseService';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET: List
router.get('/', async (req: Request, res: Response) => {
  try {
    const expenses = await ExpenseService.getAllExpenses();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// POST: Create
router.post('/', async (req: Request, res: Response) => {
  try {
    const { category, amount, date } = req.body;
    if (!category || !amount || !date) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    const expense = await ExpenseService.createExpense(req.body);
    
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(
        authReq.user.id, 
        "CREATE_EXPENSE", 
        `Recorded expense: ${category} - ${amount}`, 
        "EXPENSE", 
        expense.id.toString(), 
        ip as string
    );

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// DELETE: Delete
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await ExpenseService.deleteExpense(id);

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(
        authReq.user.id, 
        "DELETE_EXPENSE", 
        `Deleted expense ID #${id}`, 
        "EXPENSE", 
        id.toString(), 
        ip as string
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;