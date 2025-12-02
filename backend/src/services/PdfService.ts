// @ts-nocheck
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';
import { generateInvoiceHTML } from './templates/InvoiceTemplate';
import { generateQuotationHTML } from './templates/QuotationTemplate';
import Mustache from 'mustache';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export class PdfService {
  
  static async generateInvoicePdf(invoiceId: number) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, bank_account: true }
    });

    if (!invoice) throw new Error("Invoice not found");

    const ownerSettings = await prisma.systemSetting.findUnique({ where: { key: 'COMPANY_PROFILE' } });
    
    // Force bypass of DB template to ensure new code is used
    const templateSetting = null; 

    let htmlContent = "";

    if (templateSetting?.value) {
        // Legacy Mustache Logic (Skipped for now)
        htmlContent = ""; 
    } else {
        // Use the new Blue Dapper Template
        htmlContent = generateInvoiceHTML(invoice, ownerSettings);
    }

    return await this.createPdf(htmlContent);
  }

  static async generateQuotationPdf(quotationId: number) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { client: true }
    });

    if (!quotation) throw new Error("Quotation not found");

    const ownerSettings = await prisma.systemSetting.findUnique({ where: { key: 'COMPANY_PROFILE' } });
    
    htmlContent = generateQuotationHTML(quotation, ownerSettings);
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