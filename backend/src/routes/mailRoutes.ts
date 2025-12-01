import { Router } from 'express';
import { MailService } from '../services/MailService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==============================
// 1. SMTP CONFIGURATION
// ==============================

// POST: Save SMTP Settings
router.post('/config', async (req, res) => {
  try {
    const { host, port, user, password, fromEmail } = req.body;
    
    // @ts-ignore
    await prisma.systemSetting.upsert({
      where: { key: 'SMTP_CONFIG' },
      update: {
        json_value: { host, port, user, password, fromEmail }
      },
      create: {
        key: 'SMTP_CONFIG',
        json_value: { host, port, user, password, fromEmail },
        is_locked: true
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save SMTP config" });
  }
});

// GET: Fetch SMTP Config (Exclude Password for Security)
router.get('/config', async (req, res) => {
  try {
    // @ts-ignore
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'SMTP_CONFIG' } });
    const config = setting?.json_value as any || {};
    
    // Don't send password back to UI
    res.json({ ...config, password: '' });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

// ==============================
// 2. EMAIL TEMPLATES
// ==============================

// GET: Fetch Email Templates
router.get('/templates', async (req, res) => {
  try {
    // @ts-ignore
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'EMAIL_TEMPLATES' } });
    
    // Default structure if empty
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

    res.json(setting?.json_value || defaults);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// POST: Save Email Templates
router.post('/templates', async (req, res) => {
  try {
    const templates = req.body; // { invoice: { subject, body }, quotation: { ... } }
    
    // @ts-ignore
    await prisma.systemSetting.upsert({
      where: { key: 'EMAIL_TEMPLATES' },
      update: { json_value: templates },
      create: { key: 'EMAIL_TEMPLATES', json_value: templates, is_locked: false }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save templates" });
  }
});

// ==============================
// 3. SENDING ACTIONS
// ==============================

// POST: Send Test Email
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    await MailService.sendTestEmail(email);
    res.json({ success: true, message: "Test email sent!" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to send test email" });
  }
});

// POST: Send Invoice
router.post('/invoice/:id', async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const { email } = req.body; // Allow overriding the client email if needed
    
    if (!email) return res.status(400).json({ error: "Recipient email is required" });

    await MailService.sendInvoice(invoiceId, email);
    res.json({ success: true, message: "Invoice sent successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to send invoice" });
  }
});

export default router;