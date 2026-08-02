import { useBillingStore } from '../../store/billingStore';
import type { BillItem } from '../../store/billingStore';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';

export default function SilverCalculator() {
  const { silverForm: form, updateSilverForm: update, resetSilverForm: reset, addToCart, liveRates, editingItemId } = useBillingStore();

  const recoveredSilver = form.grossWeight * (form.tanch / 100);
  const metalValue = recoveredSilver * form.ratePerKg;
  
  let making = 0;
  if (form.makingChargeType === 'percent') making = metalValue * (form.makingChargeValue / 100);
  else if (form.makingChargeType === 'per_gm') making = form.grossWeight * form.makingChargeValue; // Usually per gram of gross for silver
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
      grossWeight: form.grossWeight,
      stoneWeight: 0,
      netWeight: recoveredSilver, 
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
    update('ratePerKg', liveRates.silver / 10); // silver is per 10g in liveRates, so per gram is / 10
  };

  return (
    <div className="bg-[#111115] border border-gray-800 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col h-[550px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 font-medium text-sm">Add Silver Item</h3>
        <button onClick={reset} className="text-xs text-gray-400 hover:text-white transition-colors">Reset</button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar pb-4">
        {/* Item Name */}
        <div>
          <input 
            value={form.itemName} 
            onChange={e => update('itemName', e.target.value)} 
            placeholder="Item Name / Description"
            className="w-full bg-[#1A1A20] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none transition-all placeholder-gray-600" 
          />
        </div>

        {/* Purity Toggles */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Silver Purity</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Fine (99.9)', val: 'Fine', tanch: 99.9 },
              { label: 'Sterling (92.5)', val: 'Sterling', tanch: 92.5 },
              { label: 'Custom (65.0)', val: 'Custom', tanch: 65.0 },
            ].map(p => (
              <button 
                key={p.val}
                onClick={() => handlePuritySelect(p.val, p.tanch)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${form.silverPurity === p.val ? 'bg-gray-700/50 border-gray-300 text-gray-200' : 'bg-[#1A1A20] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Rate Override */}
        <div>
           <label className="block text-[11px] font-medium text-gray-500 mb-1">Rate (₹/g) <span className="text-gray-600 ml-1 font-normal">(Editable)</span></label>
           <div className="flex items-center bg-[#1A1A20] border border-gray-800 rounded-xl px-4 py-2 focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500 transition-all">
             <span className="text-gray-400 mr-2">₹</span>
             <input 
               type="number" 
               value={form.ratePerKg || ''} 
               onChange={e => update('ratePerKg', Number(e.target.value))} 
               className="w-full bg-transparent outline-none text-white font-mono" 
             />
           </div>
        </div>

        {/* Weights & Tanch */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-[#111115] px-1 text-[10px] font-medium text-gray-400">Gross Wt (g)</label>
            <input 
              type="number" 
              value={form.grossWeight || ''} 
              onChange={e => update('grossWeight', Number(e.target.value))} 
              className="w-full bg-transparent border border-gray-700 focus:border-gray-500 rounded-lg px-3 py-2.5 text-white outline-none font-mono transition-colors" 
            />
          </div>
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-[#111115] px-1 text-[10px] font-medium text-gray-300">Tanch (%)</label>
            <input 
              type="number" 
              step="0.1"
              value={form.tanch || ''} 
              onChange={e => update('tanch', Number(e.target.value))} 
              className="w-full bg-transparent border border-gray-500 focus:border-gray-300 rounded-lg px-3 py-2.5 text-white outline-none font-mono transition-colors" 
            />
          </div>
        </div>

        {/* Making Charge */}
        <div className="flex items-center justify-between mt-2">
          <label className="text-xs font-medium text-gray-400">Making Charge</label>
          <div className="flex bg-[#1A1A20] rounded-lg p-1 border border-gray-800">
            {[
              { label: '%', val: 'percent' },
              { label: '₹/g', val: 'per_gm' },
              { label: '₹ Flat', val: 'flat' }
            ].map(t => (
              <button 
                key={t.val}
                onClick={() => update('makingChargeType', t.val)}
                className={`px-3 py-1 text-xs rounded transition-colors ${form.makingChargeType === t.val ? 'bg-gray-300 text-black font-bold shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Making Charge Value & Net Weight Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative border-l-[3px] border-gray-400 bg-[#1A1A20] rounded-r-lg rounded-l border-y border-r border-gray-800 focus-within:border-gray-500 transition-colors">
            <input 
              type="number" 
              placeholder={`Charge (${form.makingChargeType === 'percent' ? '%' : '₹'})`}
              value={form.makingChargeValue || ''} 
              onChange={e => update('makingChargeValue', Number(e.target.value))} 
              className="w-full bg-transparent px-3 py-2.5 text-white outline-none font-mono text-sm placeholder-gray-600" 
            />
          </div>
          
          <div className="flex flex-col justify-center px-3 py-1.5 bg-gray-900/50 rounded-lg border border-gray-800/80">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Fine Wt</span>
            <span className="text-sm font-mono text-gray-300 font-bold">{recoveredSilver.toFixed(3)}g</span>
          </div>
        </div>

        {/* Additional Fees */}
        <div>
          <div className="bg-[#1A1A20] border border-gray-800 rounded-lg px-3 py-2 flex flex-col justify-center focus-within:border-gray-500 transition-colors">
            <label className="text-[10px] text-gray-500 mb-0.5">Other Fee (₹)</label>
            <input 
              type="number" 
              value={form.otherCharges || ''} 
              onChange={e => update('otherCharges', Number(e.target.value))} 
              className="w-full bg-transparent outline-none text-white font-mono text-sm" 
            />
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-800/50">
        <button onClick={handleAdd} className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
          <ShoppingCart size={18} /> {editingItemId ? 'UPDATE ITEM' : 'ADD TO BILL'}
        </button>
      </div>
    </div>
  );
}
