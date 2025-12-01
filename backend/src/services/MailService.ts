// backend/src/services/MailService.ts
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { PdfService } from './PdfService';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export class MailService {

  // --- Helper: Get Transporter ---
  private static async getTransporter() {
    // @ts-ignore
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } });
    if (!setting || !setting.json_value) throw new Error("SMTP Settings not configured.");
    const config = setting.json_value as any;

    return nodemailer.createTransport({
      host: config.host,
      port: Number(config.port),
      secure: Number(config.port) === 465,
      auth: { user: config.user, pass: config.password },
    });
  }

  // --- Helper: Get Templates ---
  private static async getTemplates() {
    // @ts-ignore
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'EMAIL_TEMPLATES' } });
    
    // Default Templates if none exist
    const defaults = {
      invoice: {
        subject: "Invoice {{number}} from {{my_company}}",
        body: "Dear {{client}},\n\nPlease find attached Invoice {{number}} dated {{date}} for {{amount}}.\n\nRegards,\n{{my_company}}"
      },
      quotation: {
        subject: "Quotation {{number}} from {{my_company}}",
        body: "Dear {{client}},\n\nPlease find attached Quotation {{number}} dated {{date}}.\n\nRegards,\n{{my_company}}"
      }
    };

    return setting?.json_value ? { ...defaults, ...(setting.json_value as any) } : defaults;
  }

  // --- Helper: Parse Template ---
  private static parseTemplate(template: string, data: any) {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || "");
  }

  // --- 1. Send Invoice ---
  static async sendInvoice(invoiceId: number, toEmail: string) {
    const pdfBuffer = await PdfService.generateInvoicePdf(invoiceId);
    // @ts-ignore
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { client: true } });
    // @ts-ignore
    const owner = await prisma.systemSetting.findUnique({ where: { key: 'COMPANY_PROFILE' } });
    
    if (!invoice) throw new Error("Invoice not found");

    const transporter = await this.getTransporter();
    const templates = await this.getTemplates();
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } }); // Re-fetch for fromEmail
    const fromEmail = (setting?.json_value as any)?.fromEmail || "noreply@invoicecore.com";

    // Prepare Data for Placeholders
    const data = {
      number: invoice.invoice_number,
      client: invoice.client.company_name,
      my_company: (owner?.json_value as any)?.company_name || "Our Company",
      date: format(new Date(invoice.issue_date), "dd MMM yyyy"),
      amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(Number(invoice.grand_total)),
      status: invoice.status
    };

    const subject = this.parseTemplate(templates.invoice.subject, data);
    const text = this.parseTemplate(templates.invoice.body, data);

    await transporter.sendMail({
      from: `"${data.my_company}" <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      text: text,
      attachments: [{
        filename: `Invoice-${invoice.invoice_number.replace(/\//g, '-')}.pdf`,
        content: Buffer.from(pdfBuffer)
      }]
    });
    
    // @ts-ignore
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'SENT' } });
  }

  // --- 2. Send Test Email ---
  static async sendTestEmail(toEmail: string) {
    const transporter = await this.getTransporter();
    // @ts-ignore
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } });
    const fromEmail = (setting?.json_value as any)?.fromEmail || "noreply@invoicecore.com";

    await transporter.sendMail({
      from: `"InvoiceCore System" <${fromEmail}>`,
      to: toEmail,
      subject: "Test Email from InvoiceCore",
      text: "SMTP connection successful! You can now send emails.",
    });
  }
}