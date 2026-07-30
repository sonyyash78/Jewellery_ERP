import { usePurchaseStore } from '../../store/purchaseStore';
import type { PurchaseItem } from '../../store/purchaseStore';
import { PlusCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const InputLabel = ({ label }: { label: string }) => (
  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">{label}</label>
);

export default function PurchaseGold() {
  const { goldForm: form, updateGoldForm: update, resetForms: reset, addItem } = usePurchaseStore();

  const netWeight = form.grossWeight - form.stoneWeight;
  const fineWeight = netWeight * (form.touchPurity / 100);
  const metalValue = fineWeight * form.metalRate;
  
  const taxable = metalValue - form.labourCharge - form.hallmarkCharge - form.discount + form.otherCharges;

  const handleAdd = () => {
    if (form.grossWeight <= 0) {
      toast.error("Gross weight must be > 0");
      return;
    }
    const item: PurchaseItem = {
      id: Math.random().toString(36).substring(7),
      metalType: 'Gold',
      itemName: form.itemName || 'Old Gold',
      category: form.category || 'Scrap',
      grossWeight: form.grossWeight,
      stoneWeight: form.stoneWeight,
      netWeight,
      touchPurity: form.touchPurity,
      wastage: 0,
      fineWeight,
      metalRate: form.metalRate,
      metalValue,
      labourCharge: form.labourCharge,
      testingMeltingCharge: 0,
      hallmarkCharge: form.hallmarkCharge,
      otherCharges: form.otherCharges,
      discount: form.discount,
      taxableAmount: taxable
    };
    addItem(item);
    toast.success("Gold added to purchase list");
    reset();
  };

  return (
    <div className="bg-surface border border-primary/20 rounded-xl p-4 shadow-lg flex flex-col h-[600px]">
      <h3 className="text-primary font-bold tracking-widest uppercase text-sm mb-4 border-b border-gray-800 pb-2">Scrap Gold Purchase</h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Item Name" /><input value={form.itemName} onChange={e=>update('itemName', e.target.value)} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none" placeholder="Old Ring, Chain..." /></div>
          <div><InputLabel label="Category" /><input value={form.category} onChange={e=>update('category', e.target.value)} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none" /></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><InputLabel label="Gross Wt(g)" /><input type="number" value={form.grossWeight||''} onChange={e=>update('grossWeight', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none font-mono" /></div>
          <div><InputLabel label="Stone Wt(g)" /><input type="number" value={form.stoneWeight||''} onChange={e=>update('stoneWeight', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none font-mono" /></div>
          <div><InputLabel label="Net Wt(g)" /><input disabled value={netWeight.toFixed(3)} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-400 outline-none font-mono cursor-not-allowed" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Touch %" /><input type="number" step="0.1" value={form.touchPurity||''} onChange={e=>update('touchPurity', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none font-mono text-primary" /></div>
          <div><InputLabel label="Fine Wt(g)" /><input disabled value={fineWeight.toFixed(3)} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-400 outline-none font-mono cursor-not-allowed text-primary" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Rate ₹/gm" /><input type="number" value={form.metalRate||''} onChange={e=>update('metalRate', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none font-mono" /></div>
          <div><InputLabel label="Metal Value" /><input disabled value={`₹${metalValue.toFixed(2)}`} className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-sm text-gray-400 outline-none font-mono cursor-not-allowed" /></div>
        </div>

        {/* Deductions - Since we are BUYING, these are amounts we deduct from what we pay the customer */}
        <div className="pt-2">
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Deductions</h4>
            <div className="grid grid-cols-3 gap-3">
            <div><InputLabel label="Labour (-)" /><input type="number" value={form.labourCharge||''} onChange={e=>update('labourCharge', Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-red-400 outline-none font-mono" /></div>
            <div><InputLabel label="Hallmark (-)" /><input type="number" value={form.hallmarkCharge||''} onChange={e=>update('hallmarkCharge', Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-red-400 outline-none font-mono" /></div>
            <div><InputLabel label="Discount (-)" /><input type="number" value={form.discount||''} onChange={e=>update('discount', Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-red-400 outline-none font-mono" /></div>
            </div>
        </div>

        {/* Additions */}
        <div className="grid grid-cols-2 gap-3">
          <div><InputLabel label="Other (+)" /><input type="number" value={form.otherCharges||''} onChange={e=>update('otherCharges', Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded px-2 py-1 text-sm text-textMain focus:border-primary outline-none font-mono" /></div>
        </div>
        
        <div className="bg-black/30 rounded p-2 border border-gray-800 mt-2">
           <div className="flex justify-between text-sm text-primary font-bold pt-1"><span>Payable Amount:</span><span className="font-mono">₹{taxable.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-800">
        <button onClick={handleAdd} className="col-span-2 bg-primary hover:bg-primary-dark text-black font-bold py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors">
          <PlusCircle size={16} /> Add To Receipt
        </button>
        <button onClick={reset} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors">
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </div>
  );
}
