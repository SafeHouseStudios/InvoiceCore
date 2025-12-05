import { Router, Request, Response } from 'express';
import { InvoiceService } from '../services/InvoiceService';
import { PdfService } from '../services/PdfService';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest, authorize } from '../middleware/authMiddleware';

const router = Router();

// ==================================================================
// 1. SPECIFIC ROUTES (MUST COME FIRST)
// ==================================================================

// Fetch Shared Invoices (Sent/Paid/Overdue)
// This MUST be before /:id, otherwise "shared" is treated as an ID
router.get('/shared', async (req, res) => {
  try {
    const invoices = await InvoiceService.getSharedInvoices();
    res.json(invoices);
  } catch (e) {
    console.error("Error fetching shared invoices:", e);
    res.status(500).json({ error: "Failed to fetch shared invoices" });
  }
});

router.post('/calculate-tax', async (req, res) => {
  try {
    const { clientStateCode, clientCountry } = req.body;
    const taxResult = await InvoiceService.calculateTax(clientStateCode, clientCountry);
    res.json(taxResult);
  } catch (e) {
    res.status(500).json({ error: "Tax calculation failed" });
  }
});

// Get All Invoices
router.get('/', async (req, res) => {
  const invoices = await InvoiceService.getAllInvoices();
  res.json(invoices);
});

// Create Invoice
router.post('/', async (req: Request, res: Response) => {
  try {
    const invoice = await InvoiceService.createInvoice(req.body);
    
    // Log Activity
    const authReq = req as AuthRequest;
    if (authReq.user) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await ActivityService.log(authReq.user.id, "CREATE_INVOICE", `Created Invoice #${invoice.invoice_number}`, "INVOICE", invoice.id.toString(), ip as string);
    }
    
    res.status(201).json(invoice);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// ==================================================================
// 2. GENERIC ID ROUTES (MUST COME LAST)
// ==================================================================

// Generate PDF (Specific ID action)
router.get('/:id/pdf', async (req, res) => {
  try {
    const pdfBuffer = await PdfService.generateInvoicePdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${req.params.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "PDF Generation Failed" });
  }
});

// Get Single Invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const invoice = await InvoiceService.getInvoiceById(id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// Update Invoice
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await InvoiceService.updateInvoice(Number(req.params.id), req.body);
    
    const authReq = req as AuthRequest;
    if (authReq.user) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await ActivityService.log(authReq.user.id, "UPDATE_INVOICE", `Updated Invoice #${invoice.invoice_number}`, "INVOICE", invoice.id.toString(), ip as string);
    }

    res.json(invoice);
  } catch (e) {
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// Delete Invoice
router.delete('/:id', authorize(['SUDO_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    await InvoiceService.deleteInvoice(Number(req.params.id));
    
    const authReq = req as AuthRequest;
    if (authReq.user) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await ActivityService.log(authReq.user.id, "DELETE_INVOICE", `Deleted Invoice ID #${req.params.id}`, "INVOICE", req.params.id, ip as string);
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;