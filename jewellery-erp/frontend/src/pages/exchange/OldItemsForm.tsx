import { useState } from 'react';
import { useExchangeStore } from '../../store/exchangeStore';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OldItemsForm() {
  const addOldItem = useExchangeStore(s => s.addOldItem);
  const [metal, setMetal] = useState<'Gold'|'Silver'>('Gold');
  
  const [itemName, setItemName] = useState('');
  const [purity] = useState('22K');
  const [touch, setTouch] = useState(91.6);
  const [grossWeight, setGrossWeight] = useState(0);
  const [stoneWeight, setStoneWeight] = useState(0);
  const [rateApplied, setRateApplied] = useState(7245);

  const netWeight = grossWeight - stoneWeight;
  const calculatedValue = netWeight * rateApplied * (touch / 100);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (grossWeight <= 0 || !itemName) return toast.error('Enter valid details');
    
    addOldItem({
      id: Date.now().toString(),
      itemName, metal, purity, touch, grossWeight, stoneWeight, netWeight, rateApplied, calculatedValue
    });
    
    // reset form partially
    setItemName('');
    setGrossWeight(0);
    setStoneWeight(0);
  };

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <h2 className="text-primary font-bold uppercase tracking-wider text-sm flex justify-between items-center">
        <span>Old Metal Evaluation</span>
        <select value={metal} onChange={(e) => setMetal(e.target.value as any)} className="bg-background text-xs border border-gray-700 rounded px-2 py-1 outline-none text-textMain">
          <option value="Gold">Old Gold</option>
          <option value="Silver">Old Silver</option>
        </select>
      </h2>
      
      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
          <input required value={itemName} onChange={e=>setItemName(e.target.value)} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none" placeholder="e.g. Broken Chain" />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gross Wt (g)</label>
          <input required type="number" step="0.001" value={grossWeight || ''} onChange={e=>setGrossWeight(Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none font-mono" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stone Wt (g)</label>
          <input type="number" step="0.001" value={stoneWeight || ''} onChange={e=>setStoneWeight(Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none font-mono" />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Touch / Tanch %</label>
          <input required type="number" step="0.1" value={touch} onChange={e=>setTouch(Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none font-mono" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Live Rate (₹)</label>
          <input required type="number" value={rateApplied} onChange={e=>setRateApplied(Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-textMain focus:border-primary outline-none font-mono text-primary" />
        </div>
        
        <div className="col-span-2 mt-2 pt-3 border-t border-gray-800 flex justify-between items-center">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase">Valuation</div>
            <div className="text-xl font-bold font-mono text-green-400">₹ {calculatedValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
          </div>
          <button type="submit" className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/30 transition-colors flex items-center gap-2">
            <Plus size={16} /> Add to Exchange
          </button>
        </div>
      </form>
    </div>
  );
}
