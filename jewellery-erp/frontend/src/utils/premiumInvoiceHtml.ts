export const generatePremiumHTML = (data: any, qrDataUrl?: string) => {
  const isExchange = data.type === 'exchange';
  const isPurchase = data.type === 'purchase';
  const title = isExchange ? 'EXCHANGE INVOICE' : isPurchase ? 'PURCHASE RECEIPT' : 'TAX INVOICE';
  
  // Extract values with fallbacks
  const invoiceNo = data.invoice?.invoice_number || '';
  const dateStr = data.invoice?.invoice_date || '';
  // Convert date format if needed, assuming YYYY-MM-DD
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const place = data.company?.address?.split(',')[0] || 'Store';
  
  const companyName = data.company?.name || 'SAIDEEP';
  const companyAddress = data.company?.address || 'Takhatgarh, Khedawas, Rajasthan - 313802, India';
  const companyPhone = data.company?.phone || '+91 85048 37854';
  const companyEmail = data.company?.email || 'saideepjewellers@gmail.com';
  const gstin = data.company?.gstin || '08ABCDE1234F1Z5';
  
  const customerName = data.customer?.name || '';
  const customerPhone = data.customer?.phone || '';
  
  const taxableAmount = data.totals?.subtotal || 0;
  const taxAmount = data.totals?.tax_amount || 0;
  const grandTotal = data.totals?.grand_total || 0;
  const amountPaid = data.invoice?.amount_paid || 0;
  const balanceDue = data.invoice?.balance_due || 0;
  
  // Calculate valid till (14 days from now)
  const validTill = new Date(dateObj);
  validTill.setDate(validTill.getDate() + 14);
  const formattedValidTill = validTill.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  // Render items safely
  let itemsHtml = '';
  if (data.items && data.items.length > 0) {
    itemsHtml = data.items.map((item: any, i: number) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td>
          <div class="font-bold">${item.item_name}</div>
          <div class="text-xs text-gray-500">Gross: ${item.gross_weight?.toFixed(3) || '0.000'}g</div>
        </td>
        <td class="text-center">${item.metal_type?.toUpperCase() || '-'}</td>
        <td class="text-center">${item.net_weight?.toFixed(3) || '0.000'}</td>
        <td class="text-right">&#8377; ${item.applied_rate?.toFixed(2) || '0.00'}</td>
        <td class="text-right">&#8377; ${item.making_charges?.toFixed(2) || '0.00'}</td>
        <td class="text-right">&#8377; ${item.hallmark_charges?.toFixed(2) || '0.00'}</td>
        <td class="text-right">&#8377; ${item.other_charges?.toFixed(2) || '0.00'}</td>
        <td class="text-right font-bold">&#8377; ${item.final_price?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      </tr>
    `).join('');
  } else if (data.old_items && data.old_items.length > 0) {
    itemsHtml = data.old_items.map((item: any, i: number) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td>
          <div class="font-bold">${item.item_name} (Old)</div>
        </td>
        <td class="text-center">${item.metal_type?.toUpperCase() || '-'}</td>
        <td class="text-center">${item.net_weight?.toFixed(3) || '0.000'}</td>
        <td class="text-right">&#8377; ${item.applied_rate?.toFixed(2) || '0.00'}</td>
        <td class="text-right">-</td>
        <td class="text-right">-</td>
        <td class="text-right">-</td>
        <td class="text-right font-bold">&#8377; ${item.final_price?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      </tr>
    `).join('');
  }

  // Use inline CSS for precise layout matching the screenshot
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} ${invoiceNo}</title>
</head>
<body>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --gold: #d4af37;
      --gold-light: #fbf8f1;
      --dark: #1e293b;
      --gray-light: #f3f4f6;
      --gray-border: #e5e7eb;
      --gray-text: #4b5563;
      --green: #15803d;
      --red: #b91c1c;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      color: #000;
      background: #fff;
      font-size: 11px;
      line-height: 1.4;
    }
    
    @page {
      size: A4 portrait;
      margin: 0; /* Remove browser default margins, headers, and footers */
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-wrapper {
        height: 100vh !important;
        page-break-after: avoid;
        page-break-inside: avoid;
      }
    }

    .invoice-wrapper {
      width: 210mm;
      height: 295mm; /* Near exact A4 height */
      margin: 0 auto;
      padding: 10mm;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .invoice-border {
      position: absolute;
      top: 5mm;
      bottom: 5mm;
      left: 5mm;
      right: 5mm;
      border: 1px solid var(--gold);
      z-index: -1;
      pointer-events: none;
    }

    /* HEADER */
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    
    .logo-area {
      text-align: center;
      width: 45%;
    }
    
    .logo-icon {
      width: 60px;
      height: 60px;
      border: 2px solid var(--gold);
      border-radius: 50%;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .logo-icon::before {
      content: "";
      position: absolute;
      top: -8px;
      width: 20px;
      height: 15px;
      border: 1px solid var(--gold);
      transform: rotate(45deg);
    }
    .logo-icon span {
      font-family: 'Cinzel', serif;
      font-size: 32px;
      color: var(--gold);
    }
    
    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      letter-spacing: 4px;
      color: var(--gold);
      margin-bottom: 2px;
    }
    
    .brand-subtitle {
      font-family: 'Cinzel', serif;
      font-size: 12px;
      letter-spacing: 8px;
      color: var(--gold);
      border-top: 1px solid var(--gold);
      border-bottom: 1px solid var(--gold);
      display: inline-block;
      padding: 2px 0;
      margin-bottom: 8px;
    }
    
    .brand-tagline {
      font-family: 'Great Vibes', cursive;
      font-size: 18px;
      color: #333;
    }
    
    .invoice-meta {
      width: 45%;
      text-align: right;
    }
    
    .invoice-title-box {
      background: var(--dark);
      color: #fff;
      font-family: 'Cinzel', serif;
      font-size: 18px;
      padding: 10px 20px;
      border-radius: 6px;
      border: 1px solid var(--gold);
      display: inline-block;
      letter-spacing: 1px;
      margin-bottom: 20px;
      width: 100%;
      text-align: center;
    }
    
    .meta-table {
      width: 100%;
      text-align: left;
    }
    .meta-table td {
      padding: 4px 0;
    }
    .meta-table td:first-child {
      font-weight: 600;
      width: 90px;
    }
    
    /* CONTACT & STATUTORY */
    .contact-statutory {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      align-items: flex-start;
    }
    
    .contact-info {
      width: 50%;
    }
    .contact-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 8px;
      gap: 10px;
    }
    .icon-circle {
      width: 20px;
      height: 20px;
      background: var(--dark);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      flex-shrink: 0;
    }
    
    .statutory-info {
      width: 45%;
      border-left: 1px solid var(--gold);
      padding-left: 20px;
      display: flex;
      justify-content: space-between;
    }
    .stat-table td {
      padding: 3px 0;
    }
    .stat-table td:first-child {
      font-weight: 600;
      width: 60px;
    }
    .qr-box {
      text-align: center;
    }
    .qr-placeholder {
      width: 60px;
      height: 60px;
      border: 1px solid #ccc;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
    }
    .qr-box span {
      font-size: 8px;
      font-weight: 600;
    }

    /* BILL TO & VALID TILL */
    .info-boxes {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      gap: 15px;
    }
    .info-box {
      flex: 1;
      background: var(--gold-light);
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 8px;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .info-icon {
      width: 40px;
      height: 40px;
      background: var(--dark);
      border: 1px solid var(--gold);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gold);
    }
    .info-icon svg { width: 20px; height: 20px; }
    
    .info-content h4 {
      color: var(--gold);
      font-size: 10px;
      font-weight: 700;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .info-content p {
      font-size: 12px;
      font-weight: 500;
      margin: 0;
      line-height: 1.3;
    }

    /* TABLE */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: var(--dark);
      color: var(--gold);
      font-weight: 600;
      font-size: 9px;
      padding: 12px 8px;
      text-transform: uppercase;
      text-align: center;
      border: 1px solid var(--dark);
    }
    .items-table td {
      padding: 12px 8px;
      border: 1px solid var(--gray-border);
      border-left: none;
      border-right: none;
    }
    .items-table tr:last-child td {
      border-bottom: 1px solid var(--gray-border);
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 600; }
    .text-xs { font-size: 10px; }
    .text-gray-500 { color: var(--gray-text); }

    /* TOTALS */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-box {
      width: 350px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 10px;
      font-size: 12px;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      font-size: 14px;
      font-weight: 700;
      color: var(--gold);
      border-top: 1px solid var(--gold);
      border-bottom: 1px solid var(--gold);
      margin: 5px 0 15px;
    }
    
    .payment-box {
      background: var(--gold-light);
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 6px;
      padding: 10px;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;
      font-weight: 600;
    }
    .payment-row.paid { color: var(--green); }
    .payment-row.due { color: var(--red); border-top: 1px dashed rgba(212, 175, 55, 0.3); padding-top: 10px; margin-top: 4px; }
    .payment-icon { display: flex; align-items: center; gap: 8px; }
    .payment-icon svg { width: 16px; height: 16px; }

    /* FOOTER / TERMS */
    .bottom-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .terms {
      width: 60%;
    }
    .terms h4 {
      color: var(--gold);
      font-size: 10px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .terms ul {
      list-style-type: disc;
      padding-left: 15px;
      color: #333;
      font-size: 10px;
    }
    .terms li { margin-bottom: 4px; }
    
    .signature {
      width: 30%;
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: flex-end;
    }
    .sig-image {
      font-family: 'Great Vibes', cursive;
      font-size: 32px;
      color: #444;
      line-height: 1;
      margin-bottom: -5px;
    }
    .sig-line {
      width: 150px;
      border-top: 1px solid #000;
      margin: 5px 0;
    }
    .sig-text {
      color: var(--gold);
      font-weight: 600;
      font-size: 10px;
    }

    /* DARK FOOTER STRIP */
    .dark-footer {
      margin-top: auto;
      background: var(--dark);
      color: #fff;
      padding: 20px;
      border: 1px solid var(--gold);
      position: relative;
      z-index: 10;
    }
    
    .footer-badges {
      display: flex;
      justify-content: space-around;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      padding-bottom: 20px;
    }
    .badge {
      display: flex;
      align-items: center;
      gap: 15px;
      width: 30%;
    }
    .badge-icon {
      color: var(--gold);
    }
    .badge-icon svg {
      width: 36px;
      height: 36px;
    }
    .badge-text {
      color: var(--gold);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      line-height: 1.4;
    }
    
    .footer-thanks {
      text-align: center;
      font-family: 'Great Vibes', cursive;
      font-size: 24px;
      color: var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
    
    /* Utility SVGs */
    .icon-svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <div class="invoice-wrapper">
    <div class="invoice-border"></div>
    
    <!-- HEADER -->
    <div class="header-container">
      <div class="logo-area">
        <div class="logo-icon"><span>S</span></div>
        <div class="brand-title">${companyName}</div>
        <div class="brand-subtitle">JEWELLERS</div><br>
        <div class="brand-tagline">Trust. Purity. Elegance.</div>
      </div>
      
      <div class="invoice-meta">
        <div class="invoice-title-box">${title}</div>
        <table class="meta-table">
          <tr>
            <td>Invoice No.</td>
            <td>: ${invoiceNo}</td>
          </tr>
          <tr>
            <td>Date</td>
            <td>: ${formattedDate}</td>
          </tr>
          <tr>
            <td>Place</td>
            <td>: ${place}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <!-- CONTACT & STATUTORY -->
    <div class="contact-statutory">
      <div class="contact-info">
        <div class="contact-item">
          <div class="icon-circle">
            <svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div>${companyAddress}</div>
        </div>
        <div class="contact-item">
          <div class="icon-circle">
            <svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div>${companyPhone}</div>
        </div>
        <div class="contact-item">
          <div class="icon-circle">
            <svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <div>${companyEmail}</div>
        </div>
      </div>
      
      <div class="statutory-info">
        <table class="stat-table">
          <tr>
            <td>GSTIN</td>
            <td>: ${gstin}</td>
          </tr>
          <tr>
            <td>PAN</td>
            <td>: ${gstin.substring(2, 12) || 'ABCDE1234F'}</td>
          </tr>
          <tr>
            <td>IEC</td>
            <td>: ${gstin.substring(2, 12) || 'ABCDE1234F'}</td>
          </tr>
        </table>
        <div class="qr-box">
          ${qrDataUrl 
            ? `<img src="${qrDataUrl}" width="60" height="60" style="margin-bottom: 4px;" />` 
            : `<div class="qr-placeholder" id="qr-code-placeholder">QR CODE</div>`
          }
          <span>SCAN TO VERIFY</span>
        </div>
      </div>
    </div>
    
    <!-- BILL TO & VALID TILL -->
    <div class="info-boxes">
      <div class="info-box">
        <div class="info-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <div class="info-content">
          <h4>BILL TO:</h4>
          <p>${customerName}<br>${customerPhone}</p>
        </div>
      </div>
      <div class="info-box">
        <div class="info-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div class="info-content">
          <h4>ESTIMATE VALID TILL:</h4>
          <p>${formattedValidTill}</p>
        </div>
      </div>
    </div>
    
    <!-- TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th width="5%">#</th>
          <th width="30%" class="text-left">ITEM DESCRIPTION</th>
          <th width="10%">METAL</th>
          <th width="10%">NET WEIGHT<br>(g)</th>
          <th width="10%">RATE<br>(₹/g)</th>
          <th width="10%">MAKING<br>CHARGES (₹)</th>
          <th width="10%">HALLMARK<br>CHARGES (₹)</th>
          <th width="10%">OTHER<br>CHARGES (₹)</th>
          <th width="15%" class="text-right">AMOUNT<br>(₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <!-- TOTALS -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span>Taxable Amount</span>
          <span>&#8377; ${taxableAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        <div class="totals-row">
          <span>GST (3.00%)</span>
          <span>&#8377; ${taxAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        <div class="grand-total-row">
          <span>GRAND TOTAL</span>
          <span>&#8377; ${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        
        <div class="payment-box">
          <div class="payment-row paid">
            <div class="payment-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
              Amount Paid
            </div>
            <span>&#8377; ${amountPaid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="payment-row due">
            <div class="payment-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"></path><rect x="4" y="6" width="16" height="12" rx="2"></rect></svg>
              Balance Due
            </div>
            <span>&#8377; ${balanceDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- BOTTOM / TERMS -->
    <div class="bottom-section">
      <div class="terms">
        <h4>TERMS & CONDITIONS:</h4>
        <ul>
          <li>This is an estimate invoice and not a final bill.</li>
          <li>Gold/Silver rates are subject to change without prior notice.</li>
          <li>Once sold, items cannot be exchanged or returned.</li>
          <li>Please retain this invoice for your records.</li>
        </ul>
      </div>
      <div class="signature">
        <div class="sig-image">${companyName.split(' ')[0]}</div>
        <div class="sig-line"></div>
        <div class="sig-text">For ${companyName}</div>
      </div>
    </div>
    
    <!-- DARK FOOTER -->
    <div class="dark-footer">
      <div class="footer-badges">
        <div class="badge">
          <div class="badge-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
          </div>
          <div class="badge-text">100%<br>HALLMARKED<br>JEWELLERY</div>
        </div>
        <div class="badge">
          <div class="badge-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"></path><path d="M11 3 8 9l4 13 4-13-3-6"></path><path d="M2 9h20"></path></svg>
          </div>
          <div class="badge-text">TRUST<br>QUALITY<br>SERVICE</div>
        </div>
        <div class="badge">
          <div class="badge-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          </div>
          <div class="badge-text">CERTIFIED<br>PURITY<br>ASSURED</div>
        </div>
      </div>
      <div class="footer-thanks">
        <span>~</span>
        Thank you for choosing ${companyName}.
        <span>~</span>
      </div>
    </div>
    
  </div>
</body>
</html>
  `;
};
