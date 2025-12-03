import { Router, Request, Response } from 'express';
import { QuotationService } from '../services/QuotationService';
import { PdfService } from '../services/PdfService';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/:id/pdf', async (req, res) => {
  try {
    const pdf = await PdfService.generateQuotationPdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdf));
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

router.get('/', async (req, res) => {
  const quotes = await QuotationService.getAllQuotations();
  res.json(quotes);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const quote = await QuotationService.createQuotation(req.body);
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "CREATE_QUOTE", `Quote #${quote.quotation_number}`, "QUOTATION", quote.id.toString(), ip as string);
    res.status(201).json(quote);
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

// Delete: Admin/Sudo Only
router.delete('/:id', authorize(['SUDO_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    await QuotationService.deleteQuotation(Number(req.params.id));
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(authReq.user.id, "DELETE_QUOTE", `Deleted Quote #${req.params.id}`, "QUOTATION", req.params.id, ip as string);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Failed" }); }
});

export default router;