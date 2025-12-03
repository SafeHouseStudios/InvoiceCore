import { Router, Request, Response } from 'express';
import { InvoiceService } from '../services/InvoiceService';
import { PdfService } from '../services/PdfService';
import { TaxService } from '../services/TaxService';
import { ActivityService } from '../services/ActivityService';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authorize } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const router = Router();

router.post('/calculate-tax', async (req, res) => {
  try {
    const { clientStateCode, clientCountry } = req.body;
    const taxLogic = await TaxService.calculateTaxType(Number(clientStateCode), clientCountry);
    res.json(taxLogic);
  } catch (e) { res.status(500).json({ error: "Tax calc failed" }); }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pdfData = await PdfService.generateInvoicePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${id}.pdf`);
    res.send(Buffer.from(pdfData));
  } catch (e) { res.status(500).json({ error: "PDF failed" }); }
});

router.get('/', async (req, res) => {
  const invoices = await prisma.invoice.findMany({ include: { client: true }, orderBy: { created_at: 'desc' } });
  res.json(invoices);
});

router.get('/:id', async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(req.params.id) }, include: { client: true, bank_account: true } });
  if (!invoice) return res.status(404).json({ error: "Not found" });
  res.json(invoice);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const invoice = await InvoiceService.createInvoice(req.body);
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "CREATE_INVOICE", `Invoice #${invoice.invoice_number}`, "INVOICE", invoice.id.toString(), ip as string);
    res.status(201).json(invoice);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await InvoiceService.updateInvoice(Number(req.params.id), req.body);
    res.json(updated);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.invoice.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } });
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "UPDATE_STATUS", `Inv #${updated.invoice_number} -> ${req.body.status}`, "INVOICE", updated.id.toString(), ip as string);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: "Update failed" }); }
});

// DELETE: Admins Only
router.delete('/:id', authorize(['SUDO_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    await InvoiceService.deleteInvoice(Number(req.params.id));
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "DELETE_INVOICE", `Deleted Invoice #${req.params.id}`, "INVOICE", req.params.id, ip as string);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Delete failed" }); }
});

export default router;