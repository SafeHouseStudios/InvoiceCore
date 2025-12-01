// backend/src/services/QuotationService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateQuotationDTO {
  clientId: number;
  issueDate: string;
  expiryDate?: string;
  items: any[];
  subtotal: number;
  grandTotal: number;
  remarks?: string;
  contractTerms?: string;
  currency?: string;
  bankAccountId?: number; // Added linkage
}

export class QuotationService {
  
  // --- NEW: List All ---
  static async getAllQuotations() {
    // @ts-ignore
    return await prisma.quotation.findMany({
      include: {
        // @ts-ignore
        client: true 
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // --- Helper: Get Fiscal Year ---
  private static getFiscalYear(date: Date): string {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const shortYear = year % 100;
    if (month >= 4) {
      return `${shortYear}-${shortYear + 1}`;
    } else {
      return `${shortYear - 1}-${shortYear}`;
    }
  }

  // --- Create ---
  static async createQuotation(data: CreateQuotationDTO) {
    return await prisma.$transaction(async (tx) => {
      const dateObj = new Date(data.issueDate);
      const fy = this.getFiscalYear(dateObj);

      // @ts-ignore
      let sequence = await tx.quotationSequence.findUnique({ where: { fiscal_year: fy } });

      if (!sequence) {
        // @ts-ignore
        sequence = await tx.quotationSequence.create({ data: { fiscal_year: fy, last_count: 0 } });
      }

      const nextCount = sequence.last_count + 1;
      const quotationNumber = `QTN/${fy}/${nextCount.toString().padStart(3, '0')}`;

      // @ts-ignore
      await tx.quotationSequence.update({ where: { id: sequence.id }, data: { last_count: nextCount } });

      // @ts-ignore
      return await tx.quotation.create({
        data: {
          quotation_number: quotationNumber,
          client_id: data.clientId,
          issue_date: dateObj,
          expiry_date: data.expiryDate ? new Date(data.expiryDate) : null,
          status: 'DRAFT',
          line_items: data.items,
          contract_terms: data.contractTerms,
          remarks: data.remarks,
          subtotal: data.subtotal,
          grand_total: data.grandTotal,
          currency: data.currency || 'INR',
          bank_account_id: data.bankAccountId
        }
      });
    });
  }
}