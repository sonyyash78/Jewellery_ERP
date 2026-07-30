import { useBillingStore } from '../../store/billingStore';
import type { BillItem } from '../../store/billingStore';
import { PlusCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const InputLabel = ({ label }: { label: string }) => (
  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">{label}</label>
);

export default function SilverCalculator() {
  const { silverForm: form, updateSilverForm: update, resetSilverForm: reset, addToCart } = useBillingStore();

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
      id: Math.random().toString(36).substring(7),
      itemType: 'Silver',
      itemName: form.itemName || 'Silver Item',
      purityDisplay: form.silverPurity,
      touchDisplay: form.tanch,
      grossWeight: form.grossWeight,
      stoneWeight: 0,
      netWeight: recoveredSilver, // for silver we often display recovered as net
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

  return (
    <div className="bg-surface border border-gray-700 rounded-xl p-4 shadow-lg flex flex-col h-[550px]">
      <h3 className="text-gray-300 font-bold tracking-widest uppercase text-sm mb-4 border-b border-gray-800 pb-2">Silver Calculator (Tanch)</h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Item Name" /><input value={form.itemName} onChange={e=>update('itemName', e.target.value)} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none" /></div>
          <div><InputLabel label="Category" /><input value={form.category} onChange={e=>update('category', e.target.value)} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none" /></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><InputLabel label="Gross Wt(g)" /><input type="number" value={form.grossWeight||''} onChange={e=>update('grossWeight', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono" /></div>
          <div><InputLabel label="Tanch %" /><input type="number" step="0.1" value={form.tanch||''} onChange={e=>update('tanch', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono text-gray-300" /></div>
          <div><InputLabel label="Rec. Fine(g)" /><input disabled value={recoveredSilver.toFixed(3)} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-500 outline-none font-mono cursor-not-allowed" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Rate ₹/gm" /><input type="number" value={form.ratePerKg||''} onChange={e=>update('ratePerKg', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono" /></div>
          <div>
            <InputLabel label="Making" />
            <div className="flex border border-gray-700 rounded">
              <select value={form.makingChargeType} onChange={e=>update('makingChargeType', e.target.value)} className="bg-background px-1 border-r border-gray-700 text-xs text-textMain outline-none w-16">
                <option value="percent">%</option><option value="per_gm">₹/g</option><option value="flat">₹</option>
              </select>
              <input type="number" value={form.makingChargeValue||''} onChange={e=>update('makingChargeValue', Number(e.target.value))} className="flex-1 bg-background px-2 py-1 text-sm text-textMain outline-none font-mono w-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Other" /><input type="number" value={form.otherCharges||''} onChange={e=>update('otherCharges', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono" /></div>
          <div><InputLabel label="Discount" /><input type="number" value={form.discount||''} onChange={e=>update('discount', Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-red-400 outline-none font-mono" /></div>
        </div>

        <div className="bg-black/30 rounded p-2 border border-gray-800 mt-4">
           <div className="flex justify-between text-xs text-textMuted mb-1"><span>Metal Value:</span><span className="font-mono">₹{metalValue.toFixed(2)}</span></div>
           <div className="flex justify-between text-xs text-textMuted mb-1"><span>Making:</span><span className="font-mono">₹{making.toFixed(2)}</span></div>
           <div className="flex justify-between text-sm text-gray-300 font-bold pt-1 border-t border-gray-800"><span>Taxable:</span><span className="font-mono">₹{taxable.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-800">
        <button onClick={handleAdd} className="col-span-2 bg-gray-200 hover:bg-white text-black font-bold py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors">
          <PlusCircle size={16} /> Add To Bill
        </button>
        <button onClick={reset} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors">
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </div>
  );
}
