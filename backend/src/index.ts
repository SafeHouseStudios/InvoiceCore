import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import invoiceRoutes from './routes/invoiceRoutes';

// 1. Initialize Configuration
dotenv.config();

// 2. Create the App
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. Routes (MUST come after "const app = express()")
app.use('/api/invoices', invoiceRoutes);

// 5. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', system: 'InvoiceCore Backend', version: '1.0.0' });
});

// 6. Start Server
app.listen(PORT, () => {
  console.log(`[InvoiceCore] Server running on port ${PORT}`);
  console.log(`[System] GST Logic Module: READY`); 
});