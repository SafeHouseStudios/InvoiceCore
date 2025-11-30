import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Define what our JSON looks like (Type Safety)
interface CompanyProfile {
  address: string;
  state_code: number; // We explicitly tell TS this exists
  gstin: string;
  phone: string;
}

interface TaxResult {
  taxType: 'IGST' | 'CGST_SGST' | 'NONE';
  gstRate: number;
  breakdown: {
    cgst: number;
    sgst: number;
    igst: number;
  };
}

export class TaxService {
  static async calculateTaxType(clientStateCode: number, clientCountry: string = 'India'): Promise<TaxResult> {
    
    // 2. Fetch Owner Settings
    const settings = await prisma.systemsetting.findUnique({
      where: { key: 'COMPANY_PROFILE' }
    });

    // 3. Safety Check: Does the record exist?
    if (!settings || !settings.json_value) {
      throw new Error('SYSTEM_ERROR: Owner Company Profile (state_code) is missing in SystemSetting.');
    }

    // 4. Type Casting: Tell TS "Trust me, this JSON is a CompanyProfile"
    // We use 'unknown' first to avoid conflicts with Prisma's JsonValue type
    const ownerProfile = settings.json_value as unknown as CompanyProfile;
    
    // Now this line is safe
    const ownerStateCode = ownerProfile.state_code;

    // 5. Logic: Export (Foreign Client)
    if (clientCountry && clientCountry.toLowerCase() !== 'india') {
      return {
        taxType: 'NONE',
        gstRate: 0,
        breakdown: { cgst: 0, sgst: 0, igst: 0 }
      };
    }

    // 6. Logic: Same State = CGST + SGST
    if (ownerStateCode === clientStateCode) {
      return {
        taxType: 'CGST_SGST',
        gstRate: 18.0,
        breakdown: { cgst: 9.0, sgst: 9.0, igst: 0 }
      };
    }

    // 7. Logic: Different State = IGST
    return {
      taxType: 'IGST',
      gstRate: 18.0,
      breakdown: { cgst: 0, sgst: 0, igst: 18.0 }
    };
  }
}