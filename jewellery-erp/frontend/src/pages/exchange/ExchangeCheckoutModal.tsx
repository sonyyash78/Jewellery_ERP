import { useState, useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Check, X, Calculator, UserPlus } from 'lucide-react';
import { useExchangeStore } from '../../store/exchangeStore';
import { getErrorMessage } from '../../utils/errorUtils';

interface ExchangeCheckoutModalProps {
  payload: any;
  differenceAmount: number;
  onClose: () => void;
  onSuccess: (exchangeId: number) => void;
}

export default function ExchangeCheckoutModal({ payload, differenceAmount, onClose, onSuccess }: ExchangeCheckoutModalProps) {
  // We handle the absolute amount in the UI, and apply the sign on submit
  const [absAmountPaid, setAbsAmountPaid] = useState<number>(Math.abs(differenceAmount));
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const initialCustomerId = useExchangeStore.getState().customerId;
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>(initialCustomerId || '');
  
  const [mode, setMode] = useState<'checkout' | 'new_customer'>('checkout');
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '' });

  // Metal deposit state
  const [goldDeposited, setGoldDeposited] = useState<number>(0);
  const [silverDeposited, setSilverDeposited] = useState<number>(0);

  const absDifference = Math.abs(differenceAmount);
  const balanceDue = absDifference - absAmountPaid;

  // Calculate billed vs received metals
  const totalGoldNew = payload.new_items?.reduce((sum: number, item: any) => sum + (item.metal === 'Gold' ? (item.fine_weight || item.net_weight || 0) : 0), 0) || 0;
  const totalGoldOld = payload.old_items?.reduce((sum: number, item: any) => sum + (item.metal === 'Gold' ? (item.fine_weight || item.net_weight || 0) : 0), 0) || 0;
  const initialGoldDue = totalGoldNew - totalGoldOld;
  const goldDue = initialGoldDue - goldDeposited;

  const totalSilverNew = payload.new_items?.reduce((sum: number, item: any) => sum + (item.metal === 'Silver' ? (item.fine_weight || item.net_weight || 0) : 0), 0) || 0;
  const totalSilverOld = payload.old_items?.reduce((sum: number, item: any) => sum + (item.metal === 'Silver' ? (item.fine_weight || item.net_weight || 0) : 0), 0) || 0;
  const initialSilverDue = totalSilverNew - totalSilverOld;
  const silverDue = initialSilverDue - silverDeposited;

  useEffect(() => {
    // Fetch customers for the dropdown
    axiosClient.get('/customers/').then(res => setCustomers(res.data.items || []));
  }, []);

  const handleGenerate = async () => {
    // Validation
    if (!selectedCustomer) {
      toast.error('A customer must be selected for an exchange.');
      return;
    }
    if (absAmountPaid < 0) {
      toast.error('Amount paid cannot be negative.');
      return;
    }
    
    setLoading(true);
    
    // Apply sign to amount paid
    let finalAmountPaid = absAmountPaid;
    if (differenceAmount < 0) {
        // If we owe customer, amount_paid is negative (we pay them)
        finalAmountPaid = -absAmountPaid;
    }

    // Inject metal deposits as "Old Items" in the payload
    let updatedOldItems = [...(payload.old_items || [])];

    if (goldDeposited > 0) {
      updatedOldItems.push({
        item_name: "Old Gold Deposit",
        metal: "Gold",
        purity: "24K", // Default purity for fine metal deposit
        touch: 100,
        gross_weight: goldDeposited,
        stone_weight: 0,
        net_weight: goldDeposited,
        wastage: 0,
        fine_weight: goldDeposited,
        labour_charge: 0,
        testing_melting_charge: 0,
        hallmark_charge: 0,
        other_charges: 0,
        discount: 0,
        rate_applied: 0,
        calculated_value: 0
      });
    }

    if (silverDeposited > 0) {
      updatedOldItems.push({
        item_name: "Old Silver Deposit",
        metal: "Silver",
        purity: "999",
        touch: 100,
        gross_weight: silverDeposited,
        stone_weight: 0,
        net_weight: silverDeposited,
        wastage: 0,
        fine_weight: silverDeposited,
        labour_charge: 0,
        testing_melting_charge: 0,
        hallmark_charge: 0,
        other_charges: 0,
        discount: 0,
        rate_applied: 0,
        calculated_value: 0
      });
    }

    const finalPayload = {
      ...payload,
      old_items: updatedOldItems,
      customer_id: selectedCustomer,
      amount_paid: finalAmountPaid,
    };

    try {
      const res = await axiosClient.post('/exchanges/', finalPayload);
      toast.success(`Exchange generated successfully!`);
      onSuccess(res.data.id);
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to generate exchange"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.phone) {
      toast.error('First name and phone are required');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post('/customers/', {
        first_name: newCustomer.first_name,
        last_name: newCustomer.last_name,
        phone_number: newCustomer.phone,
        email: null,
        address: ''
      });
      const newCustId = res.data.id;
      setCustomers([...customers, res.data]);
      setSelectedCustomer(newCustId);
      setMode('checkout');
      toast.success('Customer added');
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Failed to create customer"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Calculator size={20}/> Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {mode === 'checkout' && (
            <div className="space-y-6">
              
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Net Payable</span>
                <div className="text-right">
                  <span className={`text-3xl font-bold font-mono ${differenceAmount > 0 ? 'text-primary' : 'text-green-400'}`}>
                    ₹ {absDifference.toLocaleString()}
                  </span>
                  <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                    {differenceAmount > 0 ? 'Customer Pays You' : differenceAmount < 0 ? 'You Pay Customer' : 'Settled Even'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-green-500 uppercase tracking-widest mb-2">Amount Settled (₹)</label>
                  <input 
                    type="number" 
                    value={absAmountPaid === 0 ? '' : absAmountPaid} 
                    onChange={e => setAbsAmountPaid(Number(e.target.value))}
                    className="w-full bg-background border border-gray-700 rounded p-3 text-lg font-mono text-green-400 focus:border-green-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Balance Remaining (₹)</label>
                  <div className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-lg font-mono text-red-400">
                    {balanceDue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Dynamic Metal Settlement Section */}
              {(initialGoldDue > 0 || initialSilverDue > 0) && (
                <div className="border-t border-gray-800 pt-4 mt-2">
                  <div className="space-y-4">
                    {initialGoldDue > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            Gold Settlement
                          </h3>
                          <span className="text-yellow-500 text-xs font-bold">BILLED: {initialGoldDue.toFixed(3)} gm</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Gold Deposited (gm)</label>
                            <input 
                              type="number" 
                              min="0"
                              step="0.001"
                              value={goldDeposited === 0 ? '' : goldDeposited}
                              onChange={e => setGoldDeposited(Number(e.target.value))}
                              placeholder="0.000"
                              className="w-full bg-background border border-gray-700 rounded p-3 text-lg font-mono text-yellow-500 focus:border-yellow-500 outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Gold Due (gm)</label>
                            <div className={`w-full bg-gray-900 border border-gray-800 rounded p-3 text-lg font-mono ${goldDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {goldDue.toFixed(3)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {initialSilverDue > 0 && (
                      <div className={initialGoldDue > 0 ? 'pt-4 border-t border-gray-800/50' : ''}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            Silver Settlement
                          </h3>
                          <span className="text-gray-300 text-xs font-bold">BILLED: {initialSilverDue.toFixed(3)} gm</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Silver Deposited (gm)</label>
                            <input 
                              type="number" 
                              min="0"
                              step="0.001"
                              value={silverDeposited === 0 ? '' : silverDeposited}
                              onChange={e => setSilverDeposited(Number(e.target.value))}
                              placeholder="0.000"
                              className="w-full bg-background border border-gray-700 rounded p-3 text-lg font-mono text-gray-300 focus:border-gray-400 outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Silver Due (gm)</label>
                            <div className={`w-full bg-gray-900 border border-gray-800 rounded p-3 text-lg font-mono ${silverDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {silverDue.toFixed(3)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-800 pt-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Select Customer</label>
                  <button onClick={() => setMode('new_customer')} className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded flex items-center gap-1 hover:bg-primary/30 transition-colors">
                    <UserPlus size={12}/> New
                  </button>
                </div>
                <select 
                  className="w-full bg-background border border-gray-700 rounded p-3 text-white outline-none focus:border-primary transition-colors"
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(Number(e.target.value))}
                >
                  <option value="">-- Mandatory Selection --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ''} ({c.phone_number})</option>)}
                </select>
                {!selectedCustomer && (
                  <p className="text-red-400 text-[10px] mt-1">* A customer must be selected for exchange tracking.</p>
                )}
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button onClick={onClose} className="flex-1 py-3 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800 font-bold transition-colors">Cancel</button>
                <button 
                  onClick={handleGenerate} 
                  disabled={loading || !selectedCustomer} 
                  className="flex-1 py-3 bg-primary text-black font-black rounded-lg hover:bg-primary-dark disabled:opacity-50 flex justify-center items-center shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
                >
                  {loading ? 'Processing...' : <><Check size={18} className="mr-2"/> CONFIRM & GENERATE</>}
                </button>
              </div>
            </div>
          )}

          {mode === 'new_customer' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white mb-4 border-b border-gray-800 pb-2">Add New Customer</h3>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">First Name *</label>
                <input 
                  placeholder="First Name" 
                  className="w-full bg-background border border-gray-700 rounded p-2 text-white outline-none focus:border-primary"
                  value={newCustomer.first_name}
                  onChange={e => setNewCustomer({...newCustomer, first_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Last Name</label>
                <input 
                  placeholder="Last Name" 
                  className="w-full bg-background border border-gray-700 rounded p-2 text-white outline-none focus:border-primary"
                  value={newCustomer.last_name}
                  onChange={e => setNewCustomer({...newCustomer, last_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Phone Number *</label>
                <input 
                  placeholder="Phone Number" 
                  className="w-full bg-background border border-gray-700 rounded p-2 text-white outline-none focus:border-primary"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setMode('checkout')} className="flex-1 py-2 border border-gray-700 rounded text-gray-400 hover:bg-gray-800">Cancel</button>
                <button onClick={handleSaveNewCustomer} disabled={loading} className="flex-1 py-2 bg-primary text-black font-bold rounded hover:bg-primary/90 disabled:opacity-50 flex justify-center items-center">
                  {loading ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
