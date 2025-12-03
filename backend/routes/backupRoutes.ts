import { Router, Request, Response } from 'express';
import { BackupService } from '../services/BackupService';
import { ActivityService } from '../services/ActivityService';
import { AuthRequest } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();
// Memory storage is used to handle the file buffer directly without saving to disk first
const upload = multer({ storage: multer.memoryStorage() }); 

// GET: Download .iec Backup
router.get('/export', async (req: Request, res: Response) => {
  try {
    const data = await BackupService.exportData();
    const filename = `invoicecore-backup-${new Date().toISOString().split('T')[0]}.iec`;

    // Optional: Log export action (Good for auditing who downloaded data)
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(
        authReq.user.id, 
        "EXPORT_BACKUP", 
        "Downloaded system backup", 
        "SYSTEM", 
        "BACKUP", 
        ip as string
    );

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ error: "Backup export failed" });
  }
});

// POST: Restore from .iec file
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
        return res.status(400).json({ error: "No backup file provided" });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    await BackupService.importData(fileContent);

    // CRITICAL: Log this security event
    const authReq = req as AuthRequest;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await ActivityService.log(
        authReq.user.id, 
        "RESTORE_BACKUP", 
        "Restored System Data from Backup File", 
        "SYSTEM", 
        "BACKUP", 
        ip as string
    );

    res.json({ success: true, message: "System restored successfully!" });
  } catch (error: any) {
    console.error("Restore Error:", error);
    res.status(500).json({ error: error.message || "Import failed" });
  }
});

export default router;