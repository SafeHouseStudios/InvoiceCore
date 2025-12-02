import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';
import { generateInvoiceHTML } from './templates/InvoiceTemplate';
import { generateQuotationHTML } from './templates/QuotationTemplate'; // Fixes Module Not Found
import Mustache from 'mustache';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export class PdfService {
  
  // ==============================
  // 1. GENERATE INVOICE PDF
  // ==============================
  static async generateInvoicePdf(invoiceId: number) {
    // A. Fetch Data
    // @ts-ignore
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        // @ts-ignore
        client: true, 
        // @ts-ignore
        bank_account: true 
      }
    });

    if (!invoice) throw new Error("Invoice not found");

    // B. Fetch Settings
    // @ts-ignore
    const ownerSettings = await prisma.systemSetting.findUnique({ where: { key: 'COMPANY_PROFILE' } });
    // @ts-ignore
    const templateSetting = await prisma.systemSetting.findUnique({ where: { key: 'INVOICE_TEMPLATE' } });

    let htmlContent = "";

    // FIX: Cast client addresses to ANY to avoid TS errors on JSON fields
    const clientAddress = (invoice.client.addresses as any);

    // C. Render Logic (Custom vs Default)
    if (templateSetting?.value) {
        // Prepare Data for Mustache
        const viewData = {
            invoice_number: invoice.invoice_number,
            issue_date: format(new Date(invoice.issue_date), "dd MMM yyyy"),
            due_date: invoice.due_date ? format(new Date(invoice.due_date), "dd MMM yyyy") : "",
            status: invoice.status,
            currency: invoice.currency,
            
            // Company Info
            company_name: (ownerSettings?.json_value as any)?.company_name,
            company_address: (ownerSettings?.json_value as any)?.address,
            company_gstin: (ownerSettings?.json_value as any)?.gstin,
            company_email: (ownerSettings?.json_value as any)?.email,
            company_phone: (ownerSettings?.json_value as any)?.phone,
            
            // Client Info (FIXED)
            client_name: invoice.client.company_name,
            client_address: `${clientAddress?.billing?.street || ''}, ${clientAddress?.billing?.city || ''}`,
            client_gstin: invoice.client.tax_id,

            // Items & Totals
            items: invoice.line_items,
            subtotal: Number(invoice.subtotal).toFixed(2),
            grand_total: Number(invoice.grand_total).toFixed(2),
            
            // Bank Info
            bank_name: invoice.bank_account?.bank_name,
            account_number: invoice.bank_account?.account_number,
            ifsc_code: invoice.bank_account?.ifsc_code,
            
            // Tax Breakdown
            // @ts-ignore
            tax_igst: invoice.tax_summary?.breakdown?.igst || 0,
            // @ts-ignore
            tax_cgst: invoice.tax_summary?.breakdown?.cgst || 0,
            // @ts-ignore
            tax_sgst: invoice.tax_summary?.breakdown?.sgst || 0,
        };

        htmlContent = Mustache.render(templateSetting.value, viewData);
    
    } else {
        htmlContent = generateInvoiceHTML(invoice, ownerSettings);
    }

    return await this.createPdf(htmlContent);
  }

  // ==============================
  // 2. GENERATE QUOTATION PDF
  // ==============================
  static async generateQuotationPdf(quotationId: number) {
    // A. Fetch Data
    // @ts-ignore
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { 
        // @ts-ignore
        client: true 
      }
    });

    if (!quotation) throw new Error("Quotation not found");

    // B. Fetch Settings
    // @ts-ignore
    const ownerSettings = await prisma.systemSetting.findUnique({ where: { key: 'COMPANY_PROFILE' } });
    // @ts-ignore
    const templateSetting = await prisma.systemSetting.findUnique({ where: { key: 'QUOTATION_TEMPLATE' } });

    let htmlContent = "";

    // FIX: Cast client addresses to ANY
    const clientAddress = (quotation.client.addresses as any);

    // C. Render Logic
    if (templateSetting?.value) {
        const viewData = {
            quotation_number: quotation.quotation_number,
            issue_date: format(new Date(quotation.issue_date), "dd MMM yyyy"),
            expiry_date: quotation.expiry_date ? format(new Date(quotation.expiry_date), "dd MMM yyyy") : "",
            status: quotation.status,
            currency: quotation.currency,
            
            company_name: (ownerSettings?.json_value as any)?.company_name,
            company_address: (ownerSettings?.json_value as any)?.address,
            company_email: (ownerSettings?.json_value as any)?.email,
            
            client_name: quotation.client.company_name,
            client_address: `${clientAddress?.billing?.street || ''}`,

            items: quotation.line_items,
            subtotal: Number(quotation.subtotal).toFixed(2),
            grand_total: Number(quotation.grand_total).toFixed(2),
            
            services_offered: quotation.services_offered,
            contract_terms: quotation.contract_terms,
            remarks: quotation.remarks
        };

        htmlContent = Mustache.render(templateSetting.value, viewData);
    } else {
        htmlContent = generateQuotationHTML(quotation, ownerSettings);
    }

    return await this.createPdf(htmlContent);
  }

  // ==============================
  // 3. CORE PUPPETEER ENGINE
  // ==============================
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
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();
    return pdfBuffer;
  }
}