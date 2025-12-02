// backend/src/services/PdfService.ts
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';
import { generateInvoiceHTML } from './templates/InvoiceTemplate';
import { generateQuotationHTML } from './templates/QuotationTemplate';

const prisma = new PrismaClient();

export class PdfService {
  
  static async generateInvoicePdf(invoiceId: number) {
    // @ts-ignore
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, bank_account: true }
    });

    if (!invoice) throw new Error("Invoice not found");

    // @ts-ignore
    const ownerSettings = await prisma.systemSetting.findUnique({ 
      where: { key: 'COMPANY_PROFILE' } 
    });

    // Generate HTML using the new template
    const htmlContent = generateInvoiceHTML(invoice, ownerSettings);

    return await this.createPdf(htmlContent);
  }

  static async generateQuotationPdf(quotationId: number) {
    // @ts-ignore
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { client: true, bank_account: true }
    });

    if (!quotation) throw new Error("Quotation not found");

    // @ts-ignore
    const ownerSettings = await prisma.systemSetting.findUnique({ 
      where: { key: 'COMPANY_PROFILE' } 
    });

    const htmlContent = generateQuotationHTML(quotation, ownerSettings);
    
    return await this.createPdf(htmlContent);
  }

  private static async createPdf(html: string) {
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    });

    await browser.close();
    return pdfBuffer;
  }
}