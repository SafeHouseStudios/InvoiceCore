import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LedgerService {

  static async getLedger(from?: string, to?: string) {
    // 1. Build Date Filter
    const dateFilter: any = {};
    if (from && to) {
        dateFilter.gte = new Date(from);
        dateFilter.lte = new Date(to);
    }

    // 2. Fetch Income (Strictly 'PAID' or 'Paid')
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['PAID', 'Paid'] }, 
        issue_date: dateFilter 
      },
      select: {
        id: true,
        invoice_number: true,
        issue_date: true,
        grand_total: true,
        client: { select: { company_name: true } }
      }
    });

    // 3. Fetch Expenses
    const expenses = await prisma.expense.findMany({
      where: { date: dateFilter },
      select: {
        id: true,
        date: true,
        category: true,
        amount: true,
        description: true
      }
    });

    // 4. Normalize & Fix Decimal Conversion
    const creditEntries = invoices.map(inv => ({
      id: `INV-${inv.id}`,
      date: inv.issue_date,
      description: `Invoice #${inv.invoice_number} - ${inv.client.company_name}`,
      category: 'Sales / Revenue',
      type: 'CREDIT',
      // FIX: Use .toString() to handle Prisma Decimal objects correctly
      amount: Number(inv.grand_total?.toString() || 0)
    }));

    const debitEntries = expenses.map(exp => ({
      id: `EXP-${exp.id}`,
      date: exp.date,
      description: exp.description || 'Expense Record',
      category: exp.category,
      type: 'DEBIT',
      // FIX: Use .toString()
      amount: Number(exp.amount?.toString() || 0)
    }));

    // 5. Combine & Sort
    const ledger = [...creditEntries, ...debitEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return ledger;
  }
}