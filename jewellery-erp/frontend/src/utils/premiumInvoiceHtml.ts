
export const getCommonStyles = () => `
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
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', sans-serif;
      color: var(--text);
      background: white;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }
    
    @page { size: A4 portrait; margin: 0; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }

    .pdf-container {
      width: 100%;
      background: #e0e0e0; /* Just for preview if needed */
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .invoice-wrapper {
      width: 210mm;
      height: 296.5mm; /* slightly less than 297mm to prevent jsPDF rounding bleed */
      background: white;
      position: relative;
      padding: 8mm 5mm 8mm 5mm;
      box-sizing: border-box;
      overflow: hidden;
      /* removed page-break-after to fix blank 2nd page */
    }

    /* Rest of the CSS styles from previous premiumInvoiceHtml.ts... */
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: 'Cinzel', serif; font-size: 350px; color: var(--gold); opacity: 0.03; z-index: 0; pointer-events: none; }
    .content { position: relative; z-index: 1; min-height: 100%; height: max-content; display: flex; flex-direction: column; transform-origin: top center; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
    .logo-section { display: flex; align-items: center; gap: 15px; }
    .logo-circle { width: 70px; height: 70px; border-radius: 50%; border: 2px solid var(--gold); display: flex; align-items: center; justify-content: center; font-family: 'Cinzel', serif; font-size: 36px; color: var(--gold); position: relative; }
    .logo-circle::after { content: ''; position: absolute; width: 60px; height: 60px; border-radius: 50%; border: 1px solid rgba(200, 160, 69, 0.4); }
    .logo-img { max-width: 70px; max-height: 70px; object-fit: contain; }
    .company-info h1 { font-family: 'Cinzel', serif; font-size: 28px; font-weight: 600; color: var(--navy); line-height: 1.2; letter-spacing: 2px; margin-bottom: 4px; }
    .tagline { font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 700; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; }
    
    .tax-invoice-badge { background: var(--navy); color: var(--gold); padding: 12px 25px; border-radius: 8px 0 0 8px; font-family: 'Cinzel', serif; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 10px; margin-right: -15mm; margin-top: -8mm; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .tax-invoice-badge svg { width: 22px; height: 22px; fill: var(--gold); }
    .meta-table { margin-top: 20px; font-size: 10px; font-weight: 600; color: var(--navy); }
    .meta-table td { padding: 4px 15px 4px 0; }
    .meta-table td:first-child { width: 100px; }
    
    .diamond-divider { display: flex; align-items: center; margin: 5px 0 10px; }
    .diamond-divider::before, .diamond-divider::after { content: ''; flex: 1; height: 1px; background: var(--gold); opacity: 0.3; }
    .diamond { width: 6px; height: 6px; background: var(--gold); transform: rotate(45deg); margin: 0 10px; }
    
    .cards-row { display: flex; gap: 15px; margin-bottom: 5px; }
    .info-card { flex: 1; border: 1px solid var(--border); border-radius: 12px; padding: 6px 12px; background: #FAFAFA; position: relative; }
    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
    .card-icon { background: var(--navy); color: var(--gold); width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    .card-icon svg { width: 16px; height: 16px; fill: currentColor; }
    .card-title { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: var(--gold); letter-spacing: 1px; }
    .info-card h3 { font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 10px; }
    .info-line { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; color: var(--text); margin-bottom: 8px; }
    .info-line svg { width: 14px; height: 14px; fill: var(--text); opacity: 0.7; margin-top: 2px; flex-shrink: 0; }
    
    .items-table { width: 100%; border-collapse: separate; border-spacing: 0 4px; margin-top: 2px; }
    .items-table th { background: var(--navy); color: var(--gold); padding: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .items-table tbody td { background: #FAFAFA; padding: 4px 6px; font-size: 11px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); text-align: center; color: var(--navy-light); }
    .items-table th:nth-child(2), .items-table td:nth-child(2) { text-align: left; }
    
    .grand-total-box { margin-top: 15px; background: linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark)); border-radius: 8px; padding: 12px 20px; text-align: center; color: var(--navy); box-shadow: 0 4px 15px rgba(200, 160, 69, 0.3); position: relative; }
    .grand-total-box::after { content: ''; position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 10px; height: 10px; background: var(--gold-dark); border-radius: 50%; }
  </style>
`;

export const getPageWrapperStart = () => `
<div class="invoice-wrapper">
  <div class="watermark">SJ</div>
  <div class="content">
`;

export const getPageWrapperEnd = (company: any, pageNum: any, totalPages: any) => `
    <div style="text-align: center; margin-top: auto; padding-bottom: 45px; font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: var(--gold); letter-spacing: 1px;">
      Purity You Trust, Elegance You Deserve.
      <div style="font-size: 9px; margin-top: 4px; font-family: 'Inter', sans-serif;">Page ${pageNum} of ${totalPages}</div>
    </div>

    <!-- Thank You Badge Overlapping -->
    <div style="position: absolute; bottom: 0; right: 20px; z-index: 10; width: 75px; height: 75px; border-radius: 50%; background: #0B132B; border: 2px solid var(--gold); display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 -4px 10px rgba(0,0,0,0.1);">
      <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: var(--gold); margin-bottom: 2px;"><path d="M12 2l-5.5 9h11z"/><path d="M12 22l5.5-9h-11z"/></svg>
      <div style="font-family: 'Cinzel', serif; font-size: 10px; font-weight: 700; color: var(--gold); line-height: 1.1; text-align: center;">THANK<br>YOU</div>
      <div style="font-family: 'Inter', sans-serif; font-size: 6px; color: var(--gold); margin-top: 2px; text-transform: uppercase; letter-spacing: 1px;">For Your Visit</div>
    </div>

    <!-- Navy Strip Footer -->
    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 45px; background: #0B132B; display: flex; align-items: center; padding: 0 130px 0 30px; justify-content: space-between; color: white; font-size: 10px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: var(--gold);"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        ${company.address.split(',')[0]}, ${company.address.split(',')[1] || ''}
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: var(--gold);"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          ${company.phone}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: var(--gold);"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l-8 5-8-5v10h16zm-8-7L4 6h16l-8 5z"/></svg>
          ${company.email}
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: var(--gold);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        www.saideepjewellers.com
      </div>
    </div>
  </div>
</div>
`;

export const renderHeader = (company: any, invoice: any, logoDataUrl?: string) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    } catch { return dateString; }
  };
  return `
    <div class="header" style="margin-bottom: 2px;">
      <div class="logo-section">
        ${logoDataUrl ? `<img src="${logoDataUrl}" class="logo-img" />` : `<div class="logo-circle">SJ</div>`}
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
          <tr><td>INVOICE NO.</td><td>:</td><td style="color: var(--navy);">${invoice.invoice_number}</td></tr>
          <tr><td>DATE</td><td>:</td><td style="color: var(--navy);">${formatDate(invoice.invoice_date)}</td></tr>
          <tr><td>PLACE</td><td>:</td><td style="color: var(--navy);">${company.address.split(',')[0] || '-'}</td></tr>
          <tr><td>GSTIN</td><td>:</td><td style="color: var(--navy);">${company.gstin || '-'}</td></tr>
        </table>
      </div>
    </div>
    <div class="diamond-divider"><div class="diamond"></div></div>
  `;
};

export const renderCardsRow = (customer: any, qrDataUrl: string) => `
    <div class="cards-row">
      <div class="info-card">
        <div class="card-header">
          <div class="card-icon"><svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>
          <div class="card-title">BILL TO</div>
        </div>
        <h3>${customer.name}</h3>
        <div class="info-line"><svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg><span>${customer.phone || '-'}</span></div>
        <div class="info-line"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg><span>${customer.address || '-'}</span></div>
        <div class="info-line" style="margin-top: 10px; font-weight: 600;"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg><span>GSTIN: ${customer.gstin || '-'}</span></div>
      </div>
      <div class="info-card" style="display: flex; flex-direction: column;">
        <div class="card-header">
          <div class="card-icon"><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg></div>
          <div class="card-title">PAYMENT INFO</div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 5px; flex: 1;">
          <table style="font-size: 11px; font-weight: 600; color: #16213E;">
            <tr><td style="padding-bottom: 4px; width: 60px;">MODE</td><td style="padding-bottom: 4px;">:</td><td style="padding-bottom: 4px; padding-left: 10px;">NEFT / UPI / CASH</td></tr>
            <tr><td style="padding-bottom: 4px;">UPI ID</td><td style="padding-bottom: 4px;">:</td><td style="padding-bottom: 4px; padding-left: 10px;">saideepjewellers@upi</td></tr>
            <tr><td colspan="3" style="padding-top: 10px; font-size: 10px; color: #7f8c8d; font-weight: 700;">SCAN TO PAY</td></tr>
          </table>
          ${qrDataUrl ? `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 70px;">
            <img src="${qrDataUrl}" style="width: 55px; height: 55px; object-fit: contain; margin-bottom: 4px;" />
            <div style="background: var(--navy); color: white; border-radius: 4px; padding: 2px 6px; font-size: 8px; font-weight: 700; text-align: center; width: 100%;">SCAN TO PAY</div>
          </div>` : ''}
        </div>
      </div>
    </div>
`;

export const renderTableHeader = () => `
    <table class="items-table">
      <thead>
        <tr>
          <th>S.NO.</th><th>DESCRIPTION</th><th>METAL</th><th>PURITY</th><th>WEIGHT<br>(gm)</th><th>RATE<br>(₹/gm)</th><th>MAKING<br>(₹)</th><th>OTHER<br>(₹)</th><th>AMOUNT<br>(₹)</th>
        </tr>
      </thead>
      <tbody>
`;

export const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return '0.00';
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const renderTableRow = (item: any, index: number, isGold: boolean) => `
        <tr>
          <td>${index + 1}</td>
          <td style="text-align: left; font-weight: 600;">
            <div style="font-size: 14px; color: #16213E; font-weight: 700;">${item.item_name}</div>
            <div style="font-size: 11px; color: #7f8c8d; font-weight: 400; margin-top: 2px;">Gross: ${item.gross_weight || 0}g</div>
          </td>
          <td>${item.metal_type || '-'}</td>
          <td>${item.tanch_percentage ? item.tanch_percentage + (isGold ? 'K' : '%') : '-'}</td>
          <td>${(item.net_weight || item.pure_weight || 0).toFixed(3)}</td>
          <td>${formatCurrency(item.applied_rate || 0)}</td>
          <td>${formatCurrency(item.making_charges || 0)}</td>
          <td>${formatCurrency((item.other_charges || 0) + (item.hallmark_charges || 0))}</td>
          <td style="font-weight: 700;">₹ ${formatCurrency(item.final_price)}</td>
        </tr>
`;

export const renderTableEnd = () => `
      </tbody>
    </table>
`;

export const renderSettlements = (metals: string[], goldSettlement: any, silverSettlement: any) => {
  const hasGold = metals.includes('Gold');
  const hasSilver = metals.includes('Silver');
  if (!hasGold && !hasSilver) return '';

  const generateBox = (metal: 'GOLD' | 'SILVER', data: any, fullWidth: boolean) => {
    const { fineBilled = 0, fineReceived = 0 } = data || {};
    const fineBalance = fineBilled - fineReceived;
    const color = metal === 'GOLD' ? '#C8A045' : '#7f8c8d';

    return `
      <div style="flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; background: #FAFAFA; display: flex; flex-direction: column; ${fullWidth ? 'width: 100%;' : ''}">
        <div style="padding: 4px 8px; flex: 1;">
          <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: ${color}; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor;"><path d="M12 2L4 6v2h16V6l-8-4zm0 2.5l5.5 2.75h-11L12 4.5zM4 10v9h16v-9H4zm14 7H6v-5h12v5z"/></svg>
            ${metal} SETTLEMENT ${metal === 'GOLD' ? '(22K)' : '(92.5)'}
          </div>
          <table style="width: 100%; font-size: 10px; font-weight: 600; color: #16213E; margin-bottom: 4px; line-height: 1.4;">
            <tr><td>Total Metal</td><td style="text-align: right; width: 5%;">:</td><td style="text-align: right;">${fineBilled.toFixed(3)} gm</td></tr>
            <tr><td>Metal Receive</td><td style="text-align: right;">:</td><td style="text-align: right;">${fineReceived.toFixed(3)} gm</td></tr>
            <tr><td colspan="3"><hr style="border: none; border-top: 1px dashed #E5E7EB; margin: 4px 0;"></td></tr>
            <tr><td>Metal Due (Weight)</td><td style="text-align: right;">:</td><td style="text-align: right; color: ${fineBalance < 0 ? '#c0392b' : '#27ae60'};">${fineBalance.toFixed(3)} gm</td></tr>
          </table>
        </div>
        <div style="background: ${color}; border-radius: 0 0 8px 8px; padding: 4px; text-align: center; color: white;">
          <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; margin-bottom: 2px;">METAL DUE (${metal})</div>
          <div style="font-size: 16px; font-weight: 800; margin-bottom: 2px;">${fineBalance.toFixed(3)} gm</div>
        </div>
      </div>`;
  };

  const fullWidth = (hasGold && !hasSilver) || (!hasGold && hasSilver);

  return `
    <div style="margin-top: 10px;">
      <div style="text-align: center; color: var(--gold); font-family: 'Cinzel', serif; font-weight: 700; font-size: 11px; margin-bottom: 4px;">
          <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor; vertical-align: middle; margin-right: 5px;"><path d="M12 2L4 6v2h16V6l-8-4zm0 2.5l5.5 2.75h-11L12 4.5zM4 10v9h16v-9H4zm14 7H6v-5h12v5z"/></svg>
          METAL SETTLEMENT
      </div>
      <div style="display: flex; gap: 8px;">
          ${hasGold ? generateBox('GOLD', goldSettlement, fullWidth) : ''}
          ${hasSilver ? generateBox('SILVER', silverSettlement, fullWidth) : ''}
      </div>
      <div style="text-align: center; font-size: 9px; color: #7f8c8d; margin-top: 4px;">
          If fine balance is 0.000 gm, no fine is due. If there is any difference, fine due will be charged as per rate.
      </div>
    </div>
  `;
};

const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  return str.trim() + ' Only';
};

export const renderBottomRow = (metals: string[], invoice: any, totals: any, settings: any) => {
  const taxableAmount = invoice.subtotal || 0;
  const gstAmount = invoice.tax_amount || 0;
  const grandTotal = invoice.grand_total || 0;
  const amountInWords = numberToWords(Math.round(grandTotal));

  const hasGold = metals.includes('Gold');
  const hasSilver = metals.includes('Silver');
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try { return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase(); } catch { return dateString; }
  };

  return `
    <div style="display: flex; gap: 10px; margin-top: 10px;">
      <!-- AMOUNT SUMMARY -->
      <div style="flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; background: #FAFAFA; display: flex; flex-direction: column;">
        <div style="padding: 4px 8px; flex: 1;">
          <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: var(--gold); display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            AMOUNT SUMMARY
          </div>
          <table style="width: 100%; font-size: 10px; font-weight: 600; color: #16213E; margin-bottom: 4px; line-height: 1.4;">
            ${hasGold ? `<tr><td>Total Gold Amount</td><td style="text-align: right;">:</td><td style="text-align: right;">₹ ${formatCurrency(totals.totalGoldAmount)}</td></tr>` : ''}
            ${hasSilver ? `<tr><td>Total Silver Amount</td><td style="text-align: right;">:</td><td style="text-align: right;">₹ ${formatCurrency(totals.totalSilverAmount)}</td></tr>` : ''}
            <tr><td colspan="3" style="padding-top: 2px;"></td></tr>
            <tr><td>Making Charges</td><td style="text-align: right;">:</td><td style="text-align: right;">₹ ${formatCurrency(totals.totalMakingCharges)}</td></tr>
            <tr><td>Other Charges</td><td style="text-align: right;">:</td><td style="text-align: right;">₹ ${formatCurrency(totals.totalOtherCharges)}</td></tr>
            <tr><td colspan="3"><hr style="border: none; border-top: 1px dashed #E5E7EB; margin: 4px 0;"></td></tr>
            <tr><td>Taxable Amount</td><td style="text-align: right;">:</td><td style="text-align: right;">₹ ${formatCurrency(taxableAmount)}</td></tr>
            <tr><td>GST</td><td style="text-align: right;">:</td><td style="text-align: right;">₹ ${formatCurrency(gstAmount)}</td></tr>
            <tr><td>Round Off</td><td style="text-align: right;">:</td><td style="text-align: right;">₹ ${formatCurrency(grandTotal - (taxableAmount + gstAmount))}</td></tr>
          </table>
        </div>
        <div style="background: var(--gold); border-radius: 0 0 8px 8px; padding: 4px; text-align: center; color: #16213E;">
          <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; margin-bottom: 2px;">GRAND TOTAL</div>
          <div style="font-size: 16px; font-weight: 800; margin-bottom: 2px;">₹ ${formatCurrency(grandTotal)}</div>
          <div style="font-size: 8px; font-weight: 600;">(${amountInWords})</div>
        </div>
      </div>

      <!-- Status & Payment details -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
        <div style="background: var(--green-bg); border: 1px solid #86EFAC; border-radius: 8px; padding: 6px 8px; display: flex; align-items: center; gap: 8px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--green); color: white; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: white;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <div>
            <div style="color: var(--green); font-size: 11px; font-weight: 700; letter-spacing: 1px;">AMOUNT PAID</div>
            <div style="color: var(--green); font-size: 20px; font-weight: 800;">₹ ${formatCurrency(invoice.amount_paid || 0)}</div>
            <div style="color: var(--green); font-size: 11px; margin-top: 2px;">Thank you!</div>
          </div>
        </div>
        <div style="background: var(--red-bg); border: 1px solid #FCA5A5; border-radius: 8px; padding: 6px 8px; display: flex; align-items: center; gap: 8px;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--red); color: white; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 16px; font-weight: bold;">!</span>
          </div>
          <div>
            <div style="color: var(--red); font-size: 9px; font-weight: 700; letter-spacing: 1px;">AMOUNT DUE</div>
            <div style="color: var(--red); font-size: 14px; font-weight: 800;">₹ ${formatCurrency(invoice.balance_due || 0)}</div>
            <div style="color: var(--red); font-size: 8px; margin-top: 1px;">Please make the payment.</div>
          </div>
        </div>
        <div style="border: 1px solid #E5E7EB; border-radius: 8px; background: #FAFAFA; padding: 4px 8px; flex: 1;">
          <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: #2C3E50; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor;"><path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12zm-9-2h9v-2h-9v2z"/></svg>
            PAYMENT DETAILS
          </div>
          <table style="width: 100%; font-size: 10px; font-weight: 600; color: #16213E; line-height: 1.4;">
            <tr><td style="width: 45%;">Amount Paid</td><td style="text-align: right; width: 5%;">:</td><td style="text-align: right;">₹ ${formatCurrency(invoice.amount_paid || 0)}</td></tr>
            <tr><td>Date</td><td style="text-align: right;">:</td><td style="text-align: right;">${formatDate(invoice.invoice_date)}</td></tr>
            <tr><td>Mode</td><td style="text-align: right;">:</td><td style="text-align: right;">UPI / CASH</td></tr>
            <tr><td>Transaction ID</td><td style="text-align: right;">:</td><td style="text-align: right;">-</td></tr>
          </table>
        </div>
      </div>

      <!-- OTHER DETAILS -->
      <div style="flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; background: #FAFAFA; padding: 4px 8px;">
        <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: #D35400; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
          OTHER DETAILS
        </div>
        <table style="width: 100%; font-size: 10px; font-weight: 600; color: #16213E; line-height: 1.6;">
          <tr>
            <td style="vertical-align: top; width: 40%;">Hallmark</td>
            <td style="vertical-align: top; text-align: right; width: 10%;">:</td>
            <td style="vertical-align: top; text-align: right; white-space: pre-wrap;">${settings.print_hallmark || 'BIS 916 (Gold)\nBIS 925 (Silver)'}</td>
          </tr>
          <tr>
            <td style="vertical-align: top;">Wastage</td>
            <td style="vertical-align: top; text-align: right;">:</td>
            <td style="vertical-align: top; text-align: right; white-space: pre-wrap;">${settings.print_wastage || '0.00%'}</td>
          </tr>
          <tr>
            <td style="vertical-align: top;">Making Charges</td>
            <td style="vertical-align: top; text-align: right;">:</td>
            <td style="vertical-align: top; text-align: right; white-space: pre-wrap;">${settings.print_making_charges || 'Gold ₹ 1,000.00/gm\nSilver ₹ 20.00/gm'}</td>
          </tr>
          <tr>
            <td style="vertical-align: top;">Remarks</td>
            <td style="vertical-align: top; text-align: right;">:</td>
            <td style="vertical-align: top; text-align: right; white-space: pre-wrap;">${settings.print_remarks || '-'}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
};
