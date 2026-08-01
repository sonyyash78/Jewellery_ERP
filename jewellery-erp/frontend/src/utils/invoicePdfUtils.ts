import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

interface InvoicePDFData {
  type?: string;
  invoice: {
    invoice_number: string;
    invoice_date: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    grand_total: number;
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

export const generateInvoicePDF = async (data: InvoicePDFData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    const leftMargin = 14;

    // Header: SAIDEEP JEWELLERS
    doc.setFontSize(24);
    doc.setTextColor(212, 175, 55); // Gold color
    doc.setFont('helvetica', 'bold');
    doc.text(data.company.name || 'SAIDEEP JEWELLERS', leftMargin, yPos);
    yPos += 8;

    // Company Address and Mobile
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFont('helvetica', 'normal');
    if (data.company.address) {
      doc.text(`Address: ${data.company.address}`, leftMargin, yPos);
      yPos += 5;
    }
    if (data.company.phone) {
      doc.text(`Mobile: ${data.company.phone}`, leftMargin, yPos);
      yPos += 10;
    } else {
      yPos += 5;
    }

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 8;

    // Sub-header: ESTIMATE INVOICE and Date
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const isExchange = data.type === 'exchange';
    const isPurchase = data.type === 'purchase';
    const title = isExchange ? 'EXCHANGE INVOICE' : isPurchase ? 'PURCHASE RECEIPT' : 'ESTIMATE INVOICE';
    doc.text(title, leftMargin, yPos);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    // For date format like 24/07/2026
    const formattedDate = new Date(data.invoice.invoice_date).toLocaleDateString('en-GB');
    doc.text(`Date: ${formattedDate}`, pageWidth - leftMargin, yPos, { align: 'right' });
    yPos += 12;

    // Bill To Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(isPurchase ? 'Received From:' : 'Bill To:', leftMargin, yPos);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (data.customer.name && data.customer.name.trim() !== 'Walk-in Customer' && data.customer.name.trim() !== 'Walk-in') {
      yPos += 6;
      doc.text(data.customer.name, leftMargin, yPos);
      if (data.customer.phone) {
        yPos += 5;
        doc.text(data.customer.phone, leftMargin, yPos);
      }
    } else {
      yPos += 6;
      doc.text('Walk-in Customer', leftMargin, yPos);
    }
    yPos += 10;

    if (isExchange && data.old_items && data.old_items.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Old Items Traded In', leftMargin, yPos);
      yPos += 5;
      
      const oldTableData = data.old_items.map((item, index) => {
        let itemDesc = `${index + 1}. ${item.item_name}`;
        itemDesc += `\nGross: ${item.gross_weight?.toFixed(3) || '0.000'}g`;
        return [
          itemDesc,
          item.metal_type || '-',
          `${item.net_weight?.toFixed(3) || '0.000'}g`,
          `${item.tanch_percentage?.toFixed(2) || '0.00'}%`,
          `Rs. ${item.applied_rate?.toFixed(1) || '0.0'}`,
          `Rs. ${item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        ];
      });

      autoTable(doc, {
        head: [['Item Description', 'Metal', 'Net Wt', 'Tanch', 'Rate', 'Total']],
        body: oldTableData,
        startY: yPos,
        styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40] },
        headStyles: { fillColor: [20, 20, 24], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 55 }, 5: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        bodyStyles: { lineColor: [220, 220, 220], lineWidth: { bottom: 0.2 } }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Old Value: Rs. ${(data.invoice as any).total_old_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`, pageWidth - leftMargin, yPos, { align: 'right' });
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('New Items Purchased', leftMargin, yPos);
      yPos += 5;
    } else if (isExchange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('New Items Purchased', leftMargin, yPos);
      yPos += 5;
    }

    // Table Data
    const tableData = data.items.map((item, index) => {
      let itemDesc = `${index + 1}. ${item.item_name}`;
      if (item.metal_type === 'GOLD') {
        itemDesc += `\nGross: ${item.gross_weight?.toFixed(3) || '0.000'}g | Stone: ${item.stone_weight?.toFixed(3) || '0.000'}g`;
      } else if (item.metal_type === 'SILVER') {
        itemDesc += `\nGross: ${item.gross_weight?.toFixed(3) || '0.000'}g`;
      }

      const netWt = item.net_weight || item.pure_weight || 0;
      const rate = item.applied_rate || 0;
      const making = item.making_charges || 0;
      
      let makingStr = `Rs. ${making.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      if (item.making_charge_type === 'percent' && item.making_charge_rate) {
        makingStr = `${item.making_charge_rate}%\n(Rs. ${making.toLocaleString('en-IN', { minimumFractionDigits: 0 })})`;
      } else if (item.making_charge_type === 'per_gm' && item.making_charge_rate) {
        makingStr = `Rs. ${item.making_charge_rate}/g\n(Rs. ${making.toLocaleString('en-IN', { minimumFractionDigits: 0 })})`;
      } else {
        makingStr = `Rs. ${making.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      }

      const hallmark = item.hallmark_charges || 0;
      const other = item.other_charges || 0;
      
      return [
        itemDesc,
        `${netWt.toFixed(3)}g`,
        `Rs. ${rate.toFixed(1)}`,
        makingStr,
        `Rs. ${hallmark.toFixed(1)}`,
        `Rs. ${other.toFixed(1)}`,
        `Rs. ${item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      ];
    });

    const newItemsHead = [['Item / Purity', 'Net Wt', 'Rate', 'Making', 'Hallmark', 'Other Chg', 'Total']];
    const newItemsColStyles = {
        0: { halign: 'left', cellWidth: 55 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' }
    };

    autoTable(doc, {
      head: newItemsHead,
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [40, 40, 40],
      },
      headStyles: {
        fillColor: [20, 20, 24], // Dark background for header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: newItemsColStyles as any,
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      bodyStyles: {
        lineColor: [220, 220, 220],
        lineWidth: { bottom: 0.2 }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Breakdown block on the right
    const summaryX = pageWidth / 2 + 10;
    
    let hasGold = false;
    let hasSilver = false;
    
    let goldGross = 0;
    let goldStone = 0;
    let goldNet = 0;
    let goldBasePrice = 0;
    let goldMaking = 0;
    
    let silverGross = 0;
    let silverNet = 0;
    let silverBasePrice = 0;
    let silverMaking = 0;
    
    let totalHallmark = 0;
    let totalOther = 0;

    data.items.forEach(item => {
      if (item.metal_type === 'GOLD') {
        hasGold = true;
        goldGross += (item.gross_weight || 0);
        goldStone += (item.stone_weight || 0);
        goldNet += (item.net_weight || 0);
        goldBasePrice += (item.metal_value || 0);
        goldMaking += (item.making_charges || 0);
      } else if (item.metal_type === 'SILVER') {
        hasSilver = true;
        silverGross += (item.gross_weight || 0);
        silverNet += (item.net_weight || item.pure_weight || 0);
        silverBasePrice += (item.metal_value || 0);
        silverMaking += (item.making_charges || 0);
      }
      totalHallmark += (item.hallmark_charges || 0);
      totalOther += (item.other_charges || 0);
    });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    
    const textRight = (text: string, value: string, y: number) => {
      doc.text(text, summaryX, y);
      doc.text(value, pageWidth - leftMargin, y, { align: 'right' });
    };

    if (hasGold) {
      textRight('Gold Gross | Stone | Net:', `${goldGross.toFixed(3)}g | ${goldStone.toFixed(3)}g | ${goldNet.toFixed(3)}g`, yPos);
      yPos += 6;
      textRight('Gold Base Price:', `Rs. ${goldBasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
      yPos += 6;
      textRight('Gold Making Charge:', `Rs. ${goldMaking.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
      yPos += 6;
    }
    
    if (hasSilver) {
      textRight('Silver Gross | Net:', `${silverGross.toFixed(3)}g | ${silverNet.toFixed(3)}g`, yPos);
      yPos += 6;
      textRight('Silver Base Price:', `Rs. ${silverBasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
      yPos += 6;
      textRight('Silver Making Charge:', `Rs. ${silverMaking.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
      yPos += 6;
    }
    
    textRight('Total Hallmarking:', `Rs. ${totalHallmark.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
    yPos += 6;
    textRight('Total Other Charges:', `Rs. ${totalOther.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
    yPos += 10;

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(summaryX, yPos - 4, pageWidth - leftMargin, yPos - 4);

    textRight('Taxable Amount:', `Rs. ${data.totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
    yPos += 6;
    textRight('GST Amount (3.0%):', `Rs. ${data.totals.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
    yPos += 8;

    if (data.totals.discount_amount > 0) {
      textRight(isExchange ? 'Less Trade-in Value:' : 'Discount:', `- Rs. ${data.totals.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, yPos);
      yPos += 8;
    }

    // Separator line
    doc.line(summaryX, yPos - 4, pageWidth - leftMargin, yPos - 4);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55); // Gold
    doc.text('GRAND TOTAL:', summaryX, yPos);
    doc.text(`Rs. ${data.totals.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - leftMargin, yPos, { align: 'right' });
    
    const finalYPos = Math.max(yPos + 20, (doc as any).lastAutoTable.finalY + 40);
    yPos = finalYPos;

    // QR Code
    try {
      const upiId = 'saideep@upi'; // Placeholder UPI ID
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent('SAIDEEP JEWELLERS')}&am=${data.totals.grand_total.toFixed(2)}&cu=INR`;
      
      const qrDataUrl = await QRCode.toDataURL(upiLink, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      doc.addImage(qrDataUrl, 'PNG', leftMargin, yPos - 15, 30, 30);
    } catch (qrErr) {
      console.warn("Failed to generate QR code", qrErr);
    }

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for visiting!', leftMargin + 40, yPos + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Computer Generated Invoice', pageWidth - leftMargin, yPos + 5, { align: 'right' });

    // Save
    const filename = `Invoice_${data.invoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
