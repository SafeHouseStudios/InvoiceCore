import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateInvoiceDTO {
  clientId: number;
  issueDate: string;
  dueDate?: string;
  items: any[];
  taxSummary: any;
  subtotal: number;
  grandTotal: number;
  isManual: boolean;
  manualNumber?: string;
  remarks?: string;
  bankAccountId?: number;
}

export class InvoiceService {
  
  private static getFiscalYear(date: Date): string {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const shortYear = year % 100;
    return month >= 4 ? `${shortYear}-${shortYear + 1}` : `${shortYear - 1}-${shortYear}`;
  }

  static async createInvoice(data: CreateInvoiceDTO) {
    return await prisma.$transaction(async (tx) => {
      const dateObj = new Date(data.issueDate);
      let invoiceNumber = data.manualNumber;

      // 1. Auto-Generation Logic
      if (!data.isManual || !invoiceNumber) {
        
        // A. Fetch Format Settings
        // @ts-ignore
        const setting = await tx.systemSetting.findUnique({ where: { key: 'DOCUMENT_SETTINGS' } });
        const format = (setting?.json_value as any)?.invoice_format || "INV/{FY}/{SEQ:3}";

        // B. Determine Fiscal Year (Key for Sequence)
        const fy = this.getFiscalYear(dateObj);

        // C. Get Next Sequence
        // @ts-ignore
        let sequence = await tx.invoiceSequence.findUnique({ where: { fiscal_year: fy } });
        if (!sequence) {
          // @ts-ignore
          sequence = await tx.invoiceSequence.create({ data: { fiscal_year: fy, last_count: 0 } });
        }
        const nextCount = sequence.last_count + 1;

        // D. Update Sequence
        // @ts-ignore
        await tx.invoiceSequence.update({ where: { id: sequence.id }, data: { last_count: nextCount } });

        // E. Parse Format String
        // Replace {FY} -> 24-25
        // Replace {YYYY} -> 2024
        // Replace {MM} -> 12
        // Replace {SEQ:n} -> 001
        let numStr = format
            .replace('{FY}', fy)
            .replace('{YYYY}', dateObj.getFullYear().toString())
            .replace('{MM}', (dateObj.getMonth() + 1).toString().padStart(2, '0'))
            .replace('{DD}', dateObj.getDate().toString().padStart(2, '0'));

        // Handle Sequence Padding
        const seqMatch = numStr.match(/{SEQ(?::(\d+))?}/);
        if (seqMatch) {
            const padding = seqMatch[1] ? parseInt(seqMatch[1]) : 3;
            numStr = numStr.replace(seqMatch[0], nextCount.toString().padStart(padding, '0'));
        } else {
            // Safety Fallback
            numStr = `${numStr}-${nextCount}`;
        }

        invoiceNumber = numStr;
      } else {
        // Manual Check
        // @ts-ignore
        const existing = await tx.invoice.findUnique({ where: { invoice_number: invoiceNumber } });
        if (existing) throw new Error(`Invoice number ${invoiceNumber} already exists.`);
      }

      // 2. Create Record
      // @ts-ignore
      return await tx.invoice.create({
        data: {
          invoice_number: invoiceNumber!,
          client_id: data.clientId,
          issue_date: dateObj,
          due_date: data.dueDate ? new Date(data.dueDate) : null,
          status: 'DRAFT',
          line_items: data.items,
          tax_summary: data.taxSummary,
          subtotal: data.subtotal,
          grand_total: data.grandTotal,
          is_manual_entry: data.isManual,
          remarks: data.remarks,
          bank_account_id: data.bankAccountId
        }
      });
    });
  }
}