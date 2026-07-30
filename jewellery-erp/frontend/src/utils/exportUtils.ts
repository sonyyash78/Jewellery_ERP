import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Company details
const COMPANY_NAME = 'JEWELLERY ERP';

export const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data: any[], filename: string, title: string) => {
  if (data.length === 0) return;
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text('JEWELLERY ERP', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(title, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

  const columns = Object.keys(data[0]).map(key => ({ header: key.toUpperCase(), dataKey: key }));
  
  (doc as any).autoTable({
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => row[c.dataKey])),
    startY: 45,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${filename}.pdf`);
};

/**
 * Export report summary data to PDF
 * Works with the actual backend response structure (no chart required)
 */
export const exportReportToPDF = (
  reportData: any,
  reportTitle: string,
  dateRange?: { start?: string; end?: string }
) => {
  try {
    if (!reportData) {
      throw new Error('No data provided for PDF generation');
    }

    const doc = new jsPDF();
    let yPosition = 20;

    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55);
    doc.text(COMPANY_NAME, 14, yPosition);
    yPosition += 10;

    // Report Title
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(reportTitle, 14, yPosition);
    yPosition += 8;

    // Date Range
    if (dateRange) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const rangeText = dateRange.start && dateRange.end 
        ? `Period: ${dateRange.start} to ${dateRange.end}`
        : 'Period: All Time';
      doc.text(rangeText, 14, yPosition);
      yPosition += 6;
    }

    // Generation Timestamp
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
    yPosition += 12;

    // Summary Section
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary', 14, yPosition);
    yPosition += 8;

    // Prepare summary data as table
    const summaryData: any[] = [];
    
    Object.entries(reportData).forEach(([key, value]) => {
      // Skip chart data if it exists
      if (key === 'chart' || key === 'data') return;
      
      // Format the key
      const formattedKey = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Format the value
      let formattedValue = String(value);
      if (typeof value === 'number') {
        // Check if it's a currency field
        if (
          key.includes('sales') || 
          key.includes('purchase') || 
          key.includes('profit') || 
          key.includes('gst') || 
          key.includes('expense') || 
          key.includes('taxable') ||
          key.includes('payable') ||
          key.includes('receivable') ||
          key.includes('cogs')
        ) {
          formattedValue = `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (key.includes('weight')) {
          formattedValue = `${value.toFixed(3)} g`;
        } else if (key.includes('margin') || key.includes('percent')) {
          formattedValue = `${value.toFixed(2)}%`;
        } else {
          formattedValue = value.toLocaleString('en-IN');
        }
      }
      
      summaryData.push([formattedKey, formattedValue]);
    });

    if (summaryData.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('No data available for the selected period', 14, yPosition);
    } else {
      (doc as any).autoTable({
        head: [['Metric', 'Value']],
        body: summaryData,
        startY: yPosition,
        styles: { 
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: { 
          fillColor: [20, 20, 20], 
          textColor: [212, 175, 55],
          fontStyle: 'bold'
        },
        alternateRowStyles: { 
          fillColor: [250, 250, 250] 
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 100, halign: 'right' }
        }
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportTitle.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Report PDF Generation Error:', error);
    throw new Error(`Failed to generate report PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

