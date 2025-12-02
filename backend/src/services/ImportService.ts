import fs from 'fs';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ImportService {

  // --- 1. CLIENTS IMPORT ---
  static async importClients(filePath: string) {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row) => {
          if (row.company_name) {
            results.push({
              company_name: row.company_name,
              email: row.email || null,
              phone: row.phone || null,
              tax_id: row.gst || row.tax_id || null,
              state_code: row.state_code ? parseInt(row.state_code) : null,
              country: row.country || 'India',
              addresses: {
                billing: { street: row.address || '', city: row.city || '', zip: row.zip || '' }
              }
            });
          }
        })
        .on('error', (error) => reject(error))
        .on('end', async () => {
          try {
            // @ts-ignore
            const count = await prisma.client.createMany({ data: results, skipDuplicates: true });
            fs.unlinkSync(filePath);
            resolve({ imported: count.count, total: results.length });
          } catch (dbError) { reject(dbError); }
        });
    });
  }

  // --- 2. INVOICES IMPORT ---
  static async importInvoices(filePath: string) {
    const rows: any[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row) => rows.push(row))
        .on('error', (err) => reject(err))
        .on('end', async () => {
          let imported = 0;
          for (const row of rows) {
            // Req: invoice_number, client_email, date, amount
            if (!row.invoice_number || !row.client_email || !row.amount) continue;

            try {
              // Find Client
              // @ts-ignore
              const client = await prisma.client.findFirst({ where: { email: row.client_email } });
              if (!client) continue; // Skip if client not found

              const amount = parseFloat(row.amount);
              
              // @ts-ignore
              await prisma.invoice.create({
                data: {
                  invoice_number: row.invoice_number,
                  client_id: client.id,
                  issue_date: new Date(row.date || new Date()),
                  due_date: new Date(row.due_date || new Date()),
                  status: row.status?.toUpperCase() || 'PAID',
                  grand_total: amount,
                  subtotal: amount,
                  // Placeholder Data
                  tax_summary: { taxType: 'NONE', breakdown: { cgst:0, sgst:0, igst:0 } },
                  line_items: [{ description: "Legacy Data Import", quantity: 1, rate: amount, amount: amount }],
                  is_manual_entry: true
                }
              });
              imported++;
            } catch (e) { console.log("Skip duplicate:", row.invoice_number); }
          }
          fs.unlinkSync(filePath);
          resolve({ imported, total: rows.length });
        });
    });
  }

  // --- 3. QUOTATIONS IMPORT ---
  static async importQuotations(filePath: string) {
    const rows: any[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row) => rows.push(row))
        .on('error', (err) => reject(err))
        .on('end', async () => {
          let imported = 0;
          for (const row of rows) {
            if (!row.quote_number || !row.client_email || !row.amount) continue;

            try {
              // @ts-ignore
              const client = await prisma.client.findFirst({ where: { email: row.client_email } });
              if (!client) continue;

              const amount = parseFloat(row.amount);

              // @ts-ignore
              await prisma.quotation.create({
                data: {
                  quotation_number: row.quote_number,
                  client_id: client.id,
                  issue_date: new Date(row.date || new Date()),
                  status: row.status?.toUpperCase() || 'DRAFT',
                  grand_total: amount,
                  subtotal: amount,
                  line_items: [{ description: "Legacy Quote Import", quantity: 1, rate: amount, amount: amount }],
                }
              });
              imported++;
            } catch (e) { console.log("Skip duplicate quote:", row.quote_number); }
          }
          fs.unlinkSync(filePath);
          resolve({ imported, total: rows.length });
        });
    });
  }
}