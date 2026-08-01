import { useBillingStore } from '../../store/billingStore';
import type { BillItem } from '../../store/billingStore';
import toast from 'react-hot-toast';

export default function GoldCalculator() {
  const { goldForm: form, updateGoldForm: update, resetGoldForm: reset, addToCart, liveRates } = useBillingStore();

  const netWeight = form.grossWeight - form.stoneWeight;
  const metalValue = netWeight * (form.touch / 100) * form.ratePerGm;
  
  let making = 0;
  if (form.makingChargeType === 'percent') making = metalValue * (form.makingChargeValue / 100);
  else if (form.makingChargeType === 'per_gm') making = netWeight * form.makingChargeValue;
  else making = form.makingChargeValue;

  const taxable = metalValue + making + form.hallmark + form.otherCharges - form.discount;

  const handleAdd = () => {
    if (form.grossWeight <= 0) {
      toast.error("Gross weight must be > 0");
      return;
    }
    const item: BillItem = {
      id: Math.random().toString(36).substring(7),
      itemType: 'Gold',
      itemName: form.itemName || 'Gold Item',
      purityDisplay: form.purity,
      touchDisplay: form.touch,
      grossWeight: form.grossWeight,
      stoneWeight: form.stoneWeight,
      netWeight,
      rateDisplay: form.ratePerGm,
      metalValue,
      makingAmount: making,
      hallmark: form.hallmark,
      otherCharges: form.otherCharges,
      discount: form.discount,
      taxableAmount: taxable,
      rawGold: { ...form }
    };
    addToCart(item);
    toast.success("Added to Bill");
    reset();
  };

  const handlePuritySelect = (purity: string, rate: number, touch: number) => {
    update('purity', purity);
    update('ratePerGm', rate);
    update('touch', touch);
  };

  return (
    <div className="bg-[#111115] border border-gray-800 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col h-[550px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 font-medium text-sm">Add Item to Bill</h3>
        <button onClick={reset} className="text-xs text-primary hover:text-white transition-colors">Reset</button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar pb-4">
        {/* Item Name */}
        <div>
          <input 
            value={form.itemName} 
            onChange={e => update('itemName', e.target.value)} 
            placeholder="Item Name / Description"
            className="w-full bg-[#1A1A20] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-600" 
          />
        </div>

        {/* Purity Toggles */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Gold Purity</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '14K Gold', val: '14K Gold', rate: liveRates.gold14k, touch: 58.3 },
              { label: '18K Gold', val: '18K Gold', rate: liveRates.gold18k, touch: 75.0 },
              { label: '20K Gold', val: '20K Gold', rate: liveRates.gold20k, touch: 83.3 },
              { label: '22K Gold', val: '22K Gold', rate: liveRates.gold22k, touch: 91.6 },
              { label: '24K Gold', val: '24K Gold', rate: liveRates.gold24k, touch: 99.9 },
            ].map(p => (
              <button 
                key={p.val}
                onClick={() => handlePuritySelect(p.val, p.rate, p.touch)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${form.purity === p.val ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1A1A20] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Rate Override */}
        <div>
           <label className="block text-[11px] font-medium text-gray-500 mb-1">Rate (₹/g) <span className="text-gray-600 ml-1 font-normal">(Editable)</span></label>
           <div className="flex items-center bg-[#1A1A20] border border-gray-800 rounded-xl px-4 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
             <span className="text-primary mr-2">₹</span>
             <input 
               type="number" 
               value={form.ratePerGm || ''} 
               onChange={e => update('ratePerGm', Number(e.target.value))} 
               className="w-full bg-transparent outline-none text-white font-mono" 
             />
           </div>
        </div>

        {/* Weights */}
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
            <label className="absolute -top-2 left-3 bg-[#111115] px-1 text-[10px] font-medium text-primary">Stone Wt (g)</label>
            <input 
              type="number" 
              value={form.stoneWeight || ''} 
              onChange={e => update('stoneWeight', Number(e.target.value))} 
              className="w-full bg-transparent border border-primary/50 focus:border-primary rounded-lg px-3 py-2.5 text-white outline-none font-mono transition-colors" 
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
                className={`px-3 py-1 text-xs rounded transition-colors ${form.makingChargeType === t.val ? 'bg-primary text-black font-bold shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Making Charge Value & Net Weight Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative border-l-[3px] border-primary bg-[#1A1A20] rounded-r-lg rounded-l border-y border-r border-gray-800 focus-within:border-primary/50 transition-colors">
            <input 
              type="number" 
              placeholder={`Charge (${form.makingChargeType === 'percent' ? '%' : '₹'})`}
              value={form.makingChargeValue || ''} 
              onChange={e => update('makingChargeValue', Number(e.target.value))} 
              className="w-full bg-transparent px-3 py-2.5 text-white outline-none font-mono text-sm placeholder-gray-600" 
            />
          </div>
          
          <div className="flex flex-col justify-center px-3 py-1.5 bg-gray-900/50 rounded-lg border border-gray-800/80">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Net Wt</span>
            <span className="text-sm font-mono text-primary font-bold">{netWeight.toFixed(3)}g</span>
          </div>
        </div>

        {/* Additional Fees */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1A1A20] border border-gray-800 rounded-lg px-3 py-2 flex flex-col justify-center focus-within:border-gray-500 transition-colors">
            <label className="text-[10px] text-gray-500 mb-0.5">Hallmarking (₹)</label>
            <input 
              type="number" 
              value={form.hallmark || ''} 
              onChange={e => update('hallmark', Number(e.target.value))} 
              className="w-full bg-transparent outline-none text-white font-mono text-sm" 
            />
          </div>
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
        <button onClick={handleAdd} className="w-full bg-[#23232C] hover:bg-[#2D2D38] text-gray-300 font-medium py-3 rounded-xl text-sm transition-colors mb-2 shadow-inner border border-gray-700/50">
          Add Item to Bill
        </button>
        <button className="w-full flex items-center justify-between bg-[#1A1A20] border border-gray-800 hover:border-gray-700 px-4 py-2.5 rounded-lg transition-colors group">
          <span className="text-primary text-xs font-bold group-hover:text-primary-dark">Deposits & Gold Exchange</span>
          <span className="text-gray-500 text-xs transition-transform group-hover:translate-y-0.5">▼</span>
        </button>
      </div>
    </div>
  );
}
