import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET: Fetch Company Profile
router.get('/company', async (req, res) => {
  try {
    // @ts-ignore
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'COMPANY_PROFILE' }
    });
    res.json(setting?.json_value || {});
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT: Update Company Profile
router.put('/company', async (req, res) => {
  try {
    // FIX: Added 'stamp' to the list of saved fields
    const { 
      company_name, address, state_code, gstin, phone, email, 
      bank_details, logo, signature, stamp 
    } = req.body;

    // @ts-ignore
    await prisma.systemSetting.upsert({
      where: { key: 'COMPANY_PROFILE' },
      update: {
        value: company_name,
        json_value: {
          company_name, address, state_code: Number(state_code), gstin, phone, email,
          bank_details,
          logo,       // Path to Logo
          signature,  // Path to Signature
          stamp       // <--- NEW: Path to Stamp
        }
      },
      create: {
        key: 'COMPANY_PROFILE',
        value: company_name,
        is_locked: true,
        json_value: {
          company_name, address, state_code: Number(state_code), gstin, phone, email,
          bank_details,
          logo,
          signature,
          stamp       // <--- NEW
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ==============================
// DOCUMENT SETTINGS (Formats)
// ==============================

// GET: Fetch Document Settings
router.get('/documents', async (req, res) => {
  try {
    // @ts-ignore
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'DOCUMENT_SETTINGS' }
    });
    
    // Default Formats
    const defaults = {
      invoice_format: "INV/{FY}/{SEQ:3}",
      quotation_format: "QTN/{FY}/{SEQ:3}",
      invoice_label: "INVOICE", // Requirement #18 (Custom Label)
      quotation_label: "QUOTATION"
    };

    res.json(setting?.json_value || defaults);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document settings" });
  }
});

// PUT: Update Document Settings
router.put('/documents', async (req, res) => {
  try {
    const { invoice_format, quotation_format, invoice_label, quotation_label } = req.body;

    // @ts-ignore
    await prisma.systemSetting.upsert({
      where: { key: 'DOCUMENT_SETTINGS' },
      update: {
        json_value: { invoice_format, quotation_format, invoice_label, quotation_label }
      },
      create: {
        key: 'DOCUMENT_SETTINGS',
        json_value: { invoice_format, quotation_format, invoice_label, quotation_label },
        is_locked: false
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// ==============================
// SEQUENCE MANAGEMENT (Start Number)
// ==============================

// PUT: Set Next Sequence Number
router.put('/sequence', async (req, res) => {
  try {
    const { type, next_number } = req.body; // type: 'INVOICE' | 'QUOTATION'
    
    if (!next_number || isNaN(Number(next_number))) {
        return res.status(400).json({ error: "Invalid number" });
    }

    // Determine current Fiscal Year (e.g., "24-25")
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const shortYear = year % 100;
    const fy = month >= 4 ? `${shortYear}-${shortYear + 1}` : `${shortYear - 1}-${shortYear}`;

    const newLastCount = Number(next_number) - 1; // If user wants 100, we set last_count to 99

    if (type === 'INVOICE') {
        // @ts-ignore
        await prisma.invoiceSequence.upsert({
            where: { fiscal_year: fy },
            update: { last_count: newLastCount },
            create: { fiscal_year: fy, last_count: newLastCount }
        });
    } else {
        // @ts-ignore
        await prisma.quotationSequence.upsert({
            where: { fiscal_year: fy },
            update: { last_count: newLastCount },
            create: { fiscal_year: fy, last_count: newLastCount }
        });
    }

    res.json({ success: true, message: `${type} sequence updated for FY ${fy}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update sequence" });
  }
});

export default router;