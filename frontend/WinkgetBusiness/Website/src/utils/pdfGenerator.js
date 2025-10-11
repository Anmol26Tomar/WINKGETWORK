// PDF Generation utility for bills
export const generateBillPDF = (bill) => {
  const printWindow = window.open('', '_blank')
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill ${bill.formattedBillNumber || bill.billNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .bill-container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 30px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-info {
          margin-bottom: 20px;
        }
        .bill-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .bill-details {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        .customer-info, .vendor-info {
          margin-bottom: 20px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th, .items-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .totals {
          margin-top: 20px;
          text-align: right;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          padding: 5px 0;
        }
        .final-total {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body { margin: 0; }
          .bill-container { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="header">
          <h1>INVOICE</h1>
          <div class="company-info">
            <h2>${bill.vendorBusinessName || 'Your Business Name'}</h2>
            <p>${bill.vendorAddress?.street || ''} ${bill.vendorAddress?.city || ''}<br>
            ${bill.vendorAddress?.state || ''} ${bill.vendorAddress?.pincode || ''}<br>
            Phone: ${bill.vendorContact?.phone || ''}<br>
            Email: ${bill.vendorContact?.email || ''}</p>
          </div>
        </div>

        <div class="bill-info">
          <div class="bill-details">
            <h3>Bill Details</h3>
            <p><strong>Bill Number:</strong> ${bill.formattedBillNumber || bill.billNumber}</p>
            <p><strong>Bill Date:</strong> ${new Date(bill.billDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Status:</strong> ${bill.status?.toUpperCase() || 'DRAFT'}</p>
          </div>
        </div>

        <div class="customer-info">
          <h3>Bill To:</h3>
          <p><strong>${bill.customerName}</strong></p>
          <p>${bill.customerEmail || ''}</p>
          <p>${bill.customerPhone || ''}</p>
          <p>${bill.customerAddress?.street || ''}<br>
          ${bill.customerAddress?.city || ''}, ${bill.customerAddress?.state || ''}<br>
          ${bill.customerAddress?.pincode || ''}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items?.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.description || ''}</td>
                <td>${item.quantity}</td>
                <td>₹${item.unitPrice?.toFixed(2) || '0.00'}</td>
                <td>₹${item.totalPrice?.toFixed(2) || '0.00'}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${bill.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          ${bill.discountAmount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-₹${bill.discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${bill.taxAmount > 0 ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>₹${bill.taxAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${bill.deliveryCharge > 0 ? `
            <div class="total-row">
              <span>Delivery Charge:</span>
              <span>₹${bill.deliveryCharge.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row final-total">
            <span>Total Amount:</span>
            <span>₹${bill.totalAmount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        ${bill.notes ? `
          <div style="margin-top: 30px;">
            <h3>Notes:</h3>
            <p>${bill.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print()
    printWindow.close()
  }
}

// Alternative: Download as PDF (requires html2pdf library)
export const downloadBillPDF = async (bill) => {
  // This would require html2pdf library to be installed
  // For now, we'll use the print functionality
  generateBillPDF(bill)
}
