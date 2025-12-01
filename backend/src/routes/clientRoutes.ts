import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET: List all clients (for the dropdown and table)
router.get('/', async (req, res) => {
  try {
    // @ts-ignore
    const clients = await prisma.client.findMany({
      orderBy: { company_name: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// POST: Create a new client
router.post('/', async (req, res) => {
  try {
    const { company_name, tax_id, state_code, country, email, phone, address_street, address_city, address_zip } = req.body;

    // Construct the address JSON object
    const addressJson = {
      billing: {
        street: address_street,
        city: address_city,
        zip: address_zip
      }
    };

    // @ts-ignore
    const newClient = await prisma.client.create({
      data: {
        company_name,
        tax_id,
        state_code: Number(state_code), // Ensure it's an Int
        country: country || 'India',
        email,
        phone,
        addresses: addressJson // Save as JSON
      }
    });

    res.status(201).json(newClient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

export default router;