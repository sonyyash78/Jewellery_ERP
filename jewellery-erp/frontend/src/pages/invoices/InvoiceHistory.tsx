import { useState, useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient';
import { generateInvoicePDF } from '../../utils/invoicePdfUtils';
import {
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  Trash2,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer: {
    name: string;
    phone: string;
  };
  grand_total: number;
  status: string;
}

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, statusFilter, currentPage]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axiosClient.get(`/invoices/?${params.toString()}`);
      setInvoices(res.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoice history');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (invoice: Invoice) => {
    try {
      const res = await axiosClient.get(`/invoices/${invoice.id}`);
      setSelectedInvoice(res.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load invoice details');
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    const toastId = 'pdf-gen';
    try {
      toast.loading('Generating PDF...', { id: toastId });
      
      // Fetch invoice data
      const res = await axiosClient.get(`/invoices/${invoice.id}/pdf-data`);
      
      if (!res.data) {
        throw new Error('No data received from server');
      }
      
      // Generate PDF
      await generateInvoicePDF(res.data);
      
      toast.success('PDF downloaded successfully', { id: toastId });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error occurred';
      toast.error(`Failed to generate PDF: ${errorMessage}`, { id: toastId, duration: 5000 });
    }
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      const res = await axiosClient.get(`/invoices/${invoice.id}/pdf-data`);
      // Create a temporary window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintHTML(res.data));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      toast.error('Failed to print invoice');
    }
  };

  const handleWhatsApp = async (invoice: Invoice) => {
    try {
      const res = await axiosClient.get(`/invoices/${invoice.id}/pdf-data`);
      const phone = res.data.customer.phone?.replace(/[^0-9]/g, '');
      if (!phone) {
        toast.error('Customer phone number not available');
        return;
      }
      
      const message = encodeURIComponent(
        `Hello ${res.data.customer.name},\n\nYour invoice ${res.data.invoice.invoice_number} for ₹${res.data.totals.grand_total.toLocaleString('en-IN')} has been generated.\n\nThank you for your business!\n\n- ${res.data.company.name}`
      );
      
      window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
    } catch (error) {
      toast.error('Failed to open WhatsApp');
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to cancel invoice ${invoice.invoice_number}?`)) {
      return;
    }

    try {
      await axiosClient.delete(`/invoices/${invoice.id}`);
      toast.success('Invoice cancelled successfully');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to cancel invoice');
    }
  };

  const generatePrintHTML = (data: any) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${data.invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #d4af37; }
            .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .invoice-table th { background: #f5f5f5; font-weight: bold; }
            .totals { margin-left: auto; width: 300px; margin-top: 20px; }
            .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${data.company.name}</div>
            <div>${data.company.address}</div>
            <div>Phone: ${data.company.phone} | GSTIN: ${data.company.gstin}</div>
          </div>
          
          <h2 style="text-align: center; margin-bottom: 20px;">TAX INVOICE</h2>
          
          <div class="invoice-info">
            <div>
              <strong>Bill To:</strong><br>
              ${data.customer.name}<br>
              ${data.customer.phone || ''}<br>
              ${data.customer.address || ''}
            </div>
            <div>
              <strong>Invoice No:</strong> ${data.invoice.invoice_number}<br>
              <strong>Date:</strong> ${data.invoice.invoice_date}<br>
              <strong>Status:</strong> ${data.invoice.status}
            </div>
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th>Metal</th>
                <th>Net Weight (g)</th>
                <th>Making (₹)</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item: any, i: number) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.item_name}</td>
                  <td>${item.metal_type || '-'}</td>
                  <td>${item.net_weight?.toFixed(3) || item.pure_weight?.toFixed(3) || '-'}</td>
                  <td>${item.making_charges?.toFixed(2) || '-'}</td>
                  <td>₹ ${item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₹ ${data.totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="totals-row">
              <span>Tax (GST 3%):</span>
              <span>₹ ${data.totals.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            ${data.totals.discount_amount > 0 ? `
              <div class="totals-row">
                <span>Discount:</span>
                <span>- ₹ ${data.totals.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div class="totals-row grand-total">
              <span>Grand Total:</span>
              <span>₹ ${data.totals.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div style="margin-top: 40px; font-size: 12px; color: #666;">
            <p>Total Items: ${data.totals.total_items} | Total Weight: ${data.totals.total_weight.toFixed(3)} g</p>
            <p style="margin-top: 20px;"><strong>Terms & Conditions:</strong></p>
            <p>1. Goods once sold cannot be returned or exchanged.</p>
            <p>2. All disputes subject to local jurisdiction only.</p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">
            Thank you for your business!
          </div>
        </body>
      </html>
    `;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Paid': 'bg-green-500/20 text-green-400',
      'Draft': 'bg-yellow-500/20 text-yellow-400',
      'Cancelled': 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Invoice History</h1>
          <p className="text-sm text-textMuted mt-1">View and manage all generated invoices</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface p-4 rounded-xl border border-gray-800 flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-background border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-textMain focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-background border border-gray-700 rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-gray-800">
              <tr>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice #</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="text-center p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-center p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-textMuted">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-textMuted">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-800 hover:bg-background/50 transition-colors">
                    <td className="p-4 text-sm font-mono text-primary">{invoice.invoice_number}</td>
                    <td className="p-4 text-sm text-textMain">
                      {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 text-sm text-textMain">{invoice.customer?.name || 'Walk-in'}</td>
                    <td className="p-4 text-sm text-textMuted">{invoice.customer?.phone || '-'}</td>
                    <td className="p-4 text-sm font-semibold text-right text-textMain">
                      ₹ {invoice.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleView(invoice)}
                          className="p-2 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="p-2 hover:bg-green-500/20 rounded text-green-400 transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handlePrint(invoice)}
                          className="p-2 hover:bg-purple-500/20 rounded text-purple-400 transition-colors"
                          title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(invoice)}
                          className="p-2 hover:bg-green-500/20 rounded text-green-400 transition-colors"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                        {invoice.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleDelete(invoice)}
                            className="p-2 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                            title="Cancel Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {invoices.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-800">
            <div className="text-sm text-textMuted">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, ((currentPage - 1) * itemsPerPage) + invoices.length)} invoices
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-background border border-gray-700 rounded-lg text-sm text-textMain hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={invoices.length < itemsPerPage}
                className="px-4 py-2 bg-background border border-gray-700 rounded-lg text-sm text-textMain hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-gray-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-surface">
              <div>
                <h2 className="text-xl font-bold text-primary">Invoice Details</h2>
                <p className="text-sm text-textMuted">{selectedInvoice.invoice_number}</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm text-textMain">{selectedInvoice.customer?.name || 'Walk-in'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-textMain">{selectedInvoice.customer?.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedInvoice.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-surface rounded border border-gray-800">
                      <div>
                        <p className="text-sm font-semibold text-textMain">{item.item_name}</p>
                        <p className="text-xs text-textMuted">{item.item_type}</p>
                      </div>
                      <p className="text-sm font-bold text-primary">
                        ₹ {item.final_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-background rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-textMuted">Subtotal</span>
                    <span className="text-textMain">₹ {selectedInvoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-textMuted">Tax (GST)</span>
                    <span className="text-textMain">₹ {selectedInvoice.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-textMuted">Discount</span>
                      <span className="text-textMain">- ₹ {selectedInvoice.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-800">
                    <span className="text-textMain">Grand Total</span>
                    <span className="text-primary">₹ {selectedInvoice.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
