import { Router } from 'express';
import multer from 'multer';
import { ImportService } from '../services/ImportService';

const router = Router();
const upload = multer({ dest: 'uploads/temp/' });

// Clients
router.post('/clients', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const result = await ImportService.importClients(req.file.path) as any;
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: "Import failed" });
  }
});

// Invoices
router.post('/invoices', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const result = await ImportService.importInvoices(req.file.path) as any;
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: "Import failed" });
  }
});

// Quotations
router.post('/quotations', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const result = await ImportService.importQuotations(req.file.path) as any;
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: "Import failed" });
  }
});

export default router;