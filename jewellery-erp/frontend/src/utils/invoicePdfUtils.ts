import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InvoicePDFData {
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
    making_charges?: number;
    hallmark_charges?: number;
    metal_value?: number;
    final_price: number;
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

export const generateInvoicePDF = (data: InvoicePDFData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Company Header
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(data.company.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(data.company.address, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Phone: ${data.company.phone} | Email: ${data.company.email}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`GSTIN: ${data.company.gstin}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Invoice Info Box
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    
    // Left side - Customer
    const leftCol = 14;
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', leftCol, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(data.customer.name || 'Walk-in Customer', leftCol, yPos);
    yPos += 5;
    if (data.customer.phone) {
      doc.text(`Phone: ${data.customer.phone}`, leftCol, yPos);
      yPos += 5;
    }
    if (data.customer.address) {
      const addressLines = doc.splitTextToSize(data.customer.address, 80);
      doc.text(addressLines, leftCol, yPos);
      yPos += addressLines.length * 5;
    }

    // Right side - Invoice Details
    const rightCol = 120;
    let rightYPos = yPos - (data.customer.address ? 25 : 20);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No:', rightCol, rightYPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.invoice.invoice_number, rightCol + 30, rightYPos);
    rightYPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', rightCol, rightYPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.invoice.invoice_date, rightCol + 30, rightYPos);
    rightYPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', rightCol, rightYPos);
    doc.setFont('helvetica', 'normal');
    if (data.invoice.status === 'Paid') {
      doc.setTextColor(34, 197, 94);
    } else {
      doc.setTextColor(234, 179, 8);
    }
    doc.text(data.invoice.status, rightCol + 30, rightYPos);
    doc.setTextColor(60, 60, 60);

    yPos = Math.max(yPos, rightYPos) + 10;

    // Items Table
    const tableData = data.items.map((item, index) => {
      const row: any[] = [
        index + 1,
        item.item_name,
        item.metal_type || '-',
      ];

      if (item.metal_type === 'GOLD') {
        row.push(
          item.gross_weight?.toFixed(3) || '-',
          item.stone_weight?.toFixed(3) || '-',
          item.net_weight?.toFixed(3) || '-',
          item.making_charges?.toFixed(2) || '-',
          `₹ ${item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        );
      } else if (item.metal_type === 'SILVER') {
        row.push(
          item.gross_weight?.toFixed(3) || '-',
          '-',
          item.pure_weight?.toFixed(3) || '-',
          item.making_charges?.toFixed(2) || '-',
          `₹ ${item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        );
      } else {
        row.push('-', '-', '-', '-', `₹ ${item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      }

      return row;
    });

    (doc as any).autoTable({
      head: [['#', 'Item Description', 'Metal', 'Gross Wt (g)', 'Stone Wt (g)', 'Net Wt (g)', 'Making (₹)', 'Amount (₹)']],
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [20, 20, 20],
        textColor: [212, 175, 55],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 20 },
        7: { halign: 'right', cellWidth: 28 }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Summary Box
    const summaryX = pageWidth - 80;
    const summaryWidth = 66;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    // Subtotal
    doc.text('Subtotal:', summaryX, yPos);
    doc.text(`₹ ${data.totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth, yPos, { align: 'right' });
    yPos += 6;

    // Tax
    doc.text('Tax (GST 3%):', summaryX, yPos);
    doc.text(`₹ ${data.totals.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth, yPos, { align: 'right' });
    yPos += 6;

    // Discount
    if (data.totals.discount_amount > 0) {
      doc.text('Discount:', summaryX, yPos);
      doc.text(`- ₹ ${data.totals.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth, yPos, { align: 'right' });
      yPos += 6;
    }

    // Line
    doc.line(summaryX, yPos, summaryX + summaryWidth, yPos);
    yPos += 6;

    // Grand Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', summaryX, yPos);
    doc.text(`₹ ${data.totals.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth, yPos, { align: 'right' });
    
    yPos += 15;

    // Total Items and Weight
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Items: ${data.totals.total_items} | Total Weight: ${data.totals.total_weight.toFixed(3)} g`, leftCol, yPos);

    // Terms and Conditions
    yPos += 15;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', leftCol, yPos);
    yPos += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const terms = [
      '1. Goods once sold cannot be returned or exchanged.',
      '2. All disputes subject to local jurisdiction only.',
      '3. Please verify the weight and details at the time of purchase.'
    ];
    
    terms.forEach(term => {
      doc.text(term, leftCol, yPos);
      yPos += 5;
    });

    // Footer
    yPos = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });

    // Save
    const filename = `Invoice_${data.invoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
