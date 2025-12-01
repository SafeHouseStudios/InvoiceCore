import { Router } from 'express';
import { BackupService } from '../services/BackupService';
import multer from 'multer'; // You might need to install this: npm install multer

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store file in RAM

// GET: Download .iec Backup
router.get('/export', async (req, res) => {
  try {
    const data = await BackupService.exportData();
    const filename = `backup-${new Date().toISOString().split('T')[0]}.iec`;

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: "Export failed" });
  }
});

// POST: Restore from .iec file
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const fileContent = req.file.buffer.toString('utf-8');
    await BackupService.importData(fileContent);

    res.json({ message: "Data restored successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Import failed" });
  }
});

export default router;