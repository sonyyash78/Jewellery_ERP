import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, RefreshCcw } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { generateInvoicePDF, generatePaymentReceiptPDF } from '../../utils/invoicePdfUtils';

export default function CustomerProfile({ id, onBack }: { id: number, onBack: () => void }) {
  const [customer, setCustomer] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [custRes, billsRes] = await Promise.all([
        axiosClient.get(`/customers/${id}`),
        axiosClient.get(`/customers/${id}/bills`)
      ]);
      setCustomer(custRes.data);
      setData(billsRes.data);
    } catch (e) {
      toast.error('Failed to fetch customer profile');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDownloadPDF = async (row: any) => {
    if (row.bill_no && row.bill_no !== '-') {
      try {
        const res = await axiosClient.get(`/invoices/pdf-by-voucher/${row.bill_no}`);
        await generateInvoicePDF(res.data);
      } catch (e: any) {
        toast.error('Failed to download PDF');
      }
    } else {
      generatePaymentReceiptPDF(row, customer, true);
    }
  };

  const handleExportExcel = () => {
    if (!data?.bills) return;
    const ws = XLSX.utils.json_to_sheet(data.bills.map((row: any) => ({
      Date: new Date(row.date).toLocaleString(),
      Type: row.type,
      RefNo: row.bill_no,
      Summary: row.summary,
      GoldChange: row.gold_change,
      SilverChange: row.silver_change,
      Debit: row.debit,
      Credit: row.credit,
      Balance: row.balance
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `Customer_${customer.first_name}_Ledger.xlsx`);
  };

  if (loading || !customer || !data) return <div className="p-8 text-primary font-bold">Loading...</div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      
      {/* Header Panel */}
      <div className="bg-surface border border-gray-800 rounded-xl p-6 shadow-lg flex items-start justify-between">
        <div className="flex gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors h-fit mt-1"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-2xl font-bold text-textMain uppercase tracking-widest">{customer.first_name} {customer.last_name || ''}</h1>
            <div className="text-sm text-textMuted mt-1 grid grid-cols-2 gap-x-8 gap-y-1">
              <span>📱 {customer.phone_number}</span>
              <span>🏢 GST: {customer.gst_number || 'N/A'}</span>
              <span>💳 PAN: {customer.pan_card || 'N/A'}</span>
              <span>🆔 Aadhar: {customer.aadhar_card || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-right flex gap-6 items-end bg-black/30 p-3 rounded-lg border border-gray-800/50">
            <div>
              <div className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-wider mb-1">Fine Gold</div>
              <div className="text-xl font-bold font-mono text-yellow-400">{Number(data.fine_gold_balance || 0).toFixed(3)} g</div>
              <div className="text-[10px] text-gray-500 mt-1">@ ₹{data.current_gold_rate}/g</div>
            </div>
            <div className="w-px h-10 bg-gray-800"></div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fine Silver</div>
              <div className="text-xl font-bold font-mono text-gray-300">{Number(data.fine_silver_balance || 0).toFixed(3)} g</div>
              <div className="text-[10px] text-gray-500 mt-1">@ ₹{data.current_silver_rate}/g</div>
            </div>
            <div className="w-px h-10 bg-gray-800"></div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Outstanding ₹</div>
              <div className={`text-3xl font-bold font-mono ${data.outstanding_balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                ₹ {Math.abs(data.outstanding_balance).toLocaleString()} {data.outstanding_balance > 0 ? '(Dr)' : '(Cr)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="flex-1 bg-surface border border-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <h2 className="text-lg font-bold text-primary uppercase tracking-widest flex items-center gap-2">
            <FileText size={18} /> Customer Ledger
          </h2>
          <div className="flex gap-3">
            <button onClick={handleExportExcel} className="bg-background text-white border border-gray-700 px-4 py-2 rounded font-bold text-sm hover:border-gray-500 transition-colors flex items-center gap-2">
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-textMuted">
            <thead className="bg-background sticky top-0 border-b border-gray-800 z-10">
              <tr>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Date</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Type</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Ref No</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Details / Bill</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right text-yellow-500">Gold (g)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right text-gray-300">Silver (g)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right text-red-400">Debit (₹)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right text-green-400">Credit (₹)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right text-primary">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.bills.map((row: any) => (
                <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-xs">{new Date(row.date).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${row.type === 'Invoice' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-300">{row.bill_no}</td>
                  <td className="py-3 px-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]" title={row.summary}>{row.summary}</span>
                      <button 
                        onClick={() => handleDownloadPDF(row)}
                        className="bg-primary/20 text-primary hover:bg-primary hover:text-black px-2 py-1 rounded transition-colors flex items-center gap-1 ml-auto"
                        title="Download PDF"
                      >
                        <Download size={14} /> <span className="hidden sm:inline">PDF</span>
                      </button>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4 text-right font-mono text-yellow-500 bg-yellow-900/5">
                    {Number(row.gold_change) !== 0 ? (Number(row.gold_change) > 0 ? '+' : '') + Number(row.gold_change).toFixed(3) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-400 bg-gray-800/20">
                    {Number(row.silver_change) !== 0 ? (Number(row.silver_change) > 0 ? '+' : '') + Number(row.silver_change).toFixed(3) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-red-400">
                    {Number(row.debit) > 0 ? Number(row.debit).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-green-400">
                    {Number(row.credit) > 0 ? Number(row.credit).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                    {Number(row.balance).toLocaleString()} {Number(row.balance) > 0 ? '(Dr)' : (Number(row.balance) < 0 ? '(Cr)' : '')}
                  </td>
                </tr>
              ))}
              {data.bills.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 italic">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCcw size={24} className="opacity-20" />
                      <p>No ledger entries found for this customer.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
