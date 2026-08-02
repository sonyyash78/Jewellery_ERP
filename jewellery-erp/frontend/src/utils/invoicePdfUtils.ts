export interface InvoicePDFData {
  type?: string;
  invoice: {
    invoice_number: string;
    invoice_date: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    grand_total: number;
    amount_paid?: number;
    balance_due?: number;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  items: Array<{
    item_name: string;
    item_type: string;
    metal_type?: string;
    gross_weight?: number;
    stone_weight?: number;
    net_weight?: number;
    pure_weight?: number;
    making_charge_type?: string;
    making_charge_rate?: number;
    making_charges?: number;
    hallmark_charges?: number;
    metal_value?: number;
    final_price: number;
    applied_rate?: number;
    other_charges?: number;
    tanch_percentage?: number;
  }>;
  old_items?: Array<{
    item_name: string;
    metal_type?: string;
    gross_weight?: number;
    stone_weight?: number;
    net_weight?: number;
    tanch_percentage?: number;
    final_price: number;
    applied_rate?: number;
  }>;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
  };
  totals: {
    total_items: number;
    total_weight: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    grand_total: number;
  };
}

import QRCode from 'qrcode';

export const generateInvoicePDF = async (data: InvoicePDFData) => {
  try {
    // Dynamically import html2pdf and template
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    const { generatePremiumHTML } = await import('./premiumInvoiceHtml');

    let qrDataUrl = '';
    try {
      const qrData = `${data.invoice?.invoice_number}|${data.totals?.grand_total}`;
      qrDataUrl = await QRCode.toDataURL(qrData, { width: 60, margin: 0 });
    } catch (e) {
      console.warn('Failed to generate QR code data URL', e);
    }

    const htmlStr = generatePremiumHTML(data, qrDataUrl);
    
    // Create an invisible container to ensure fonts load and CSS is applied
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.overflow = 'hidden';
    container.style.zIndex = '-9999';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    
    // The invoice wrapper has explicit width/height (210mm x 290mm), 
    // so it won't be affected by the 100vw/100vh of the parent
    container.innerHTML = htmlStr;
    document.body.appendChild(container);
    
    // Wait for fonts and layouts to resolve
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const invoiceNo = data.invoice?.invoice_number || 'INVOICE';
    
    const opt: any = {
      margin:       0,
      filename:     `${invoiceNo}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Use the inner wrapper for exact dimensions
    const targetElement = container.querySelector('.invoice-wrapper') || container;
    await html2pdf().set(opt).from(targetElement as HTMLElement).save();
    
    // Cleanup
    document.body.removeChild(container);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generatePaymentReceiptPDF = async (row: any, entity: any) => {
  // Placeholder implementation so that old references do not break
  console.log("generatePaymentReceiptPDF called with", row, entity);
};
