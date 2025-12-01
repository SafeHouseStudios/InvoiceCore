import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET: Fetch Company Profile
router.get('/company', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'COMPANY_PROFILE' }
    });
    
    // Return just the JSON value (the actual profile)
    res.json(setting?.json_value || {});
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT: Update Company Profile
router.put('/company', async (req, res) => {
  try {
    const { company_name, address, state_code, gstin, phone, email, bank_details } = req.body;

    // We store the "company_name" in the value column for easy searching,
    // and the rest in the JSON column for flexibility.
    await prisma.systemSetting.upsert({
      where: { key: 'COMPANY_PROFILE' },
      update: {
        value: company_name,
        json_value: {
          company_name, // Store name in JSON too for frontend consistency
          address,
          state_code: Number(state_code),
          gstin,
          phone,
          email,
          bank_details // { bank_name, ac_no, ifsc }
        }
      },
      create: {
        key: 'COMPANY_PROFILE',
        value: company_name,
        is_locked: true,
        json_value: {
          company_name,
          address,
          state_code: Number(state_code),
          gstin,
          phone,
          email,
          bank_details
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;