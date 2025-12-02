import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export const generateInvoiceHTML = (invoice: any, ownerProfile: any) => {
  const items = invoice.line_items; 
  const tax = invoice.tax_summary;
  const profile = ownerProfile?.json_value || {};

  // --- 1. HELPER: Format Currency ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: invoice.currency || 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // --- 2. HELPER: Get Base64 Image ---
  // Reads local files and converts to Base64 for Puppeteer
  const getBase64Image = (webPath: string) => {
    if (!webPath) return null;
    try {
      // Remove leading slash if present
      const cleanPath = webPath.startsWith('/') ? webPath.slice(1) : webPath;
      // Path relative from this file to the public folder
      const systemPath = path.join(__dirname, '../../../../frontend/public', cleanPath);
      
      if (fs.existsSync(systemPath)) {
        const bitmap = fs.readFileSync(systemPath);
        const ext = path.extname(systemPath).slice(1);
        return `data:image/${ext};base64,${bitmap.toString('base64')}`;
      }
      return null;
    } catch (e) {
      console.error("Image load failed:", webPath);
      return null;
    }
  };

  const logoSrc = getBase64Image(profile.logo);
  const signatureSrc = getBase64Image(profile.signature);
  const stampSrc = getBase64Image(profile.stamp);

  // --- 3. TAX ROWS GENERATOR ---
  let taxRows = '';
  if (tax.taxType === 'IGST') {
      taxRows += `<tr><td>IGST (${tax.gstRate}%)</td><td>${formatCurrency(tax.breakdown.igst)}</td></tr>`;
  } else if (tax.taxType === 'CGST_SGST') {
      taxRows += `<tr><td>CGST (${tax.gstRate/2}%)</td><td>${formatCurrency(tax.breakdown.cgst)}</td></tr>`;
      taxRows += `<tr><td>SGST (${tax.gstRate/2}%)</td><td>${formatCurrency(tax.breakdown.sgst)}</td></tr>`;
  } else {
      taxRows += `<tr><td>Tax (0%)</td><td>${formatCurrency(0)}</td></tr>`;
  }

  // --- 4. RENDER HTML ---
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.invoice_number}</title>
<style>
    @page {
        margin: 0 !important;
        size: A4;
    }
    :root {
        --accent: #4318FF; /* Horizon Blue */
        --border: #e2e8f0;
        --text: #1e293b;
    }

    * { box-sizing: border-box; }

    body {
        font-family: 'Helvetica', Arial, sans-serif;
        font-size: 10pt !important;
        color: var(--text);
        margin: 0;
        padding: 40px;
        background: #fff;
    }

    /* Wrapper */
    .invoice-wrapper {
        max-width: 100%;
        margin: 0 auto;
    }

    /* ------------------------------
       HEADER
    ------------------------------ */
    .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 25px;
        margin-bottom: 28px;
    }

    .company-name {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 6px;
        color: #000;
    }

    .company-name-divider {
        width: 150px;
        height: 3px;
        background: var(--accent);
        margin-bottom: 10px;
        border-radius: 2px;
    }

    .company-meta-line,
    .company-address-line {
        font-size: 11px;
        line-height: 1.4;
        color: #475569;
    }

    #company-logo {
        max-width: 150px;
        max-height: 80px;
        object-fit: contain;
    }

    /* ------------------------------
       INVOICE META
    ------------------------------ */
    .invoice-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-bottom: 22px;
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        padding: 10px 0;
    }

    .invoice-meta div {
        margin-right: 20px;
    }

    .invoice-meta-label {
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        font-size: 10px;
        margin-right: 5px;
    }

    /* ------------------------------
       CLIENT CARD
    ------------------------------ */
    #client-card {
        border: 1px solid var(--border);
        background: #f8fafc;
        padding: 14px 16px;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 26px;
    }

    #client-card-title {
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 7px;
        letter-spacing: 0.5px;
    }

    /* ------------------------------
       PRODUCT TABLE
    ------------------------------ */
    #product-table {
        width: 100%;
        border-collapse: collapse !important;
        margin-bottom: 20px;
        font-size: 12px;
    }

    /* Table header */
    #product-table thead th {
        background: var(--accent) !important;
        color: #fff !important;
        padding: 10px !important;
        border: 1px solid var(--accent) !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        font-size: 11px !important;
        letter-spacing: 0.5px;
    }

    /* Table body rows */
    #product-table tbody td {
        border: 1px solid var(--border) !important;
        padding: 10px !important;
        vertical-align: top;
    }

    /* ------------------------------
       TOTALS
    ------------------------------ */
    #table-totals {
        width: 250px;
        margin-left: auto;
        border: 1px solid var(--border);
        background: #f8fafc;
        padding: 15px;
        border-radius: 6px;
        font-size: 14px;
        page-break-inside: avoid !important;
    }

    #table-totals table {
        width: 100%;
        border-collapse: collapse;
    }

    #table-totals-row td {
        padding: 4px 0;
    }

    #table-totals-row td:first-child {
        text-align: left;
        font-size: 12px;
        color: #64748b;
    }

    #table-totals-row td:last-child {
        text-align: right;
        font-size: 12px;
        font-weight: 600;
    }

    .grand-total-label,
    .grand-total-value {
        font-weight: 700 !important;
        font-size: 16px !important;
        color: #000 !important;
        padding-top: 10px !important;
        border-top: 1px solid var(--border);
    }

    /* ------------------------------
       AUTH & FOOTER
    ------------------------------ */
    .auth-section {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        margin-top: 40px;
        gap: 20px;
    }
    .sign-box { text-align: center; }
    .stamp-img { max-width: 120px; max-height: 120px; opacity: 0.9; }
    .sign-img { max-width: 150px; max-height: 60px; }
    
    .footer {
        margin-top: 60px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        font-size: 10px;
        color: #94a3b8;
        text-align: center;
    }
</style>
</head>
<body>

<div class="invoice-wrapper">

    <div class="invoice-header">
        <div>
            <div class="company-name">${profile.company_name || 'Company Name'}</div>
            <div class="company-name-divider"></div>

            <div class="company-meta-line">Email: ${profile.email || ''} | Phone: ${profile.phone || ''}</div>
            <div class="company-meta-line">GSTIN: ${profile.gstin || ''}</div>

            <div class="company-address-line" style="white-space: pre-line;">${profile.address || ''}</div>
        </div>

        <div>
            ${logoSrc ? `<img id="company-logo" src="${logoSrc}" />` : ''}
        </div>
    </div>

    <div class="invoice-meta">
        <div><span class="invoice-meta-label">Invoice #:</span> ${invoice.invoice_number}</div>
        <div><span class="invoice-meta-label">Date:</span> ${format(new Date(invoice.issue_date), "dd MMM yyyy")}</div>
        <div><span class="invoice-meta-label">Due:</span> ${invoice.due_date ? format(new Date(invoice.due_date), "dd MMM yyyy") : '-'}</div>
    </div>

    <div id="client-card">
        <div id="client-card-title">Bill To</div>

        <div style="font-weight:bold; font-size: 14px; margin-bottom: 4px;">${invoice.client.company_name}</div>
        ${invoice.client.email ? `<div>${invoice.client.email}</div>` : ''}
        ${invoice.client.phone ? `<div>${invoice.client.phone}</div>` : ''}

        <div style="margin-top: 6px; color: #475569;">
             ${invoice.client.addresses?.billing?.street || ''}, 
             ${invoice.client.addresses?.billing?.city || ''} - 
             ${invoice.client.addresses?.billing?.zip || ''}
        </div>
        <div style="margin-top: 4px;">GSTIN: ${invoice.client.tax_id || 'N/A'}</div>
    </div>

    <table id="product-table" cellspacing="0">
        <thead>
            <tr>
                <th style="text-align: left;">Item & Description</th>
                <th style="width: 80px; text-align: center;">HSN</th>
                <th style="width: 100px; text-align: right;">Rate</th>
                <th style="width: 60px; text-align: center;">Qty</th>
                <th style="width: 120px; text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item: any) => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${item.description}</div>
                </td>
                <td style="text-align: center; color: #64748b;">${item.hsn || '-'}</td>
                <td style="text-align: right;">${formatCurrency(item.rate).replace(/[^0-9.-]+/g,"")}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(item.amount).replace(/[^0-9.-]+/g,"")}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div id="table-totals">
        <table id="table-totals-row">
            <tr><td>Subtotal</td><td>${formatCurrency(Number(invoice.subtotal))}</td></tr>
            ${taxRows}
            <tr><td class="grand-total-label">Grand Total</td><td class="grand-total-value">${formatCurrency(Number(invoice.grand_total))}</td></tr>
        </table>
    </div>
    
    ${invoice.remarks ? `
        <div style="margin-top: 30px; border: 1px dashed var(--border); padding: 10px; border-radius: 4px; background: #fffcf0;">
            <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; color: #b45309; margin-bottom: 4px;">Remarks</div>
            <div style="font-size: 11px; color: #78350f;">${invoice.remarks.replace(/\n/g, '<br/>')}</div>
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

    <div class="footer">
        This is a computer-generated invoice and does not require a physical signature.
    </div>

</div>

</body>
</html>
  `;
};