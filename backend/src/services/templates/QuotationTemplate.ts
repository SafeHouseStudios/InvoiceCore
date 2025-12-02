import fs from 'fs';
import path from 'path';

export const generateQuotationHTML = (quotation: any, ownerProfile: any) => {
  const items = quotation.line_items;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: quotation.currency || 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getBase64Image = (webPath: string) => {
    if (!webPath) return null;
    try {
      const cleanPath = webPath.startsWith('/') ? webPath.slice(1) : webPath;
      const systemPath = path.join(__dirname, '../../../../frontend/public', cleanPath);
      if (fs.existsSync(systemPath)) {
        const bitmap = fs.readFileSync(systemPath);
        const ext = path.extname(systemPath).slice(1);
        return `data:image/${ext};base64,${bitmap.toString('base64')}`;
      }
      return null;
    } catch (e) { return null; }
  };

  const logoSrc = getBase64Image(ownerProfile?.json_value?.logo);
  const signatureSrc = getBase64Image(ownerProfile?.json_value?.signature);
  const stampSrc = getBase64Image(ownerProfile?.json_value?.stamp);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
        .company-logo { max-width: 250px; max-height: 80px; margin-bottom: 15px; display: block; }
        .company-name { font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 5px; }
        .doc-title { font-size: 32px; font-weight: bold; text-align: right; color: #64748b; letter-spacing: 1px; }
        .details-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .box { width: 45%; }
        .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; margin-top: 12px; }
        .value { line-height: 1.5; }
        .meta-value { text-align: right; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; padding: 12px; background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .text-right { text-align: right; }
        .totals-section { margin-top: 30px; display: flex; justify-content: flex-end; }
        .totals-box { width: 300px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; }
        .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 10px; color: #0f172a; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
        .auth-section { display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 40px; gap: 20px; }
        .sign-box { text-align: center; }
        .stamp-img { max-width: 200px; max-height: 200px; opacity: 1; }
        .sign-img { max-width: 150px; max-height: 60px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${logoSrc ? `<img src="${logoSrc}" class="company-logo" />` : ''}
          <div class="company-name">${ownerProfile?.value || 'Company Name'}</div>
          <div class="value" style="white-space: pre-line;">${ownerProfile?.json_value?.address || ''}</div>
          <div class="label">Contact</div>
          <div class="value">${ownerProfile?.json_value?.email || ''} | ${ownerProfile?.json_value?.phone || ''}</div>
        </div>
        <div>
          <div class="doc-title">QUOTATION</div>
          <div class="label" style="text-align: right;">Quotation #</div>
          <div class="meta-value"># ${quotation.quotation_number}</div>
          <div class="label" style="text-align: right;">Date</div>
          <div class="meta-value">${new Date(quotation.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          ${quotation.expiry_date ? `
            <div class="label" style="text-align: right;">Valid Until</div>
            <div class="meta-value">${new Date(quotation.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          ` : ''}
        </div>
      </div>

      <div class="details-grid">
        <div class="box">
          <div class="label">To</div>
          <div class="company-name" style="font-size: 16px;">${quotation.client.company_name}</div>
          <div class="value">
             ${quotation.client.addresses?.billing?.street ? quotation.client.addresses.billing.street + ',' : ''}
             ${quotation.client.addresses?.billing?.city || ''} 
             ${quotation.client.addresses?.billing?.zip || ''}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 55%;">Description</th>
            <th class="text-right" style="width: 10%;">Qty</th>
            <th class="text-right" style="width: 15%;">Rate</th>
            <th class="text-right" style="width: 20%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td><div style="font-weight: 500;">${item.description}</div></td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.rate).replace(/[^0-9.-]+/g,"")}</td>
              <td class="text-right">${formatCurrency(item.amount).replace(/[^0-9.-]+/g,"")}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="totals-box">
          <div class="row"><span>Subtotal</span><span>${formatCurrency(Number(quotation.subtotal))}</span></div>
          <div class="row grand-total"><span>Total</span><span>${formatCurrency(Number(quotation.grand_total))}</span></div>
        </div>
      </div>
      
      ${quotation.services_offered ? `
        <div style="margin-top: 30px;">
            <div class="label">Services Offered</div>
            <div class="value" style="white-space: pre-wrap;">${quotation.services_offered}</div>
        </div>
      ` : ''}

      ${quotation.contract_terms ? `
        <div style="margin-top: 20px;">
            <div class="label">Contract Tenure / Terms</div>
            <div class="value" style="white-space: pre-wrap;">${quotation.contract_terms}</div>
        </div>
      ` : ''}

      <div class="auth-section">
        ${stampSrc ? `<div class="sign-box"><img src="${stampSrc}" class="stamp-img" /></div>` : ''}
        ${signatureSrc ? `
            <div class="sign-box">
                <img src="${signatureSrc}" class="sign-img" />
                <div style="font-size: 10px; margin-top: 5px; font-weight: bold; border-top: 1px solid #333; padding-top: 5px;">Authorised Signatory</div>
            </div>
        ` : ''}
      </div>
      <div class="footer">Computer generated quotation.</div>
    </body>
    </html>
  `;
};