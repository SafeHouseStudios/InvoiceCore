import { Router } from 'express';
import { TaxService } from '../services/TaxService';
import { InvoiceService } from '../services/InvoiceService';
import { PdfService } from '../services/PdfService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Calculate Tax
router.post('/calculate-tax', async (req, res) => {
  try {
    const { clientStateCode, clientCountry } = req.body;
    if (!clientStateCode) return res.status(400).json({ error: "Client State Code is required" });
    const taxLogic = await TaxService.calculateTaxType(Number(clientStateCode), clientCountry);
    res.json(taxLogic);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create Invoice
router.post('/', async (req, res) => {
  try {
    const invoice = await InvoiceService.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// Update Invoice (NEW)
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await InvoiceService.updateInvoice(id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update invoice" });
  }
});

// GET Single Invoice (NEW - Required for Edit Page)
router.get('/:id', async (req, res) => {
    try {
      // @ts-ignore
      const invoice = await prisma.invoice.findUnique({
        where: { id: Number(req.params.id) },
        include: { client: true, bank_account: true }
      });
      if (!invoice) return res.status(404).json({ error: "Not found" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Fetch failed" });
    }
});

// GET All Invoices
router.get('/', async (req, res) => {
  try {
    // @ts-ignore
    const invoices = await prisma.invoice.findMany({
      include: { client: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const pdfBuffer = await PdfService.generateInvoicePdf(invoiceId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// Update Status
router.patch('/:id/status', async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const { status } = req.body;
    // @ts-ignore
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;