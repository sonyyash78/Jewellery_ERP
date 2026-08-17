
import QRCode from 'qrcode';

export interface InvoicePDFData {
  type?: string;
  invoice: any;
  customer: any;
  items: Array<any>;
  old_items?: Array<any>;
  company: any;
  totals: any;
}

export const normalizeMetal = (metalType: string | undefined): string => {
  if (!metalType) return '';
  const m = metalType.toLowerCase();
  if (m.includes('gold')) return 'Gold';
  if (m.includes('silver')) return 'Silver';
  return metalType;
};

export const generateInvoiceHtml = async (data: InvoicePDFData): Promise<string> => {
  try {
    // @ts-ignore
    const premiumComponents = await import('./premiumInvoiceHtml');
    
    // Fallback data mapping if missing
    const company = data.company || { name: 'SAIDEEP JEWELLERS', address: '123 Jewellery Lane, City, Country', phone: '+91 98765 43210', email: 'contact@saideep.com', gstin: '22AAAAA0000A1Z5' };
    const customer = data.customer || { name: 'Cash Customer', phone: '', address: '', email: '', gstin: '', pan: '' };
    const invoice = data.invoice || { invoice_number: 'INV-001', invoice_date: new Date().toISOString(), status: 'paid', subtotal: 0, tax_amount: 0, discount_amount: 0, grand_total: 0, amount_paid: 0, balance_due: 0 };
    const allItems = data.items || [];
    const items = allItems.filter((i: any) => !(i.item_name?.toLowerCase().includes('old') && i.item_name?.toLowerCase().includes('deposit')));
    const oldItems = [...(data.old_items || []), ...allItems.filter((i: any) => (i.item_name?.toLowerCase().includes('old') && i.item_name?.toLowerCase().includes('deposit')))];

    let qrDataUrl = '';
    try {
      const qrData = `${invoice.invoice_number}|${invoice.grand_total}`;
      qrDataUrl = await QRCode.toDataURL(qrData, { width: 60, margin: 0 });
    } catch (e) {
      console.warn('Failed to generate QR', e);
    }

    let logoDataUrl = '';
    try {
      const response = await fetch('http://localhost:8000/static/logo.png?v=' + Date.now(), { cache: 'no-store' });
      if (response.ok) {
        const blob = await response.blob();
        logoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.warn('Failed to fetch logo', e);
    }

    let settings: any = {};
    try {
      const { axiosClient } = await import('../api/axiosClient');
      const res = await axiosClient.get('/settings/');
      settings = res.data || {};
    } catch (e) {
      console.warn('Failed to fetch settings', e);
    }

    // Calculations
    let goldBilled = { fineBilled: 0, fineReceived: 0, billedValue: 0, receivedValue: 0 };
    let silverBilled = { fineBilled: 0, fineReceived: 0, billedValue: 0, receivedValue: 0 };
    let totals = { totalGoldAmount: 0, totalSilverAmount: 0, totalMakingCharges: 0, totalOtherCharges: 0 };
    const detectedMetals = new Set<string>();

    items.forEach((item) => {
      const isGold = item.item_type === 'Gold' || normalizeMetal(item.metal_type) === 'Gold';
      if (isGold) detectedMetals.add('Gold');
      else detectedMetals.add('Silver');

      const val = item.metal_value || item.final_price || 0;
      const making = item.making_charges || 0;
      const other = (item.other_charges || 0) + (item.hallmark_charges || 0);

      if (isGold) {
        goldBilled.fineBilled += item.gold_calculation?.fine_weight || item.fine_weight || item.gold_calculation?.net_weight || item.net_weight || 0;
        goldBilled.billedValue += val;
        totals.totalGoldAmount += val + making + other;
      } else {
        silverBilled.fineBilled += item.silver_calculation?.pure_weight || item.fine_weight || item.silver_calculation?.net_weight || item.net_weight || 0;
        silverBilled.billedValue += val;
        totals.totalSilverAmount += val + making + other;
      }
      totals.totalMakingCharges += making;
      totals.totalOtherCharges += other;
    });

    oldItems.forEach((item) => {
      const isGold = item.item_type === 'Gold' || normalizeMetal(item.metal_type) === 'Gold';
      if (isGold) {
        goldBilled.fineReceived += item.gold_calculation?.net_weight || item.fine_weight || item.net_weight || 0;
        goldBilled.receivedValue += item.final_price || 0;
      } else {
        silverBilled.fineReceived += item.silver_calculation?.net_weight || item.fine_weight || item.net_weight || 0;
        silverBilled.receivedValue += item.final_price || 0;
      }
    });

    const metalsArray = Array.from(detectedMetals);
    if (oldItems.length > 0 && metalsArray.length === 0) {
       // if only depositing old items
       if (goldBilled.fineReceived > 0) metalsArray.push('Gold');
       if (silverBilled.fineReceived > 0) metalsArray.push('Silver');
    }

    // DOM Measurement Engine (Isolated to prevent CSS bleed and ensure accurate font/style measurements)
    const measureIframe = document.createElement('iframe');
    measureIframe.style.position = 'fixed';
    measureIframe.style.top = '0';
    measureIframe.style.left = '-9999px';
    measureIframe.style.width = '210mm';
    measureIframe.style.visibility = 'hidden';
    document.body.appendChild(measureIframe);

    const idoc = measureIframe.contentWindow?.document;
    if (idoc) {
      idoc.open();
      idoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          ${premiumComponents.getCommonStyles()}
        </head>
        <body>
          <div id="page-measure" class="invoice-wrapper">
             <div class="content">
                <div id="footer-measure" style="text-align: center; margin-top: auto; padding-bottom: 60px; font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; color: var(--gold); letter-spacing: 1px;">
                  Purity You Trust, Elegance You Deserve.
                  <div style="font-size: 9px; margin-top: 4px; font-family: 'Inter', sans-serif;">Page 1 of 1</div>
                </div>
             </div>
          </div>
          <div id="measure-box" class="invoice-wrapper" style="height: auto; min-height: 0; max-height: none; padding: 0; border: none; overflow: visible;"></div>
        </body>
        </html>
      `);
      idoc.close();
    }





    // We build the full final HTML structure inside <div class="pdf-container">
    let finalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">`;
    finalHtml += `<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
    finalHtml += premiumComponents.getCommonStyles();
    
    // PERMANENT 1-PAGE FIX: Auto-scale script injected into the print window
    finalHtml += `<script>
      window.onload = function() {
        const wrapper = document.querySelector('.invoice-wrapper');
        const content = document.querySelector('.content');
        if (wrapper && content) {
          const maxH = wrapper.clientHeight; // 297mm
          const contentH = content.scrollHeight;
          if (contentH > maxH) {
             const scale = maxH / contentH;
             content.style.transform = 'scale(' + scale + ')';
             content.style.height = maxH + 'px'; // prevent wrapper from collapsing
          }
        }
      };
    </script>`;
    
    finalHtml += `</head><body><div class="pdf-container">`;

    // Always use exactly one page
    finalHtml += premiumComponents.getPageWrapperStart();

    // Header & Info
    finalHtml += premiumComponents.renderHeader(company, invoice, logoDataUrl) + premiumComponents.renderCardsRow(customer, qrDataUrl);

    // Items
    finalHtml += premiumComponents.renderTableHeader();
    
    if (items.length === 0) {
      finalHtml += premiumComponents.renderTableRow({ item_name: 'No items', final_price: 0 }, 0, true);
    } else {
      items.forEach((item, index) => {
        const isGold = item.item_type === 'Gold' || normalizeMetal(item.metal_type) === 'Gold';
        finalHtml += premiumComponents.renderTableRow(item, index, isGold);
      });
    }

    finalHtml += premiumComponents.renderTableEnd();
    
    // Settlement
    const settlementHtml = premiumComponents.renderSettlements(metalsArray, goldBilled, silverBilled);
    if (settlementHtml) finalHtml += settlementHtml;

    // Bottom Summary
    finalHtml += premiumComponents.renderBottomRow(metalsArray, invoice, totals, settings);

    // Footer
    finalHtml += premiumComponents.getPageWrapperEnd(company, 1, 1);
    
    finalHtml += `</div></body></html>`;

    // Cleanup measurement div (we don't even use it anymore because we force 1 page!)
    document.body.removeChild(measureIframe);

    return finalHtml;
  } catch (error) {
    console.error('Error generating HTML:', error);
    throw error;
  }
};

export const generateInvoicePDF = async (data: InvoicePDFData) => {
  try {
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    const finalRenderedHtml = await generateInvoiceHtml(data);
    
    // Actual PDF Generation
    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'fixed';
    renderContainer.style.top = '0';
    renderContainer.style.left = '0';
    renderContainer.style.width = '210mm'; // Fixed A4 width for exact measurement
    renderContainer.style.height = '297mm'; // Fixed A4 height
    renderContainer.style.overflow = 'hidden';
    renderContainer.style.zIndex = '-9999';
    renderContainer.style.opacity = '0';
    renderContainer.innerHTML = finalRenderedHtml;
    document.body.appendChild(renderContainer);

    // Scripts injected via innerHTML don't run, so we apply the 1-page auto-scale logic directly here.
    const wrapper = renderContainer.querySelector('.invoice-wrapper') as HTMLElement;
    const content = renderContainer.querySelector('.content') as HTMLElement;
    
    if (wrapper && content) {
      // Calculate how much content overflows the A4 page height (approx 1122px)
      const maxH = wrapper.clientHeight || 1122; 
      const contentH = content.scrollHeight;
      
      if (contentH > maxH) {
         // Scale down to fit one page precisely
         const scale = maxH / contentH;
         content.style.transform = `scale(${scale})`;
         content.style.transformOrigin = 'top center';
         // Adjust height so the wrapper knows the scaled content fits
         content.style.height = `${contentH}px`;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800)); // wait for fonts

    const opt: any = {
      margin:       0,
      filename:     `${data.invoice?.invoice_number || 'INVOICE'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 794 }, // 794px ~ 210mm
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' } // Force into a single page
    };

    const targetElement = renderContainer.querySelector('.pdf-container');
    await html2pdf().set(opt).from(targetElement as HTMLElement).save();

    document.body.removeChild(renderContainer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generatePaymentReceiptPDF = async (row: any, entity: any) => {
  console.log("generatePaymentReceiptPDF called with", row, entity);
};
