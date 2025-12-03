import { Router, Request, Response } from 'express';
import { QuotationService } from '../services/QuotationService';
import { PdfService } from '../services/PdfService';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET: Generate PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const pdfBuffer = await PdfService.generateQuotationPdf(id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// GET: List All
router.get('/', async (req: Request, res: Response) => {
  try {
    const quotes = await QuotationService.getAllQuotations();
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
});

// GET: Single
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const quote = await QuotationService.getQuotationById(Number(req.params.id));
    if (!quote) return res.status(404).json({ error: "Quotation not found" });
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quotation" });
  }
});

// POST: Create
router.post('/', async (req: Request, res: Response) => {
  try {
    const quote = await QuotationService.createQuotation(req.body);
    
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    await ActivityService.log(
        authReq.user.id, 
        "CREATE_QUOTE", 
        `Created Quotation #${quote.quotation_number}`, 
        "QUOTATION", 
        quote.id.toString(), 
        ip as string
    );

    res.status(201).json(quote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create quotation" });
  }
});

// PUT: Update
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await QuotationService.updateQuotation(id, req.body);

    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await ActivityService.log(
        authReq.user.id, 
        "UPDATE_QUOTE", 
        `Updated Quotation #${updated.quotation_number}`, 
        "QUOTATION", 
        id.toString(), 
        ip as string
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update quotation" });
  }
});

// DELETE: Delete
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const quote = await prisma.quotation.findUnique({ where: { id } });

    await QuotationService.deleteQuotation(id);

    if (quote) {
        const authReq = req as AuthRequest;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        await ActivityService.log(
            authReq.user.id, 
            "DELETE_QUOTE", 
            `Deleted Quotation #${quote.quotation_number}`, 
            "QUOTATION", 
            id.toString(), 
            ip as string
        );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete quotation" });
  }
});

export default router;