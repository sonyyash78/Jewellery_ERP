import { usePurchaseStore } from '../../store/purchaseStore';
import type { PurchaseItem } from '../../store/purchaseStore';
import { PlusCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const InputLabel = ({ label }: { label: string }) => (
  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">{label}</label>
);

export default function PurchaseSilver() {
  const { silverForm: form, updateSilverForm: update, resetForms: reset, addItem } = usePurchaseStore();

  const finalTanch = (form.tanch || 0) + (form.wastage || 0); // E.g., 70% + 5% wastage = 75% final recovery
  const recoveredSilver = (form.grossWeight || 0) * (finalTanch / 100);
  const metalValue = recoveredSilver * (form.metalRate || 0);
  
  // Taxable = Value - deductions (testing/melting) - discount + other
  const taxable = metalValue - (form.testingMeltingCharge || 0) - (form.discount || 0) + (form.otherCharges || 0);

  const handleAdd = () => {
    if (form.grossWeight <= 0) {
      toast.error("Gross weight must be > 0");
      return;
    }
    const item: PurchaseItem = {
      id: Math.random().toString(36).substring(7),
      metalType: 'Silver',
      itemName: form.itemName || 'Old Silver',
      category: 'Scrap',
      grossWeight: form.grossWeight,
      stoneWeight: 0,
      netWeight: form.grossWeight,
      touchPurity: form.tanch,
      wastage: form.wastage,
      fineWeight: recoveredSilver,
      metalRate: form.metalRate,
      metalValue,
      labourCharge: 0,
      testingMeltingCharge: form.testingMeltingCharge,
      hallmarkCharge: 0,
      otherCharges: form.otherCharges,
      discount: form.discount,
      taxableAmount: taxable
    };
    addItem(item);
    toast.success("Silver added to purchase list");
    reset();
  };

  return (
    <div className="bg-surface border border-gray-700 rounded-xl p-4 shadow-lg flex flex-col h-[600px]">
      <h3 className="text-gray-300 font-bold tracking-widest uppercase text-sm mb-4 border-b border-gray-800 pb-2">Scrap Silver Purchase</h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        <div className="grid grid-cols-1 gap-3">
          <div><InputLabel label="Item Name" /><input value={form.itemName} onChange={e=>update('itemName', e.target.value)} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none" placeholder="Old Anklets, Coins..." /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Gross Wt(g)" /><input type="number" value={form.grossWeight||''} onChange={e=>update('grossWeight', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono" /></div>
          <div><InputLabel label="Testing Tanch %" /><input type="number" step="0.1" value={form.tanch||''} onChange={e=>update('tanch', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono text-gray-300" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Wastage (+) %" /><input type="number" step="0.1" value={form.wastage||''} onChange={e=>update('wastage', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono text-gray-300" /></div>
          <div><InputLabel label="Final Tanch %" /><input disabled value={finalTanch.toFixed(1)} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-400 outline-none font-mono cursor-not-allowed" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Rate ₹/gm" /><input type="number" value={form.metalRate||''} onChange={e=>update('metalRate', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono" /></div>
          <div><InputLabel label="Rec. Fine(g)" /><input disabled value={recoveredSilver.toFixed(3)} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-500 outline-none font-mono cursor-not-allowed" /></div>
        </div>

        {/* Deductions */}
        <div className="pt-2">
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Deductions</h4>
            <div className="grid grid-cols-2 gap-3">
            <div><InputLabel label="Test/Melt (-)" /><input type="number" value={form.testingMeltingCharge||''} onChange={e=>update('testingMeltingCharge', Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-red-400 outline-none font-mono" /></div>
            <div><InputLabel label="Discount (-)" /><input type="number" value={form.discount||''} onChange={e=>update('discount', Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-red-400 outline-none font-mono" /></div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Other (+)" /><input type="number" value={form.otherCharges||''} onChange={e=>update('otherCharges', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-gray-400 outline-none font-mono" /></div>
        </div>

        <div className="bg-black/30 rounded p-2 border border-gray-800 mt-2">
           <div className="flex justify-between text-xs text-textMuted mb-1"><span>Metal Value:</span><span className="font-mono">₹{metalValue.toFixed(2)}</span></div>
           <div className="flex justify-between text-sm text-gray-300 font-bold pt-1 border-t border-gray-800"><span>Payable Amount:</span><span className="font-mono">₹{taxable.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-800">
        <button onClick={handleAdd} className="col-span-2 bg-gray-200 hover:bg-white text-black font-bold py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors">
          <PlusCircle size={16} /> Add To Receipt
        </button>
        <button onClick={reset} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors">
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </div>
  );
}
