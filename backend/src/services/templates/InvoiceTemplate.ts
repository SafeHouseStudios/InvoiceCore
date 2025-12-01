export const generateInvoiceHTML = (invoice: any, ownerProfile: any) => {
  const items = invoice.line_items; // JSON array of items
  const tax = invoice.tax_summary;  // JSON object of tax calculations

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: invoice.currency || 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: 'Helvetica', 'Arial', sans-serif; 
          color: #333; 
          padding: 40px; 
          max-width: 800px; 
          margin: 0 auto; 
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 40px; 
          border-bottom: 2px solid #f1f5f9; 
          padding-bottom: 20px; 
        }
        .company-name { 
          font-size: 24px; 
          font-weight: bold; 
          color: #0f172a; 
          margin-bottom: 5px; 
        }
        .invoice-title { 
          font-size: 32px; 
          font-weight: bold; 
          text-align: right; 
          color: #64748b; 
          letter-spacing: 1px;
        }
        
        .details-grid { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px; 
        }
        .box { width: 45%; }
        .label { 
          font-size: 10px; 
          text-transform: uppercase; 
          color: #64748b; 
          font-weight: bold; 
          margin-bottom: 4px; 
          margin-top: 12px;
        }
        .value { font-size: 14px; line-height: 1.5; }
        .meta-value { font-size: 14px; text-align: right; line-height: 1.5; }

        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
        }
        th { 
          text-align: left; 
          padding: 12px; 
          background: #f8fafc; 
          font-size: 11px; 
          text-transform: uppercase; 
          color: #475569; 
          border-bottom: 1px solid #e2e8f0;
        }
        td { 
          padding: 12px; 
          border-bottom: 1px solid #e2e8f0; 
          font-size: 13px; 
          vertical-align: top;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .totals-section { 
          margin-top: 30px; 
          display: flex; 
          justify-content: flex-end; 
        }
        .totals-box { width: 300px; }
        .row { 
          display: flex; 
          justify-content: space-between; 
          padding: 6px 0; 
          font-size: 13px;
        }
        .grand-total { 
          font-size: 16px; 
          font-weight: bold; 
          border-top: 2px solid #0f172a; 
          padding-top: 10px; 
          margin-top: 10px; 
          color: #0f172a;
        }

        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }
        
        .bank-details {
          margin-top: 40px;
          padding: 15px;
          background-color: #f8fafc;
          border-radius: 4px;
          font-size: 12px;
          width: 50%;
        }
      </style>
    </head>
    <body>

      <div class="header">
        <div>
          <div class="company-name">${ownerProfile.value}</div>
          <div class="value" style="white-space: pre-line;">${ownerProfile.json_value.address}</div>
          <div class="label">GSTIN</div>
          <div class="value">${ownerProfile.json_value.gstin}</div>
          <div class="label">Contact</div>
          <div class="value">${ownerProfile.json_value.email} | ${ownerProfile.json_value.phone}</div>
        </div>
        <div>
          <div class="invoice-title">INVOICE</div>
          <div class="label" style="text-align: right;">Invoice #</div>
          <div class="meta-value"># ${invoice.invoice_number}</div>
          
          <div class="label" style="text-align: right;">Date</div>
          <div class="meta-value">${new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          
          ${invoice.due_date ? `
            <div class="label" style="text-align: right;">Due Date</div>
            <div class="meta-value">${new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          ` : ''}
        </div>
      </div>

      <div class="details-grid">
        <div class="box">
          <div class="label">Bill To</div>
          <div class="company-name" style="font-size: 16px;">${invoice.client.company_name}</div>
          
          <div class="value">
             ${invoice.client.addresses?.billing?.street ? invoice.client.addresses.billing.street + ',' : ''}
             ${invoice.client.addresses?.billing?.city || ''} 
             ${invoice.client.addresses?.billing?.zip || ''}
          </div>

          <div class="label">Client GSTIN</div>
          <div class="value">${invoice.client.gst_number || 'N/A'}</div>
          
          <div class="label">Place of Supply</div>
          <div class="value">State Code: ${invoice.client.state_code}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40%;">Description</th>
            <th class="text-center" style="width: 15%;">HSN / SAC</th>
            <th class="text-right" style="width: 10%;">Qty</th>
            <th class="text-right" style="width: 15%;">Rate</th>
            <th class="text-right" style="width: 20%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>
                <div style="font-weight: 500;">${item.description}</div>
              </td>
              <td class="text-center">${item.hsn || '-'}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.rate).replace('₹', '')}</td>
              <td class="text-right">${formatCurrency(item.amount).replace('₹', '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="totals-box">
          <div class="row">
            <span>Subtotal</span>
            <span>${formatCurrency(Number(invoice.subtotal))}</span>
          </div>
          
          ${tax.taxType === 'IGST' ? `
            <div class="row">
              <span>IGST (18%)</span>
              <span>${formatCurrency(tax.breakdown.igst)}</span>
            </div>
          ` : ''}

          ${tax.taxType === 'CGST_SGST' ? `
            <div class="row">
              <span>CGST (9%)</span>
              <span>${formatCurrency(tax.breakdown.cgst)}</span>
            </div>
            <div class="row">
              <span>SGST (9%)</span>
              <span>${formatCurrency(tax.breakdown.sgst)}</span>
            </div>
          ` : ''}

          ${tax.taxType === 'NONE' ? `
             <div class="row" style="color: green;">
              <span>Tax (Export/Exempt)</span>
              <span>₹0.00</span>
            </div>
          ` : ''}

          <div class="row grand-total">
            <span>Total</span>
            <span>${formatCurrency(Number(invoice.grand_total))}</span>
          </div>
          <div style="font-size: 10px; text-align: right; margin-top: 5px; color: #64748b;">
            All amounts in ${invoice.currency || 'INR'}
          </div>
        </div>
      </div>

      ${ownerProfile.json_value.bank_details ? `
        <div class="bank-details">
          <div class="label" style="margin-top: 0;">Bank Details for Payment</div>
          <div class="row"><span>Bank Name:</span> <strong>${ownerProfile.json_value.bank_details.bank_name || '-'}</strong></div>
          <div class="row"><span>Account No:</span> <strong>${ownerProfile.json_value.bank_details.ac_no || '-'}</strong></div>
          <div class="row"><span>IFSC Code:</span> <strong>${ownerProfile.json_value.bank_details.ifsc || '-'}</strong></div>
        </div>
      ` : ''}

      <div class="footer">
        This is a computer-generated invoice and does not require a physical signature.
      </div>

    </body>
    </html>
  `;
};