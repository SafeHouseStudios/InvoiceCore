import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', async (req, res) => {
  try {
    // 1. Revenue Stats (Group by Month)
    const revenueData = await prisma.$queryRaw`
      SELECT DATE_FORMAT(issue_date, '%Y-%m') as month, SUM(grand_total) as amount 
      FROM Invoice WHERE status != 'DRAFT' 
      GROUP BY month ORDER BY month ASC LIMIT 12
    `;

    // 2. Expense Stats (Group by Month)
    const expenseData = await prisma.$queryRaw`
      SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as amount 
      FROM Expense 
      GROUP BY month ORDER BY month ASC LIMIT 12
    `;

    // 3. Yearly Totals
    const totalRevenue = await prisma.invoice.aggregate({ 
        _sum: { grand_total: true },
        where: { status: { not: 'DRAFT' } } 
    });
    
    const totalExpense = await prisma.expense.aggregate({ 
        _sum: { amount: true } 
    });

    const totalInvoicesCount = await prisma.invoice.count();

    res.json({
      revenueChart: revenueData,
      expenseChart: expenseData,
      totalInvoices: totalInvoicesCount,
      totalRevenue: totalRevenue._sum.grand_total || 0,
      totalExpense: totalExpense._sum.amount || 0,
      netProfit: (Number(totalRevenue._sum.grand_total || 0) - Number(totalExpense._sum.amount || 0))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Stats failed" });
  }
});

export default router;