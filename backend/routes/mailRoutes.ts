import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { PdfService } from '../services/PdfService';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// CONFIG
router.get('/config', async (req, res) => { /* ... */ });

router.post('/config', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    await prisma.systemSetting.upsert({
      where: { key: 'SMTP_CONFIG' },
      update: { json_value: config },
      create: { key: 'SMTP_CONFIG', json_value: config }
    });

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "UPDATE_SMTP", "Updated SMTP Settings", "SETTINGS", "SMTP", ip as string);

    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Failed to save SMTP" }); }
});

// TEMPLATES
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const templates = req.body;
    await prisma.systemSetting.upsert({
      where: { key: 'EMAIL_TEMPLATES' },
      update: { json_value: templates },
      create: { key: 'EMAIL_TEMPLATES', json_value: templates }
    });

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "UPDATE_EMAIL_TMPL", "Updated Email Templates", "SETTINGS", "EMAIL", ip as string);

    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Failed to save templates" }); }
});

// SEND INVOICE
router.post('/invoice/:id', async (req: Request, res: Response) => {
  try {
    const invoiceId = Number(req.params.id);
    const { email } = req.body;
    
    // ... PDF generation & SMTP logic (same as before) ...
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { client: true } });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    const pdfBuffer = await PdfService.generateInvoicePdf(invoiceId);
    const smtpSetting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } });
    if (!smtpSetting?.json_value) return res.status(400).json({ error: "SMTP not configured" });
    const smtp = smtpSetting.json_value as any;
    
    const transporter = nodemailer.createTransport({
      host: smtp.host, port: Number(smtp.port), secure: Number(smtp.port) === 465,
      auth: { user: smtp.user, pass: smtp.password }
    });

    await transporter.sendMail({
      from: smtp.fromEmail || smtp.user, to: email,
      subject: `Invoice ${invoice.invoice_number}`, text: "Please find attached.",
      attachments: [{ filename: `Invoice-${invoice.invoice_number}.pdf`, content: Buffer.from(pdfBuffer) }]
    });

    // LOG
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "SEND_INVOICE", `Sent Invoice #${invoice.invoice_number} to ${email}`, "INVOICE", invoiceId.toString(), ip as string);

    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// TEST
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    // ... SMTP fetch ...
    const smtpSetting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } });
    if (!smtpSetting?.json_value) return res.status(400).json({ error: "SMTP not configured" });
    const smtp = smtpSetting.json_value as any;

    const transporter = nodemailer.createTransport({
      host: smtp.host, port: Number(smtp.port), secure: Number(smtp.port) === 465,
      auth: { user: smtp.user, pass: smtp.password }
    });

    await transporter.sendMail({ from: smtp.fromEmail, to: email, subject: "Test", text: "Test" });

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "TEST_EMAIL", `Sent test email to ${email}`, "MAIL", "TEST", ip as string);

    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

export default router;