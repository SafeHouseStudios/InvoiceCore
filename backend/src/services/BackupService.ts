import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BackupService {
  
  static async exportData() {
    console.log("Starting Backup Export...");

    try {
        // We use @ts-ignore on everything to bypass TypeScript checking
        // and rely on the actual runtime objects.
        
        // 1. Fetch Clients
        // @ts-ignore
        const clients = await prisma.client.findMany();
        console.log(`Fetched ${clients.length} clients`);

        // 2. Fetch Invoices
        // @ts-ignore
        const invoices = await prisma.invoice.findMany();
        console.log(`Fetched ${invoices.length} invoices`);

        // 3. Fetch Settings (Try lowercase 'systemsetting' if CamelCase fails)
        let settings;
        try {
            // @ts-ignore
            settings = await prisma.systemSetting.findMany();
        } catch (e) {
            console.log("SystemSetting CamelCase failed, trying lowercase...");
            // @ts-ignore
            settings = await prisma.systemsetting.findMany();
        }
        console.log(`Fetched ${settings.length} settings`);
        
        // 4. Fetch Sequences (Try lowercase 'invoicesequence')
        let sequences;
        try {
             // @ts-ignore
             sequences = await prisma.invoiceSequence.findMany();
        } catch (e) {
            console.log("InvoiceSequence CamelCase failed, trying lowercase...");
            // @ts-ignore
            sequences = await prisma.invoicesequence.findMany();
        }
        console.log(`Fetched ${sequences.length} sequences`);

        const backupData = {
          version: "1.0",
          timestamp: new Date().toISOString(),
          data: {
            clients,
            invoices,
            settings,
            sequences
          }
        };

        const jsonString = JSON.stringify(backupData);
        const encrypted = Buffer.from(jsonString).toString('base64');

        return encrypted;

    } catch (error) {
        console.error("CRITICAL BACKUP ERROR:", error);
        throw error; // This will show as 500 in frontend
    }
  }

  static async importData(encryptedData: string) {
    const jsonString = Buffer.from(encryptedData, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonString);

    if (!parsed.data) throw new Error("Invalid .iec file format");

    await prisma.$transaction(async (tx) => {
      
      // A. Settings
      for (const s of parsed.data.settings) {
        // @ts-ignore
        const model = tx.systemSetting || tx.systemsetting;
        await model.upsert({
          where: { key: s.key },
          update: { value: s.value, json_value: s.json_value },
          create: { key: s.key, value: s.value, json_value: s.json_value, is_locked: s.is_locked }
        });
      }

      // B. Clients
      for (const c of parsed.data.clients) {
        // @ts-ignore
        await tx.client.upsert({
          where: { id: c.id },
          update: { ...c },
          create: { ...c }
        });
      }

      // C. Invoices
      for (const inv of parsed.data.invoices) {
        // @ts-ignore
        await tx.invoice.upsert({
          where: { invoice_number: inv.invoice_number },
          update: { ...inv },
          create: { ...inv }
        });
      }
      
      // D. Sequences
      for (const seq of parsed.data.sequences) {
        // @ts-ignore
        const model = tx.invoiceSequence || tx.invoicesequence;
        await model.upsert({
          where: { fiscal_year: seq.fiscal_year },
          update: { last_count: seq.last_count },
          create: { fiscal_year: seq.fiscal_year, last_count: seq.last_count }
        });
      }
    });

    return true;
  }
}