import type { InvoicePDFData } from './invoicePdfUtils';

export const generatePremiumHTML = (
  data: InvoicePDFData,
  qrDataUrl: string,
  logoDataUrl?: string
): string => {
  const company = data.company || {
    name: 'SAIDEEP JEWELLERS',
    address: '123 Jewellery Lane, City, Country',
    phone: '+91 98765 43210',
    email: 'contact@saideep.com',
    gstin: '22AAAAA0000A1Z5'
  };
  
  const customer = data.customer || {
    name: 'Cash Customer',
    phone: '',
    address: '',
    email: ''
  };
  
  const invoice = data.invoice || {
    invoice_number: 'INV-001',
    invoice_date: new Date().toISOString(),
    status: 'paid',
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    grand_total: 0,
    amount_paid: 0,
    balance_due: 0
  };
  
  const items = data.items || [];
  const oldItems = data.old_items || [];
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).toUpperCase();
    } catch {
      return dateString;
    }
  };
  
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '0.00';
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Calculate total values properly
  const taxableAmount = invoice.subtotal || 0;
  const gstAmount = invoice.tax_amount || 0;
  const grandTotal = invoice.grand_total || 0;
  
  // Generate items HTML
  let itemsHtml = '';
  items.forEach((item, index) => {
    itemsHtml += `
      <tr>
        <td>${index + 1}</td>
        <td style="text-align: left; font-weight: 600;">
          <div style="font-size: 14px; color: #16213E; font-weight: 700;">${item.item_name}</div>
          <div style="font-size: 11px; color: #7f8c8d; font-weight: 400; margin-top: 2px;">Gross: ${item.gross_weight || 0}g</div>
        </td>
        <td>${item.metal_type || '-'}</td>
        <td>${item.tanch_percentage ? item.tanch_percentage + '%' : '-'}</td>
        <td>${(item.net_weight || item.pure_weight || 0).toFixed(3)}g</td>
        <td>${formatCurrency(item.applied_rate || 0)}</td>
        <td>${formatCurrency(item.making_charges || 0)}</td>
        <td>${formatCurrency(item.hallmark_charges || 0)}</td>
        <td>${formatCurrency(item.other_charges || 0)}</td>
        <td style="font-weight: 700;">₹ ${formatCurrency(item.final_price)}</td>
      </tr>
    `;
  });
  
  // Also add old items if any
  oldItems.forEach((item, index) => {
    itemsHtml += `
      <tr style="background-color: #fcf3f3;">
        <td>${items.length + index + 1}</td>
        <td style="text-align: left;">
          <div style="font-size: 14px; color: #c0392b; font-weight: 700;">${item.item_name} (Received)</div>
          <div style="font-size: 11px; color: #7f8c8d; margin-top: 2px;">Gross: ${item.gross_weight || 0}g</div>
        </td>
        <td>${item.metal_type || '-'}</td>
        <td>${item.tanch_percentage ? item.tanch_percentage + '%' : '-'}</td>
        <td>${(item.net_weight || 0).toFixed(3)}g</td>
        <td>${formatCurrency(item.applied_rate || 0)}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td style="font-weight: 700; color: #c0392b;">-₹ ${formatCurrency(item.final_price)}</td>
      </tr>
    `;
  });
  
  // Fill empty rows to make it look full if few items
  const totalRows = items.length + oldItems.length;
  const minRows = 2;
  if (totalRows < minRows) {
    for (let i = 0; i < minRows - totalRows; i++) {
      itemsHtml += `
        <tr>
          <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        </tr>
      `;
    }
  }

  // The actual HTML template matching the screenshot perfectly
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0B132B;
      --navy-light: #16213E;
      --gold: #C8A045;
      --gold-light: #DFB967;
      --gold-dark: #B18835;
      --text: #333333;
      --border: #E5E7EB;
      --green: #15803D;
      --green-bg: #F0FDF4;
      --red: #B91C1C;
      --red-bg: #FEF2F2;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      color: var(--text);
      background: white;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }
    
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .invoice-wrapper {
        border: none !important;
        margin: 0 !important;
        height: 290mm !important;
        max-height: 290mm !important;
        overflow: hidden;
      }
    }

    .invoice-wrapper {
      width: 210mm;
      height: 290mm;
      max-height: 290mm;
      margin: 0 auto;
      background: white;
      position: relative;
      padding: 10mm 15mm 15mm 15mm;
      box-sizing: border-box;
      overflow: hidden;
      border: 1px solid #f0f0f0; /* Just for screen preview */
    }

    /* Faint Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Cinzel', serif;
      font-size: 350px;
      color: var(--gold);
      opacity: 0.03;
      z-index: 0;
      pointer-events: none;
    }

    /* Content Wrapper */
    .content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Top Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .logo-circle {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 2px solid var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cinzel', serif;
      font-size: 36px;
      color: var(--gold);
      position: relative;
    }
    
    .logo-circle::after {
      content: '';
      position: absolute;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 1px solid rgba(200, 160, 69, 0.4);
    }

    .logo-img {
      max-width: 70px;
      max-height: 70px;
      object-fit: contain;
    }

    .company-info h1 {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 600;
      color: var(--navy);
      line-height: 1.2;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }

    .tagline {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: 700;
      color: var(--gold);
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .tax-invoice-badge {
      background: var(--navy);
      color: var(--gold);
      padding: 12px 25px;
      border-radius: 8px 0 0 8px;
      font-family: 'Cinzel', serif;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-right: -15mm; /* Extend to edge */
      margin-top: -10mm;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .tax-invoice-badge svg {
      width: 22px;
      height: 22px;
      fill: var(--gold);
    }

    .meta-table {
      margin-top: 20px;
      font-size: 10px;
      font-weight: 600;
      color: var(--navy);
    }

    .meta-table td {
      padding: 4px 15px 4px 0;
    }

    .meta-table td:first-child {
      width: 100px;
    }

    /* Diamond Divider */
    .diamond-divider {
      display: flex;
      align-items: center;
      margin: 10px 0 15px;
    }

    .diamond-divider::before,
    .diamond-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--gold);
      opacity: 0.3;
    }

    .diamond {
      width: 6px;
      height: 6px;
      background: var(--gold);
      transform: rotate(45deg);
      margin: 0 10px;
    }

    /* Cards Row */
    .cards-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    .info-card {
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      background: #FAFAFA;
      position: relative;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }

    .card-icon {
      background: var(--navy);
      color: var(--gold);
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .card-title {
      font-family: 'Cinzel', serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--gold);
      letter-spacing: 1px;
    }

    .info-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 10px;
    }

    .info-line {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 12px;
      color: var(--text);
      margin-bottom: 8px;
    }

    .info-line svg {
      width: 14px;
      height: 14px;
      fill: var(--text);
      opacity: 0.7;
      margin-top: 2px;
      flex-shrink: 0;
    }

    /* QR Code */
    .qr-box {
      position: absolute;
      right: 20px;
      top: 20px;
      text-align: center;
      background: white;
      padding: 5px;
      border: 1px solid var(--border);
      border-radius: 6px;
    }

    .qr-img {
      width: 70px;
      height: 70px;
      display: block;
    }

    .qr-text {
      background: var(--navy);
      color: white;
      font-size: 8px;
      font-weight: 600;
      padding: 4px 6px;
      border-radius: 4px;
      margin-top: 5px;
      letter-spacing: 0.5px;
    }

    /* Table */
    .items-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 20px;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .items-table th {
      background: var(--navy);
      color: var(--gold);
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      padding: 14px 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--gold);
    }
    
    .items-table th:nth-child(2) {
      text-align: left;
    }

    .items-table td {
      font-size: 12px;
      text-align: center;
      padding: 10px;
      border-bottom: 1px solid var(--border);
      color: var(--navy-light);
    }
    
    .items-table tr:last-child td {
      border-bottom: none;
    }

    /* Summary & Totals Row */
    .bottom-row {
      display: flex;
      gap: 25px;
      margin-bottom: 25px;
    }

    /* Summary Card */
    .summary-card {
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 25px;
      background: white;
    }

    .summary-title {
      font-family: 'Cinzel', serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--gold);
      letter-spacing: 1px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      color: var(--navy);
      margin-bottom: 15px;
    }

    .grand-total-box {
      margin-top: 20px;
      background: linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark));
      border-radius: 8px;
      padding: 18px 25px;
      text-align: center;
      color: var(--navy);
      box-shadow: 0 4px 15px rgba(200, 160, 69, 0.3);
      position: relative;
    }
    
    .grand-total-box::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px;
      height: 10px;
      background: var(--gold-dark);
      border-radius: 50%;
      transform: translateX(-50%) rotate(45deg);
    }

    .grand-total-box .title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }

    .grand-total-box .amount {
      font-family: 'Cinzel', serif;
      font-size: 32px;
      font-weight: 700;
    }

    /* Status Cards */
    .status-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .status-card {
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 25px;
    }

    .status-card.paid {
      background: var(--green-bg);
      border-color: rgba(21, 128, 61, 0.2);
    }

    .status-card.due {
      background: var(--red-bg);
      border-color: rgba(185, 28, 28, 0.2);
    }

    .status-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-card.paid .status-icon {
      background: var(--green);
      color: white;
    }
    
    .status-card.due .status-icon {
      background: var(--red);
      color: white;
    }

    .status-icon svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    .status-info .label {
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }

    .status-card.paid .label { color: var(--green); }
    .status-card.due .label { color: var(--red); }

    .status-info .amount {
      font-size: 22px;
      font-weight: 700;
    }

    .status-card.paid .amount { color: var(--green); }
    .status-card.due .amount { color: var(--red); }

    /* Footer / Terms Section */
    .bottom-section {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 15px;
      border-top: 1px solid var(--border);
    }

    .terms {
      flex: 1;
    }
    
    .terms h4 {
      font-size: 11px;
      font-weight: 700;
      color: var(--gold);
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }

    .terms ul {
      list-style-type: disc;
      padding-left: 15px;
      margin: 0;
    }

    .terms li {
      font-size: 10px;
      color: var(--navy);
      margin-bottom: 6px;
      font-weight: 600;
    }

    .signature-box {
      text-align: center;
      width: 220px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .signature-title {
      font-size: 10px;
      font-weight: 700;
      color: var(--gold);
      margin-bottom: 35px;
      letter-spacing: 0.5px;
    }
    
    .signature-line {
      height: 1.5px;
      background: var(--gold);
      margin-bottom: 8px;
    }

    .signature-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--gold);
      letter-spacing: 0.5px;
    }
    
    .signature-img {
      height: 45px;
      margin-bottom: 12px;
      object-fit: contain;
    }

    /* Bottom Navy Strip */
    .navy-strip {
      background: var(--navy);
      margin-left: -15mm;
      margin-right: -15mm;
      margin-bottom: -15mm;
      margin-top: 15px;
      padding: 15px 20mm;
      display: flex;
      justify-content: space-between;
      color: white;
      flex-shrink: 0;
    }

    .strip-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .strip-icon {
      color: var(--gold);
    }
    
    .strip-icon svg {
      width: 32px;
      height: 32px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.2;
    }

    .strip-text {
      display: flex;
      flex-direction: column;
    }
    
    .strip-text .top {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--gold);
    }
    
    .strip-text .bottom {
      font-size: 9px;
      color: #94A3B8;
      margin-top: 3px;
    }

  </style>
</head>
<body>

<div class="invoice-wrapper">
  
  <div class="watermark">SJ</div>

  <div class="content">
    
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        ${logoDataUrl ? 
          `<img src="${logoDataUrl}" class="logo-img" />` : 
          `<div class="logo-circle">SJ</div>`
        }
        <div class="company-info">
          <h1>${company.name.replace(' ', '<br>')}</h1>
          <div class="tagline">TIMELESS BEAUTY. TRUSTED FOREVER.</div>
        </div>
      </div>
      
      <div style="text-align: right;">
        <div class="tax-invoice-badge">
          <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          TAX INVOICE
        </div>
        
        <table class="meta-table" style="margin-left: auto;">
          <tr>
            <td>INVOICE NO.</td>
            <td>:</td>
            <td style="color: var(--navy);">${invoice.invoice_number}</td>
          </tr>
          <tr>
            <td>DATE</td>
            <td>:</td>
            <td style="color: var(--navy);">${formatDate(invoice.invoice_date)}</td>
          </tr>
          <tr>
            <td>PLACE</td>
            <td>:</td>
            <td style="color: var(--navy);">${company.address.split(',')[0] || '-'}</td>
          </tr>
          <tr>
            <td>GSTIN</td>
            <td>:</td>
            <td style="color: var(--navy);">${company.gstin || '111111111111111'}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="diamond-divider">
      <div class="diamond"></div>
    </div>

    <!-- Cards Row -->
    <div class="cards-row">
      <!-- Bill To -->
      <div class="info-card">
        <div class="card-header">
          <div class="card-icon">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div class="card-title">BILL TO</div>
        </div>
        <h3>${customer.name}</h3>
        <div class="info-line">
          <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          <span>${customer.phone || '-'}</span>
        </div>
        <div class="info-line">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span>${customer.address || '-'}</span>
        </div>
        <div class="info-line" style="margin-top: 10px; font-weight: 600;">
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          <span>GSTIN : -</span>
        </div>
      </div>

      <!-- Payment Info -->
      <div class="info-card">
        <div class="card-header">
          <div class="card-icon">
            <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
          </div>
          <div class="card-title">PAYMENT INFO</div>
        </div>
        
        <table style="font-size: 12px; margin-top: 20px;">
          <tr>
            <td style="font-weight: 700; color: var(--navy); padding-bottom: 15px; padding-right: 20px;">MODE</td>
            <td style="padding-bottom: 15px;">: Cash / UPI / Card</td>
          </tr>
          <tr>
            <td style="font-weight: 700; color: var(--navy); padding-right: 20px;">PAN</td>
            <td>: 77777777777</td>
          </tr>
        </table>

        ${qrDataUrl ? `
        <div class="qr-box">
          <img src="${qrDataUrl}" class="qr-img" />
          <div class="qr-text">SCAN TO VERIFY</div>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>ITEM DESCRIPTION</th>
          <th>METAL</th>
          <th>PURITY</th>
          <th>WEIGHT</th>
          <th>RATE<br>(₹)</th>
          <th>MAKING<br>(₹)</th>
          <th>HALLMARK<br>(₹)</th>
          <th>OTHER<br>(₹)</th>
          <th>AMOUNT<br>(₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Bottom Row -->
    <div class="bottom-row">
      <!-- Summary -->
      <div class="summary-card">
        <div class="summary-title">SUMMARY</div>
        
        <div class="summary-line">
          <span>TAXABLE AMOUNT</span>
          <span>₹ ${formatCurrency(taxableAmount)}</span>
        </div>
        <div class="summary-line">
          <span>GST (3.00%)</span>
          <span>₹ ${formatCurrency(gstAmount)}</span>
        </div>
        <div class="summary-line">
          <span>ROUND OFF</span>
          <span>₹ ${formatCurrency(grandTotal - (taxableAmount + gstAmount))}</span>
        </div>

        <div class="grand-total-box">
          <div class="title">GRAND TOTAL</div>
          <div class="amount">₹ ${formatCurrency(grandTotal)}</div>
        </div>
      </div>

      <!-- Status -->
      <div class="status-col">
        <div class="status-card paid">
          <div class="status-icon">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <div class="status-info">
            <div class="label">AMOUNT PAID</div>
            <div class="amount">₹ ${formatCurrency(invoice.amount_paid || 0)}</div>
          </div>
        </div>

        <div class="status-card due">
          <div class="status-icon">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <div class="status-info">
            <div class="label">BALANCE DUE</div>
            <div class="amount">₹ ${formatCurrency(invoice.balance_due || 0)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Terms & Signature -->
    <div class="bottom-section">
      <div class="terms">
        <h4>TERMS & CONDITIONS</h4>
        <ul>
          <li>This is a computer generated invoice and does not require any signature.</li>
          <li>Gold/Silver rates are subject to change without prior notice.</li>
          <li>Once sold, goods cannot be exchanged or returned.</li>
          <li>Please retain this invoice for your records.</li>
        </ul>
      </div>

      <div class="signature-box">
        <div class="signature-title">AUTHORIZED SIGNATURE</div>
        <div style="font-family: 'Dancing Script', cursive; font-size: 32px; font-weight: 700; color: var(--navy); margin-bottom: 10px; line-height: 1;">Saideep</div>
        <div class="signature-line"></div>
        <div class="signature-label">FOR SAIDEEP JEWELLERS</div>
      </div>
    </div>

    <!-- Navy Strip Footer -->
    <div class="navy-strip">
      <div class="strip-item">
        <div class="strip-icon">
          <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
        </div>
        <div class="strip-text">
          <span class="top">BIS HALLMARKED<br>JEWELLERY</span>
          <span class="bottom">100% Certified</span>
        </div>
      </div>

      <div class="strip-item">
        <div class="strip-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
        </div>
        <div class="strip-text">
          <span class="top">CERTIFIED<br>PURITY</span>
          <span class="bottom">Assured Quality</span>
        </div>
      </div>

      <div class="strip-item">
        <div class="strip-icon">
          <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
        </div>
        <div class="strip-text">
          <span class="top">SECURE<br>BILLING</span>
          <span class="bottom">Safe & Reliable</span>
        </div>
      </div>

      <div class="strip-item">
        <div class="strip-icon">
          <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        </div>
        <div class="strip-text">
          <span class="top">TRUSTED<br>SINCE 2020</span>
          <span class="bottom">Customer First</span>
        </div>
      </div>
    </div>

  </div>
</div>

</body>
</html>
  `;
};
