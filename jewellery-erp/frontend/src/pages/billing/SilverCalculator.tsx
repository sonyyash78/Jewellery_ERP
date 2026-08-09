import { useBillingStore } from '../../store/billingStore';
import type { BillItem } from '../../store/billingStore';
import toast from 'react-hot-toast';
import { ShoppingCart, RotateCcw } from 'lucide-react';

const InputLabel = ({ label }: { label: string }) => (
  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
);

export default function SilverCalculator() {
  const { silverForm: form, updateSilverForm: update, resetSilverForm: reset, addToCart, liveRates, editingItemId } = useBillingStore();

  const fineWeight = (form.grossWeight || 0) * (((form.tanch || 0) + (form.wastage || 0)) / 100);
  const metalValue = fineWeight * ((form.ratePerKg || 0) / 1000);
  
  let making = 0;
  if (form.makingChargeType === 'percent') making = metalValue * (form.makingChargeValue / 100);
  else if (form.makingChargeType === 'per_gm') making = form.grossWeight * form.makingChargeValue;
  else making = form.makingChargeValue;

  const taxable = metalValue + making + form.otherCharges - form.discount;

  const handleAdd = () => {
    if (form.grossWeight <= 0) {
      toast.error("Gross weight must be > 0");
      return;
    }
    const item: BillItem = {
      id: editingItemId || Math.random().toString(36).substring(7),
      itemType: 'Silver',
      itemName: form.itemName || 'Silver Item',
      purityDisplay: form.silverPurity,
      touchDisplay: form.tanch,
      wastageDisplay: form.wastage,
      grossWeight: form.grossWeight,
      stoneWeight: 0,
      netWeight: form.grossWeight, 
      fineWeight: fineWeight,
      rateDisplay: form.ratePerKg,
      metalValue,
      makingAmount: making,
      hallmark: 0,
      otherCharges: form.otherCharges,
      discount: form.discount,
      taxableAmount: taxable,
      rawSilver: { ...form }
    };
    addToCart(item);
    toast.success("Added to Bill");
    reset();
  };

  const handlePuritySelect = (purity: string, tanch: number) => {
    update('silverPurity', purity);
    update('tanch', tanch);
    update('ratePerKg', liveRates.silver * 100); // If liveRates is per 10g, per kg is *100
  };

  return (
    <div className="bg-[#111115] border border-gray-800 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col h-[650px]">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-gray-300 font-bold tracking-widest uppercase text-sm">Add Silver Item</h3>
        <button onClick={reset} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"><RotateCcw size={12}/> Reset</button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar pb-4">
        {/* Item Name */}
        <div>
          <input 
            value={form.itemName} 
            onChange={e => update('itemName', e.target.value)} 
            placeholder="Item Name / Description"
            className="w-full bg-[#1A1A20] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-gray-500 outline-none transition-all placeholder-gray-600" 
          />
        </div>

        {/* Purity Toggles */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Silver Purity</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Fine (99.9)', val: 'Fine', tanch: 99.9 },
              { label: 'Sterling (92.5)', val: 'Sterling', tanch: 92.5 },
              { label: 'Custom (65.0)', val: 'Custom', tanch: 65.0 },
            ].map(p => (
              <button 
                key={p.val}
                onClick={() => handlePuritySelect(p.val, p.tanch)}
                className={`px-3 py-1 text-[11px] font-medium rounded border transition-colors ${form.silverPurity === p.val ? 'bg-gray-700/50 border-gray-300 text-gray-200' : 'bg-[#1A1A20] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Weights */}
        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Gross Wt(g)" /><input type="number" value={form.grossWeight||''} onChange={e=>update('grossWeight', Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gray-500 outline-none font-mono" /></div>
          <div><InputLabel label="Net Wt(g)" /><input disabled value={form.grossWeight.toFixed(3)} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-500 outline-none font-mono cursor-not-allowed" /></div>
        </div>

        {/* Calculations */}
        <div className="grid grid-cols-3 gap-3">
          <div><InputLabel label="Tanch %" /><input type="number" step="0.1" value={form.tanch||''} onChange={e=>update('tanch', Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:border-gray-500 outline-none font-mono" /></div>
          <div><InputLabel label="Wastage %" /><input type="number" step="0.1" value={form.wastage||''} onChange={e=>update('wastage', Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:border-gray-500 outline-none font-mono" /></div>
          <div><InputLabel label="Fine Wt(g)" /><input disabled value={fineWeight.toFixed(3)} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-300/70 outline-none font-mono cursor-not-allowed" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Rate (₹/kg)" /><input type="number" value={form.ratePerKg||''} onChange={e=>update('ratePerKg', Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gray-500 outline-none font-mono" /></div>
          <div><InputLabel label="Metal Value" /><input disabled value={`₹${metalValue.toFixed(2)}`} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-500 outline-none font-mono cursor-not-allowed" /></div>
        </div>

        {/* Additions */}
        <div className="pt-1">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Charges</h4>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Making Charge Type</span>
            <div className="flex bg-[#1A1A20] rounded border border-gray-800">
              {[
                { label: '%', val: 'percent' },
                { label: '₹/g', val: 'per_gm' },
                { label: '₹ Flat', val: 'flat' }
              ].map(t => (
                <button 
                  key={t.val}
                  onClick={() => update('makingChargeType', t.val)}
                  className={`px-3 py-0.5 text-xs rounded-sm transition-colors ${form.makingChargeType === t.val ? 'bg-gray-300 text-black font-bold' : 'text-gray-400'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><InputLabel label="Making Value" /><input type="number" value={form.makingChargeValue||''} onChange={e=>update('makingChargeValue', Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gray-500 outline-none font-mono" /></div>
            <div><InputLabel label="Total Making" /><input disabled value={`₹${making.toFixed(2)}`} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-500 outline-none font-mono cursor-not-allowed" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><InputLabel label="Other (+)" /><input type="number" value={form.otherCharges||''} onChange={e=>update('otherCharges', Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gray-500 outline-none font-mono" /></div>
          </div>
        </div>

        {/* Deductions */}
        <div className="pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div><InputLabel label="Discount (-)" /><input type="number" value={form.discount||''} onChange={e=>update('discount', Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-red-400 focus:border-red-500 outline-none font-mono" /></div>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-gray-800/50">
        <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-gray-400 text-sm font-medium">Taxable Amount</span>
            <span className="text-gray-300 font-bold text-lg font-mono">₹{taxable.toFixed(2)}</span>
        </div>
        <button onClick={handleAdd} className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(200,200,200,0.1)] transition-all">
          <ShoppingCart size={18} /> {editingItemId ? 'UPDATE ITEM' : 'ADD TO BILL'}
        </button>
      </div>
    </div>
  );
}
