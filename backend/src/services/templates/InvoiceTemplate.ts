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

  // Tax Logic
  let taxRows = '';
  if (tax.taxType === 'IGST') {
      taxRows += `<tr><td>IGST (${tax.gstRate}%)</td><td>${formatCurrency(tax.breakdown.igst)}</td></tr>`;
  } else if (tax.taxType === 'CGST_SGST') {
      taxRows += `<tr><td>CGST (${tax.gstRate/2}%)</td><td>${formatCurrency(tax.breakdown.cgst)}</td></tr>`;
      taxRows += `<tr><td>SGST (${tax.gstRate/2}%)</td><td>${formatCurrency(tax.breakdown.sgst)}</td></tr>`;
  } else {
      const totalTax = (Number(invoice.grand_total) - Number(invoice.subtotal));
      if (totalTax > 0) {
        taxRows += `<tr><td>HST 13%</td><td>${formatCurrency(totalTax)}</td></tr>`;
      }
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.invoice_number}</title>
<style>
    @page { margin: 0; size: A4; }
    :root {
        /* BLUE BRANDING */
        --accent: #2563EB; 
        --border: #E5E7EB;
        --text: #1F2937;
    }
    * { box-sizing: border-box; }
    body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 10pt;
        color: var(--text);
        margin: 0;
        padding: 40px 50px;
        background: #fff;
    }

    /* HEADER */
    .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
    }
    .company-name {
        font-size: 22px;
        font-weight: 800;
        color: #000;
        border-bottom: 3px solid var(--accent);
        display: inline-block;
        padding-bottom: 5px;
        margin-bottom: 10px;
    }
    .company-meta-line { font-size: 9pt; color: #555; margin-bottom: 2px; }
    #company-logo { max-width: 150px; max-height: 80px; object-fit: contain; }

    /* META */
    .invoice-meta {
        display: flex;
        justify-content: space-between;
        font-weight: 700;
        margin-bottom: 25px;
        font-size: 10pt;
    }

    /* CLIENT CARD */
    #client-card {
        border: 1px solid var(--border);
        background: #FAFAFA;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 30px;
        width: 65%;
    }
    #client-card-title {
        font-weight: 700;
        color: var(--accent);
        font-size: 9pt;
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    .client-text { font-size: 10pt; line-height: 1.4; }

    /* TABLE */
    #product-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }
    #product-table th {
        background: var(--accent);
        color: #fff;
        padding: 8px 10px;
        font-weight: 700;
        font-size: 10pt;
        text-align: left;
    }
    #product-table td {
        padding: 10px;
        border-bottom: 1px solid var(--border);
        font-size: 10pt;
        vertical-align: top;
    }
    /* Column Alignment */
    .col-qty { text-align: center; }
    .col-total { text-align: right; }
    th:last-child { text-align: right; }

    /* TOTALS */
    #table-totals {
        width: 250px;
        margin-left: auto;
        border: 1px solid var(--border);
        background: #FAFAFA;
        padding: 10px;
        border-radius: 5px;
    }
    #table-totals table { width: 100%; border-collapse: collapse; }
    #table-totals td { padding: 5px 0; font-size: 10pt; }
    #table-totals td:last-child { text-align: right; font-weight: 600; }
    .grand-total-label { color: #000; font-weight: 800; font-size: 12pt; }
    .grand-total-value { color: var(--accent); font-weight: 800; font-size: 12pt; }

    /* FOOTER */
    .footer {
        position: fixed;
        bottom: 40px;
        left: 50px;
        right: 50px;
        text-align: center;
        font-size: 9pt;
        color: #666;
    }
    .footer-line {
        height: 3px;
        background: var(--accent);
        width: 100%;
        margin-bottom: 10px;
    }
</style>
</head>
<body>

<div class="invoice-wrapper">
    <div class="invoice-header">
        <div>
            <div class="company-name">${profile.company_name || 'Dapper Detailing Pros'}</div>
            <div class="company-meta-line">
                Email: ${profile.email || ''} | Phone: ${profile.phone || ''}
            </div>
            <div class="company-meta-line">
                ${profile.gstin ? `BIN: ${profile.gstin}` : ''}
            </div>
            <div class="company-meta-line" style="margin-top:5px;">
                ${profile.address ? profile.address.replace(/\n/g, ', ') : ''}
            </div>
        </div>
        <div>
            ${logoSrc ? `<img id="company-logo" src="${logoSrc}" />` : ''}
        </div>
    </div>

    <div class="invoice-meta">
        <div>Invoice #: ${invoice.invoice_number}</div>
        <div>Date: ${format(new Date(invoice.issue_date), "dd/MMM/yyyy")}</div>
        <div>Due: ${invoice.due_date ? format(new Date(invoice.due_date), "dd/MMM/yyyy") : '-'}</div>
    </div>

    <div id="client-card">
        <div id="client-card-title">Client Details</div>
        <div class="client-text">
            <strong>${invoice.client.company_name}</strong><br>
            ${invoice.client.phone ? invoice.client.phone + '<br>' : ''}
            ${invoice.client.email ? invoice.client.email + '<br>' : ''}
            ${invoice.client.addresses?.billing?.street || ''}, 
            ${invoice.client.addresses?.billing?.city || ''}
        </div>
    </div>

    <table id="product-table">
        <thead>
            <tr>
                <th width="15%">Item No.</th>
                <th width="50%">Description</th>
                <th width="15%" class="col-qty">Qty</th>
                <th width="20%" class="col-total">Line Total</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item: any) => `
            <tr>
                <td>${item.hsn || 'Service'}</td>
                <td><strong>${item.description}</strong></td>
                <td class="col-qty">${item.quantity}</td>
                <td class="col-total">${formatCurrency(item.amount)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div id="table-totals">
        <table>
            <tr><td>Subtotal</td><td>${formatCurrency(Number(invoice.subtotal))}</td></tr>
            ${taxRows}
            <tr>
                <td class="grand-total-label" style="padding-top:10px;">Grand Total</td>
                <td class="grand-total-value" style="padding-top:10px;">${formatCurrency(Number(invoice.grand_total))}</td>
            </tr>
        </table>
    </div>
</div>

<div class="footer">
    <div class="footer-line"></div>
    <strong>${profile.company_name || 'Dapper Detailing Pros'}</strong><br>
    ${profile.email || ''} | https://dapperdetailing.ca<br>
    This is a computer-generated invoice and no signature is required.
</div>

</body>
</html>
  `;
};