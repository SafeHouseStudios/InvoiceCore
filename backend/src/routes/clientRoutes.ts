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

// DELETE: Remove Client
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Optional: Check if client has invoices first to prevent orphan data
    // For now, we will allow it but database foreign keys might restrict it
    // depending on your schema setup (ON DELETE RESTRICT vs CASCADE)
    
    // @ts-ignore
    await prisma.client.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete client (Check if they have linked invoices)" });
  }
});

// GET: Single Client
router.get('/:id', async (req, res) => {
  try {
    // @ts-ignore
    const client = await prisma.client.findUnique({ where: { id: Number(req.params.id) } });
    if (!client) return res.status(404).json({ error: "Not found" });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// PUT: Update Client
router.put('/:id', async (req, res) => {
  try {
    const { company_name, tax_id, state_code, country, email, phone, address_street, address_city, address_zip } = req.body;
    
    // @ts-ignore
    await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: {
        company_name, tax_id, state_code: Number(state_code), country, email, phone,
        addresses: { billing: { street: address_street, city: address_city, zip: address_zip } }
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;