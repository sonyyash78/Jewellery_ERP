import { useState, useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Check, X, Calculator, UserPlus } from 'lucide-react';
import { getErrorMessage } from '../../utils/errorUtils';

interface PurchaseCheckoutModalProps {
  payload: any;
  grandTotal: number;
  onClose: () => void;
  onSuccess: (purchaseNumber: string) => void;
}

export default function PurchaseCheckoutModal({ payload, grandTotal, onClose, onSuccess }: PurchaseCheckoutModalProps) {
  const [amountPaid, setAmountPaid] = useState<number>(grandTotal);
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState<any[]>([]);
  
  const [selectedSeller, setSelectedSeller] = useState<number | ''>('');
  
  const [mode, setMode] = useState<'checkout' | 'new_seller'>('checkout');
  const [newSeller, setNewSeller] = useState({ name: '', mobile: '' });

  const balanceDue = grandTotal - amountPaid;

  useEffect(() => {
    // Fetch sellers for the dropdown
    axiosClient.get('/sellers/').then(res => setSellers(res.data.items || []));
  }, []);

  const handleGenerate = async () => {
    // Validation
    if (balanceDue > 0 && !selectedSeller) {
      toast.error('A supplier must be selected if there is an unpaid balance.');
      return;
    }
    if (amountPaid < 0) {
      toast.error('Amount paid cannot be negative.');
      return;
    }
    
    setLoading(true);
    
    const finalPayload = {
      ...payload,
      seller_id: selectedSeller || null,
      amount_paid: amountPaid,
      status: balanceDue === 0 ? 'Completed' : (amountPaid === 0 ? 'Draft' : 'Completed') 
    };

    try {
      const res = await axiosClient.post('/purchases/', finalPayload);
      toast.success(`Purchase ${res.data.purchase_number} generated successfully!`);
      onSuccess(res.data.purchase_number);
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to generate"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewSeller = async () => {
    if (!newSeller.name || !newSeller.mobile) {
      toast.error('Name and mobile are required');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post('/sellers/', {
        name: newSeller.name,
        mobile: newSeller.mobile,
        city: '',
        gst_number: '',
        outstanding_balance: 0
      });
      const newSellerId = res.data.id;
      setSellers([...sellers, res.data]);
      setSelectedSeller(newSellerId);
      setMode('checkout');
      toast.success('Supplier added');
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to create supplier"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Calculator size={20}/> Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6">
          {mode === 'checkout' && (
            <div className="space-y-6">
              
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Grand Total</span>
                <span className="text-3xl font-bold font-mono text-white">₹ {grandTotal.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-green-500 uppercase tracking-widest mb-2">Amount Paid (₹)</label>
                  <input 
                    type="number" 
                    value={amountPaid === 0 ? '' : amountPaid} // Allow clearing to type 0
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    className="w-full bg-background border border-gray-700 rounded p-3 text-lg font-mono text-green-400 focus:border-green-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Balance Due (₹)</label>
                  <div className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-lg font-mono text-red-400">
                    {balanceDue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Select Supplier</label>
                  <button onClick={() => setMode('new_seller')} className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded flex items-center gap-1 hover:bg-primary/30 transition-colors">
                    <UserPlus size={12}/> New
                  </button>
                </div>
                <select 
                  className="w-full bg-background border border-gray-700 rounded p-3 text-white outline-none focus:border-primary transition-colors"
                  value={selectedSeller}
                  onChange={e => setSelectedSeller(Number(e.target.value))}
                >
                  <option value="">-- Walk-in Supplier --</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.mobile})</option>)}
                </select>
                {balanceDue > 0 && !selectedSeller && (
                  <p className="text-red-400 text-[10px] mt-1">* A supplier must be selected for borrowed amounts.</p>
                )}
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button onClick={onClose} className="flex-1 py-3 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800 font-bold transition-colors">Cancel</button>
                <button 
                  onClick={handleGenerate} 
                  disabled={loading || (balanceDue > 0 && !selectedSeller)} 
                  className="flex-1 py-3 bg-primary text-black font-black rounded-lg hover:bg-primary-dark disabled:opacity-50 flex justify-center items-center shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
                >
                  {loading ? 'Processing...' : <><Check size={18} className="mr-2"/> CONFIRM & GENERATE</>}
                </button>
              </div>
            </div>
          )}

          {mode === 'new_seller' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white mb-4 border-b border-gray-800 pb-2">Add New Supplier</h3>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Name *</label>
                <input 
                  placeholder="Supplier Name" 
                  className="w-full bg-background border border-gray-700 rounded p-2 text-white outline-none focus:border-primary"
                  value={newSeller.name}
                  onChange={e => setNewSeller({...newSeller, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mobile Number *</label>
                <input 
                  placeholder="Mobile Number" 
                  className="w-full bg-background border border-gray-700 rounded p-2 text-white outline-none focus:border-primary"
                  value={newSeller.mobile}
                  onChange={e => setNewSeller({...newSeller, mobile: e.target.value})}
                />
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setMode('checkout')} className="flex-1 py-2 border border-gray-700 rounded text-gray-400 hover:bg-gray-800">Cancel</button>
                <button onClick={handleSaveNewSeller} disabled={loading} className="flex-1 py-2 bg-primary text-black font-bold rounded hover:bg-primary/90 disabled:opacity-50 flex justify-center items-center">
                  {loading ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
