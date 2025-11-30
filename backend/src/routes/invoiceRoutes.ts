// backend/src/routes/invoiceRoutes.ts
import { Router } from 'express';
import { TaxService } from '../services/TaxService';

const router = Router();

// Endpoint: POST /api/invoices/calculate-tax
router.post('/calculate-tax', async (req, res) => {
  try {
    const { clientStateCode, clientCountry } = req.body;

    if (!clientStateCode) {
      return res.status(400).json({ error: "Client State Code is required" });
    }

    const taxLogic = await TaxService.calculateTaxType(Number(clientStateCode), clientCountry);
    res.json(taxLogic);

  } catch (error) {
    console.error("Tax Calculation Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;