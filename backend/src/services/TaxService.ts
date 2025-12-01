import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Define what our JSON looks like (Type Safety)
interface CompanyProfile {
  company_name: string;
  address: string;
  state_code: number;
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
    // FIX: Changed from 'systemsetting' to 'systemSetting' (CamelCase matches your error message suggestion)
    const settings = await prisma.systemSetting.findUnique({
      where: { key: 'COMPANY_PROFILE' }
    });

    // 3. Safety Check: Does the record exist?
    if (!settings || !settings.json_value) {
      // Fallback if settings are missing (prevents crash on fresh install)
      console.warn("COMPANY_PROFILE missing. Defaulting to IGST.");
      return {
        taxType: 'IGST',
        gstRate: 18.0,
        breakdown: { cgst: 0, sgst: 0, igst: 18.0 }
      };
    }

    // 4. Type Casting
    const ownerProfile = settings.json_value as unknown as CompanyProfile;
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