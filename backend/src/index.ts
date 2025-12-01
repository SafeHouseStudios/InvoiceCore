import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import invoiceRoutes from './routes/invoiceRoutes';
import clientRoutes from './routes/clientRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import settingRoutes from './routes/settingRoutes';
import authRoutes from './routes/authRoutes';
import { authenticateToken } from './middleware/authMiddleware';
import backupRoutes from './routes/backupRoutes';
import utilRoutes from './routes/utilRoutes';

// 1. Initialize Configuration
dotenv.config();

// 2. Create the App
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 1. PUBLIC ROUTES (No Token Required)
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', system: 'InvoiceCore' });
});

// 2. MIDDLEWARE (Locks everything below this line)
app.use(authenticateToken);

// 3. PROTECTED ROUTES (Token Required)
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/utils', utilRoutes);

// 6. Start Server
app.listen(PORT, () => {
  console.log(`[InvoiceCore] Server running on port ${PORT}`);
  console.log(`[System] GST Logic Module: READY`); 
});