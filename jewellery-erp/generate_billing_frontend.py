import os

base_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/frontend"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_billing_store = """
import { create } from 'zustand';

type MakingChargeType = 'percent' | 'per_gm' | 'flat';
type GSTState = 'same_state' | 'different_state';

interface CalculatorState {
  itemType: 'Gold' | 'Silver';
  itemName: string;
  category: string;
  hsn: string;
  touch: number;
  grossWeight: number;
  stoneWeight: number;
  ratePerGm: number;
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  hallmark: number;
  otherCharges: number;
  discount: number;
  gstState: GSTState;
  
  // Actions
  setField: (field: keyof CalculatorState, value: any) => void;
  reset: () => void;
}

export const useBillingStore = create<CalculatorState>((set) => ({
  itemType: 'Gold',
  itemName: '',
  category: '',
  hsn: '',
  touch: 91.6,
  grossWeight: 0,
  stoneWeight: 0,
  ratePerGm: 7000,
  makingChargeType: 'percent',
  makingChargeValue: 0,
  hallmark: 0,
  otherCharges: 0,
  discount: 0,
  gstState: 'same_state',
  
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  reset: () => set({
    itemName: '', category: '', hsn: '', touch: 91.6,
    grossWeight: 0, stoneWeight: 0,
    makingChargeType: 'percent', makingChargeValue: 0,
    hallmark: 0, otherCharges: 0, discount: 0
  })
}));
"""

c_billing_page = """
import { useState, useEffect } from 'react';
import { useBillingStore } from '../store/billingStore';
import { axiosClient } from '../api/axiosClient';
import toast from 'react-hot-toast';
import { Calculator, Save, Printer, PlusCircle, RefreshCw, Trash2, User } from 'lucide-react';

export default function Billing() {
  const store = useBillingStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch customers for the dropdown
    axiosClient.get('/customers/').then(res => setCustomers(res.data)).catch(() => {});
  }, []);

  // Live Calculations
  const netWeight = store.grossWeight - store.stoneWeight;
  const purityFactor = store.touch / 100;
  const metalValue = netWeight * purityFactor * store.ratePerGm;
  
  let makingChargeAmount = 0;
  if (store.makingChargeType === 'percent') {
    makingChargeAmount = metalValue * (store.makingChargeValue / 100);
  } else if (store.makingChargeType === 'per_gm') {
    makingChargeAmount = netWeight * store.makingChargeValue;
  } else {
    makingChargeAmount = store.makingChargeValue;
  }

  const subtotal = metalValue + makingChargeAmount + store.hallmark + store.otherCharges - store.discount;
  const taxAmount = subtotal * 0.03; // 3% total GST always (either IGST or CGST+SGST)
  const grandTotal = Math.round(subtotal + taxAmount);
  
  const handleGenerateBill = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer first.");
      return;
    }
    if (grandTotal <= 0) {
      toast.error("Grand total must be greater than zero.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: selectedCustomerId,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: store.discount,
        grand_total: grandTotal,
        status: 'Paid',
        items: [
          {
            item_name: store.itemName || "Custom Item",
            item_type: store.itemType,
            final_price: subtotal,
            gold_calculation: store.itemType === 'Gold' ? {
              metal_rate_id: 1, // Mock
              gross_weight: store.grossWeight,
              stone_weight: store.stoneWeight,
              net_weight: netWeight,
              making_charges_amount: makingChargeAmount,
              hallmark_charges: store.hallmark,
              total_gold_value: metalValue
            } : null,
            silver_calculation: store.itemType === 'Silver' ? {
              metal_rate_id: 2, // Mock
              gross_weight: store.grossWeight,
              net_weight: netWeight,
              making_charges_amount: makingChargeAmount,
              total_silver_value: metalValue
            } : null
          }
        ]
      };

      const res = await axiosClient.post('/invoices/', payload);
      toast.success(`Invoice ${res.data.invoice_number} Generated Successfully!`);
      store.reset();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to generate bill");
    } finally {
      setLoading(false);
    }
  };

  const InputLabel = ({ label }: { label: string }) => (
    <label className="block text-xs font-semibold text-textMuted uppercase tracking-wide mb-1">{label}</label>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Calculator Form */}
      <div className="flex-1 bg-surface border border-gray-800 rounded-xl overflow-hidden flex flex-col">
        {/* Header & Tabs */}
        <div className="border-b border-gray-800 flex items-center justify-between p-4 bg-background/50">
          <div className="flex space-x-2">
            <button 
              onClick={() => store.setField('itemType', 'Gold')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${store.itemType === 'Gold' ? 'bg-primary text-black' : 'text-textMuted hover:bg-gray-800'}`}
            >
              Gold Calculator
            </button>
            <button 
              onClick={() => store.setField('itemType', 'Silver')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${store.itemType === 'Silver' ? 'bg-gray-200 text-black' : 'text-textMuted hover:bg-gray-800'}`}
            >
              Silver Calculator
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded border border-gray-700">
              <User size={16} className="text-primary" />
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="bg-transparent text-sm text-textMain outline-none w-40"
              >
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <span className="text-sm text-textMuted">Date: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          
          {/* Row 1: Details */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <InputLabel label="Item Name" />
              <input type="text" value={store.itemName} onChange={e => store.setField('itemName', e.target.value)} className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-textMain focus:border-primary outline-none transition-colors" placeholder="e.g. Lotus Ring" />
            </div>
            <div>
              <InputLabel label="Category" />
              <input type="text" value={store.category} onChange={e => store.setField('category', e.target.value)} className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-textMain focus:border-primary outline-none" />
            </div>
            <div>
              <InputLabel label="HSN Code" />
              <input type="text" value={store.hsn} onChange={e => store.setField('hsn', e.target.value)} className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-textMain focus:border-primary outline-none" placeholder="7113" />
            </div>
          </div>

          <div className="h-px bg-gray-800 my-2"></div>

          {/* Row 2: Weights & Rate */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <InputLabel label="Gross Wt (gm)" />
              <input type="number" step="0.001" value={store.grossWeight || ''} onChange={e => store.setField('grossWeight', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-textMain focus:border-primary outline-none font-mono text-lg text-primary" />
            </div>
            <div>
              <InputLabel label="Stone Wt (gm)" />
              <input type="number" step="0.001" value={store.stoneWeight || ''} onChange={e => store.setField('stoneWeight', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-textMain focus:border-primary outline-none font-mono text-lg" />
            </div>
            <div>
              <InputLabel label="Purity/Touch (%)" />
              <input type="number" step="0.1" value={store.touch || ''} onChange={e => store.setField('touch', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-textMain focus:border-primary outline-none font-mono text-lg" />
            </div>
            <div>
              <InputLabel label="Rate (₹/gm)" />
              <input type="number" value={store.ratePerGm || ''} onChange={e => store.setField('ratePerGm', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-textMain focus:border-primary outline-none font-mono text-lg" />
            </div>
          </div>

          <div className="h-px bg-gray-800 my-2"></div>

          {/* Row 3: Charges */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <InputLabel label="Making Charges" />
              <div className="flex border border-gray-700 rounded overflow-hidden">
                <select value={store.makingChargeType} onChange={e => store.setField('makingChargeType', e.target.value)} className="bg-background px-3 border-r border-gray-700 text-textMain outline-none cursor-pointer">
                  <option value="percent">% of Value</option>
                  <option value="per_gm">₹ / gm</option>
                  <option value="flat">Flat ₹</option>
                </select>
                <input type="number" value={store.makingChargeValue || ''} onChange={e => store.setField('makingChargeValue', Number(e.target.value))} className="flex-1 bg-background px-3 py-2 text-textMain focus:bg-gray-900 outline-none font-mono" />
              </div>
            </div>
            <div>
              <InputLabel label="Hallmark (₹)" />
              <input type="number" value={store.hallmark || ''} onChange={e => store.setField('hallmark', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-textMain focus:border-primary outline-none" />
            </div>
            <div>
              <InputLabel label="Discount (₹)" />
              <input type="number" value={store.discount || ''} onChange={e => store.setField('discount', Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-3 py-2 text-red-400 focus:border-red-500 outline-none" />
            </div>
          </div>

          {/* Row 4: GST Options */}
          <div className="pt-2">
            <InputLabel label="GST Configuration" />
            <div className="flex space-x-6 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" checked={store.gstState === 'same_state'} onChange={() => store.setField('gstState', 'same_state')} className="text-primary accent-primary w-4 h-4" />
                <span className="text-sm text-textMain">Same State (CGST 1.5% + SGST 1.5%)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" checked={store.gstState === 'different_state'} onChange={() => store.setField('gstState', 'different_state')} className="text-primary accent-primary w-4 h-4" />
                <span className="text-sm text-textMain">Different State (IGST 3%)</span>
              </label>
            </div>
          </div>

        </div>
      </div>

      {/* Right Column: Live Summary & Actions */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        
        {/* Live Calculation Panel */}
        <div className="bg-surface border border-gray-800 rounded-xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="flex items-center space-x-2 mb-6">
            <Calculator size={20} className="text-primary" />
            <h3 className="font-bold text-lg tracking-wide uppercase">Live Summary</h3>
          </div>

          <div className="space-y-4 flex-1 text-sm">
            <div className="flex justify-between">
              <span className="text-textMuted">Net Weight</span>
              <span className="font-mono font-medium text-textMain">{netWeight.toFixed(3)} gm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textMuted">Metal Value</span>
              <span className="font-mono font-medium text-textMain">₹ {metalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textMuted">Making Charges</span>
              <span className="font-mono font-medium text-textMain">₹ {makingChargeAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            {(store.hallmark > 0 || store.otherCharges > 0) && (
              <div className="flex justify-between">
                <span className="text-textMuted">Other Charges</span>
                <span className="font-mono font-medium text-textMain">₹ {(store.hallmark + store.otherCharges).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}
            
            {store.discount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount</span>
                <span className="font-mono font-medium">- ₹ {store.discount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}

            <div className="h-px bg-gray-700 my-2"></div>
            
            <div className="flex justify-between">
              <span className="text-textMuted font-medium">Subtotal</span>
              <span className="font-mono font-bold text-textMain">₹ {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>

            {store.gstState === 'same_state' ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">CGST (1.5%)</span>
                  <span className="font-mono">₹ {(taxAmount/2).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">SGST (1.5%)</span>
                  <span className="font-mono">₹ {(taxAmount/2).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-xs">
                <span className="text-textMuted">IGST (3%)</span>
                <span className="font-mono">₹ {taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-end">
              <span className="text-textMuted font-bold uppercase tracking-wider">Grand Total</span>
              <span className="text-4xl font-black text-primary tracking-tighter">₹ {grandTotal.toLocaleString()}</span>
            </div>
            <p className="text-right text-xs text-textMuted mt-1">Rounded off</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 bg-background border border-gray-700 hover:border-gray-500 text-textMain p-3 rounded-lg transition-colors">
            <Save size={18} /> <span>Save Draft</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-background border border-gray-700 hover:border-gray-500 text-textMain p-3 rounded-lg transition-colors">
            <Printer size={18} /> <span>Print</span>
          </button>
          <button onClick={store.reset} className="flex items-center justify-center space-x-2 bg-red-950/30 border border-red-900/50 hover:bg-red-900/30 text-red-400 p-3 rounded-lg transition-colors">
            <Trash2 size={18} /> <span>Clear</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-textMain p-3 rounded-lg transition-colors">
            <PlusCircle size={18} /> <span>Add Line</span>
          </button>
          <button 
            onClick={handleGenerateBill}
            disabled={loading}
            className="col-span-2 flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-black font-bold p-4 rounded-lg transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Calculator size={20} />}
            <span>{loading ? 'Generating...' : 'Generate Invoice'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
"""

write_file("src/store/billingStore.ts", c_billing_store)
write_file("src/pages/Billing.tsx", c_billing_page)
print("Frontend Billing module created.")
