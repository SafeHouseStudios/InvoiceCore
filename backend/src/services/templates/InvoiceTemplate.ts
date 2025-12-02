import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export const generateInvoiceHTML = (invoice: any, ownerProfile: any) => {
  const items = invoice.line_items; 
  const tax = invoice.tax_summary;
  const profile = ownerProfile?.json_value || {};

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: invoice.currency || 'CAD',
      minimumFractionDigits: 2
    }).format(Number(amount));
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

  const logoSrc = getBase64Image(profile.logo);

  // Calculate tax details
  let taxRows = '';
  let taxLabel = '';
  let taxAmount = 0;

  if (tax.taxType === 'IGST') {
      taxLabel = `IGST ${tax.gstRate}%`;
      taxAmount = tax.breakdown.igst;
  } else if (tax.taxType === 'CGST_SGST') {
      taxLabel = `CGST+SGST ${tax.gstRate}%`;
      taxAmount = tax.breakdown.cgst + tax.breakdown.sgst;
  } else {
      const totalTax = (Number(invoice.grand_total) - Number(invoice.subtotal));
      if (totalTax > 0) {
        taxLabel = 'HST 13%';
        taxAmount = totalTax;
      }
  }

  // Generate Line Items
  const lineItemsHTML = items.map((item: any, index: number) => `
    <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 10pt;">${item.hsn || 'Interior Detail - Subaru'}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 10pt;">${item.description}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: center; font-size: 10pt;">${item.quantity}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right; font-size: 10pt;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.invoice_number}</title>
<style>
    @page { 
        margin: 0; 
        size: A4; 
    }
    
    * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0; 
    }

    body {
        font-family: Arial, sans-serif;
        font-size: 10pt;
        color: #000;
        line-height: 1.4;
        background: #fff;
    }

    .page-wrapper {
        padding: 30px 40px;
        max-width: 210mm;
        margin: 0 auto;
    }

    /* HEADER */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 1px solid #ddd;
    }

    .company-section {
        flex: 1;
    }

    .company-name {
        font-size: 18pt;
        font-weight: 700;
        color: #000;
        margin-bottom: 8px;
    }

    .company-info {
        font-size: 8pt;
        color: #333;
        line-height: 1.5;
    }

    .logo-section {
        text-align: right;
    }

    .company-logo {
        max-width: 100px;
        max-height: 100px;
        object-fit: contain;
    }

    /* META ROW */
    .meta-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 25px;
        font-size: 9pt;
    }

    .meta-item {
        flex: 1;
    }

    .meta-label {
        font-weight: 700;
        color: #000;
    }

    /* CLIENT SECTION */
    .client-section {
        margin-bottom: 25px;
        padding: 15px;
        background: #f9f9f9;
        border: 1px solid #ddd;
    }

    .client-title {
        font-weight: 700;
        font-size: 10pt;
        margin-bottom: 8px;
        color: #000;
    }

    .client-details {
        font-size: 9pt;
        color: #333;
        line-height: 1.6;
    }

    /* TABLE */
    .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }

    .invoice-table thead th {
        background: #ED1C43;
        color: #fff;
        padding: 10px;
        text-align: left;
        font-size: 10pt;
        font-weight: 700;
        border: 1px solid #ED1C43;
    }

    .invoice-table thead th:nth-child(3),
    .invoice-table thead th:nth-child(4) {
        text-align: center;
    }

    .invoice-table tbody td {
        font-size: 10pt;
        color: #000;
    }

    /* TOTALS */
    .totals-section {
        float: right;
        width: 300px;
        margin-top: 10px;
    }

    .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 15px;
        font-size: 10pt;
        background: #f9f9f9;
        margin-bottom: 2px;
    }

    .totals-row.grand-total {
        background: #fff;
        font-weight: 700;
        font-size: 11pt;
        border-top: 2px solid #000;
        margin-top: 5px;
    }

    .totals-label {
        color: #333;
    }

    .totals-value {
        color: #000;
        font-weight: 600;
    }

    /* FOOTER */
    .footer {
        clear: both;
        margin-top: 80px;
        padding-top: 15px;
        border-top: 2px solid #ED1C43;
        text-align: center;
        font-size: 8pt;
        color: #666;
    }

    .footer-company {
        font-weight: 700;
        color: #000;
        margin-bottom: 3px;
    }
</style>
</head>
<body>

<div class="page-wrapper">

    <!-- HEADER -->
    <div class="header">
        <div class="company-section">
            <div class="company-name">${profile.company_name || 'Dapper Detailing Pros'}</div>
            <div class="company-info">
                <strong>Email:</strong> ${profile.email || 'info@dapperdetailing.ca'} | <strong>Phone:</strong> ${profile.phone || '+1 (705) 977-6217'}<br>
                ${profile.gstin ? `<strong>BIN:</strong> ${profile.gstin.split(' | ')[0] || ''} | <strong>HST:</strong> ${profile.gstin.split(' | ')[1] || profile.gstin}<br>` : ''}
                ${profile.address ? profile.address.replace(/\n/g, '<br>') : 'Peterborough, Ontario<br>Canada'}
            </div>
        </div>

        <div class="logo-section">
            ${logoSrc ? `<img src="${logoSrc}" class="company-logo" />` : ''}
        </div>
    </div>

    <!-- META ROW -->
    <div class="meta-row">
        <div class="meta-item">
            <span class="meta-label">Invoice #:</span> ${invoice.invoice_number}
        </div>
        <div class="meta-item" style="text-align: center;">
            <span class="meta-label">Date:</span> ${format(new Date(invoice.issue_date), "dd/MMM/yyyy")}
        </div>
        <div class="meta-item" style="text-align: right;">
            <span class="meta-label">Due:</span> ${invoice.due_date ? format(new Date(invoice.due_date), "dd/MMM/yyyy") : '-'}
        </div>
    </div>

    <!-- CLIENT SECTION -->
    <div class="client-section">
        <div class="client-title">Client Details</div>
        <div class="client-details">
            <strong>${invoice.client.company_name}</strong><br>
            ${invoice.client.phone ? invoice.client.phone + '<br>' : ''}
            ${invoice.client.email ? invoice.client.email + '<br>' : ''}
            ${invoice.client.addresses?.billing?.street ? invoice.client.addresses.billing.street + ', ' : ''}${invoice.client.addresses?.billing?.city ? invoice.client.addresses.billing.city + ' ' : ''}${invoice.client.addresses?.billing?.zip ? invoice.client.addresses.billing.zip + ', ' : ''}${invoice.client.country || 'Canada'}
        </div>
    </div>

    <!-- ITEMS TABLE -->
    <table class="invoice-table">
        <thead>
            <tr>
                <th style="width: 20%;">Item No.</th>
                <th style="width: 50%;">Description</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 20%; text-align: right;">Line Total</th>
            </tr>
        </thead>
        <tbody>
            ${lineItemsHTML}
        </tbody>
    </table>

    <!-- TOTALS -->
    <div class="totals-section">
        <div class="totals-row">
            <div class="totals-label">Subtotal</div>
            <div class="totals-value">${formatCurrency(Number(invoice.subtotal))}</div>
        </div>
        
        ${taxAmount > 0 ? `
        <div class="totals-row">
            <div class="totals-label">${taxLabel}</div>
            <div class="totals-value">${formatCurrency(taxAmount)}</div>
        </div>
        ` : ''}
        
        <div class="totals-row grand-total">
            <div class="totals-label">Grand Total</div>
            <div class="totals-value">${formatCurrency(Number(invoice.grand_total))}</div>
        </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
        <div class="footer-company">${profile.company_name || 'Dapper Detailing Pros'}</div>
        <div>${profile.email || 'info@dapperdetailing.ca'} | https://dapperdetailing.ca</div>
        <div style="margin-top: 5px;">This is a computer-generated invoice and no signature is required.</div>
    </div>

</div>

</body>
</html>
  `;
};