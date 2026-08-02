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
          (index + 1).toString(),
          itemDesc,
          item.metal_type || '-',
          `${item.net_weight?.toFixed(3) || '0.000'}`,
          `${item.tanch_percentage?.toFixed(2) || '0.00'}`,
          `Rs. ${item.applied_rate?.toFixed(1) || '0.0'}`,
          `Rs. ${item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        ];
      });

      autoTable(doc, {
        head: [['#', 'Item Description', 'Metal', 'Net Weight (g)', 'Tanch (%)', 'Rate', 'Amount (Rs.)']],
        body: oldTableData,
        startY: yPos,
        styles: { fontSize: 9, cellPadding: 4, textColor: [0, 0, 0], lineColor: [221, 221, 221], lineWidth: 0.1 },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 45 }, 6: { halign: 'left' } },
        alternateRowStyles: { fillColor: [255, 255, 255] }
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
        (index + 1).toString(),
        itemDesc,
        item.metal_type || '-',
        `${netWt.toFixed(3)}`,
        `Rs. ${rate.toFixed(1)}`,
        makingStr,
        `Rs. ${hallmark.toFixed(1)}`,
        `Rs. ${other.toFixed(1)}`,
        `Rs. ${item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      ];
    });

    const newItemsHead = [['#', 'Item Description', 'Metal', 'Net Weight (g)', 'Rate', 'Making (Rs.)', 'Hallmark', 'Other Chg', 'Amount (Rs.)']];
    const newItemsColStyles = {
        0: { halign: 'left', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 40 },
        2: { halign: 'left' },
        3: { halign: 'left' },
        4: { halign: 'left' },
        5: { halign: 'left' },
        6: { halign: 'left' },
        7: { halign: 'left' },
        8: { halign: 'left' }
    };

    autoTable(doc, {
      head: newItemsHead,
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [0, 0, 0],
        lineColor: [221, 221, 221], 
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [245, 245, 245], // light gray like HTML #f5f5f5
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: newItemsColStyles as any,
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Breakdown block on the right
    const summaryX = pageWidth / 2 + 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const textRight = (text: string, value: string, y: number) => {
      doc.text(text, summaryX, y);
      doc.text(value, pageWidth - leftMargin, y, { align: 'right' });
    };

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
    yPos += 8;

    if (data.invoice.amount_paid !== undefined) {
      doc.setFontSize(11);
      doc.setTextColor(46, 125, 50); // Green
      doc.text('Amount Paid:', summaryX, yPos);
      doc.text(`Rs. ${data.invoice.amount_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - leftMargin, yPos, { align: 'right' });
      yPos += 6;
      
      doc.setTextColor(211, 47, 47); // Red
      doc.text('Balance Due:', summaryX, yPos);
      doc.text(`Rs. ${data.invoice.balance_due!.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - leftMargin, yPos, { align: 'right' });
      yPos += 8;
    }
    
    const finalYPos = Math.max(yPos + 12, (doc as any).lastAutoTable.finalY + 40);
    yPos = finalYPos;

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

export const generatePaymentReceiptPDF = (row: any, profile: any, isCustomer: boolean) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    const leftMargin = 14;

    // Header: SAIDEEP JEWELLERS
    doc.setFontSize(24);
    doc.setTextColor(212, 175, 55); // Gold color
    doc.setFont('helvetica', 'bold');
    doc.text('SAIDEEP JEWELLERS', leftMargin, yPos);
    yPos += 8;

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 8;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PAYMENT RECEIPT', leftMargin, yPos);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const formattedDate = new Date(row.date).toLocaleDateString('en-GB');
    doc.text(`Date: ${formattedDate}`, pageWidth - leftMargin, yPos, { align: 'right' });
    yPos += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(isCustomer ? 'Received From:' : 'Paid To:', leftMargin, yPos);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    yPos += 6;
    const name = isCustomer ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : profile.name;
    doc.text(name || 'Unknown', leftMargin, yPos);
    
    if (profile.phone_number || profile.mobile) {
      yPos += 5;
      doc.text(profile.phone_number || profile.mobile, leftMargin, yPos);
    }
    yPos += 15;

    // Amount Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    const amount = Number(row.credit) > 0 ? Number(row.credit) : Number(row.debit);
    const amountStr = `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    
    doc.text(`Payment Amount:`, leftMargin, yPos);
    doc.text(amountStr, leftMargin + 40, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Details:`, leftMargin, yPos);
    
    // Check if summary is long and wrap it
    const summaryStr = row.summary || 'Manual Payment / Settlement';
    const splitSummary = doc.splitTextToSize(summaryStr, pageWidth - leftMargin - 40 - 14);
    doc.text(splitSummary, leftMargin + 40, yPos);
    
    yPos += 10 + (splitSummary.length * 5);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Balance Remaining:`, leftMargin, yPos);
    
    const balanceStr = `Rs. ${Math.abs(Number(row.balance)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    doc.text(balanceStr, leftMargin + 40, yPos);
    
    yPos += 20;

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer generated receipt.', leftMargin, yPos);

    doc.save(`Payment_Receipt_${formattedDate.replace(/\//g, '')}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
  }
};
