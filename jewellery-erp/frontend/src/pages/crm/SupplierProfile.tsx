import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Plus } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function SupplierProfile({ id, onBack }: { id: number, onBack: () => void }) {
  const [supplier, setSupplier] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Entry Form State
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [form, setForm] = useState({ description: '', debit: '', credit: '', voucher_type: 'Manual', voucher_number: '' });

  const fetchData = async () => {
    try {
      const [suppRes, ledgerRes] = await Promise.all([
        axiosClient.get(`/sellers/${id}`),
        axiosClient.get(`/sellers/${id}/ledger`)
      ]);
      setSupplier(suppRes.data);
      setLedger(ledgerRes.data);
    } catch (e) {
      toast.error('Failed to fetch supplier profile');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(ledger.map(row => ({
      Date: new Date(row.date).toLocaleString(),
      Type: row.voucher_type,
      VoucherNo: row.voucher_number || '-',
      Description: row.description || '-',
      Debit: row.debit,
      Credit: row.credit,
      Balance: row.balance
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `Supplier_${supplier.name}_Ledger.xlsx`);
  };

  const handleAddEntry = async () => {
    try {
      await axiosClient.post(`/sellers/${id}/ledger`, form);
      toast.success("Ledger entry added");
      setShowEntryForm(false);
      setForm({ description: '', debit: '', credit: '', voucher_type: 'Manual', voucher_number: '' });
      fetchData();
    } catch (e) {
      toast.error('Failed to add entry');
    }
  };

  if (loading || !supplier) return <div className="p-8 text-primary font-bold">Loading...</div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      
      {/* Header Panel */}
      <div className="bg-surface border border-gray-800 rounded-xl p-6 shadow-lg flex items-start justify-between">
        <div className="flex gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors h-fit mt-1"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-2xl font-bold text-textMain uppercase tracking-widest">{supplier.name}</h1>
            <div className="text-sm text-textMuted mt-1 grid grid-cols-2 gap-x-8 gap-y-1">
              <span>📱 {supplier.mobile}</span>
              <span>🆔 PAN/Aadhar: {supplier.aadhaar_pan || 'N/A'}</span>
              <span className="col-span-2">🏢 Address: {supplier.address || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Pending Amount</div>
            <div className={`text-3xl font-bold font-mono ${supplier.outstanding_balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              ₹ {Math.abs(supplier.outstanding_balance).toLocaleString()} {supplier.outstanding_balance > 0 ? '(Cr)' : '(Dr)'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Status</div>
            <div className="text-sm font-bold font-mono text-primary">{supplier.is_active ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 bg-surface border border-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary uppercase tracking-widest">Supplier Ledger</h2>
          <div className="flex gap-3">
            <button onClick={() => setShowEntryForm(true)} className="bg-primary/10 text-primary border border-primary/30 px-4 py-2 rounded font-bold text-sm hover:bg-primary/20 transition-colors flex items-center gap-2">
              <Plus size={16} /> Manual Entry
            </button>
            <button onClick={handleExportExcel} className="bg-background text-white border border-gray-700 px-4 py-2 rounded font-bold text-sm hover:border-gray-500 transition-colors flex items-center gap-2">
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>

        {showEntryForm && (
          <div className="p-4 bg-black/40 border-b border-gray-800 grid grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Voucher Type</label>
              <select value={form.voucher_type} onChange={e=>setForm({...form, voucher_type: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none">
                <option value="Manual">Manual Entry</option>
                <option value="Payment">Payment Made</option>
                <option value="Opening Balance">Opening Balance</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
              <input value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none" placeholder="e.g. Paid via NEFT" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Debit (We Pay) ₹</label>
              <input type="number" value={form.debit} onChange={e=>setForm({...form, debit: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Credit (Purchase) ₹</label>
              <div className="flex gap-2">
                <input type="number" value={form.credit} onChange={e=>setForm({...form, credit: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none font-mono" />
                <button onClick={handleAddEntry} className="bg-primary hover:bg-primary-dark text-black px-4 py-2 rounded font-bold text-sm transition-colors">Save</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-textMuted">
            <thead className="bg-background sticky top-0 border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Date</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Type / Ref</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Description</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right text-red-400">Debit (₹)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right text-green-400">Credit (₹)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {ledger.map((row) => (
                <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">{new Date(row.date).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-300">{row.voucher_type}</div>
                    <div className="text-xs">{row.voucher_number}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate" title={row.description}>{row.description || '-'}</td>
                  <td className="py-3 px-4 text-right font-mono text-red-400">{Number(row.debit) > 0 ? Number(row.debit).toLocaleString() : '-'}</td>
                  <td className="py-3 px-4 text-right font-mono text-green-400">{Number(row.credit) > 0 ? Number(row.credit).toLocaleString() : '-'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-primary">{Number(row.balance).toLocaleString()} {row.balance > 0 ? 'Cr' : 'Dr'}</td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 italic">No ledger entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
