import { useState, useEffect } from 'react';
import { useExchangeStore } from '../../store/exchangeStore';
import { Plus, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OldItemsForm() {
  const { addOldItem, editingOldItem, updateOldItem, setEditingOldItem } = useExchangeStore();
  const [metal, setMetal] = useState<'Gold'|'Silver'>('Gold');
  
  const [itemName, setItemName] = useState('');
  const [purity, setPurity] = useState('22K');
  const [touch, setTouch] = useState(91.6);
  const [wastage, setWastage] = useState(0);
  const [grossWeight, setGrossWeight] = useState(0);
  const [stoneWeight, setStoneWeight] = useState(0);
  const [rateApplied, setRateApplied] = useState(7245);
  
  // Deductions & Additions
  const [labourCharge, setLabourCharge] = useState(0);
  const [testingMeltingCharge, setTestingMeltingCharge] = useState(0);
  const [hallmarkCharge, setHallmarkCharge] = useState(0);
  const [discount, setDiscount] = useState(0); // For buying old gold, discount might act as deduction
  const [otherCharges, setOtherCharges] = useState(0);

  useEffect(() => {
    if (editingOldItem) {
      setMetal(editingOldItem.metal as 'Gold'|'Silver');
      setItemName(editingOldItem.itemName);
      setPurity(editingOldItem.purity);
      setTouch(editingOldItem.touch);
      setWastage(editingOldItem.wastage || 0);
      setGrossWeight(editingOldItem.grossWeight);
      setStoneWeight(editingOldItem.stoneWeight);
      setRateApplied(editingOldItem.rateApplied);
      setLabourCharge(editingOldItem.labourCharge || 0);
      setTestingMeltingCharge(editingOldItem.testingMeltingCharge || 0);
      setHallmarkCharge(editingOldItem.hallmarkCharge || 0);
      setDiscount(editingOldItem.discount || 0);
      setOtherCharges(editingOldItem.otherCharges || 0);
    }
  }, [editingOldItem]);

  const netWeight = grossWeight - stoneWeight;
  const fineWeight = netWeight * ((touch + wastage) / 100);
  const metalValue = fineWeight * rateApplied;
  
  const calculatedValue = metalValue - labourCharge - testingMeltingCharge - hallmarkCharge - discount + otherCharges;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (grossWeight <= 0 || !itemName) return toast.error('Enter valid details');
    
    const itemData = {
      id: editingOldItem ? editingOldItem.id : Date.now().toString(),
      itemName, metal, purity, touch, grossWeight, stoneWeight, netWeight, 
      wastage, fineWeight,
      labourCharge, testingMeltingCharge, hallmarkCharge, otherCharges, discount,
      rateApplied, calculatedValue
    };

    if (editingOldItem) {
      updateOldItem(editingOldItem.id, itemData);
      toast.success("Old item updated");
    } else {
      addOldItem(itemData);
      toast.success("Old item added");
    }
    
    // reset form partially
    setItemName('');
    setGrossWeight(0);
    setStoneWeight(0);
    setWastage(0);
    setLabourCharge(0);
    setTestingMeltingCharge(0);
    setHallmarkCharge(0);
    setDiscount(0);
    setOtherCharges(0);
    setEditingOldItem(null);
  };

  const handleCancelEdit = () => {
    setEditingOldItem(null);
    setItemName('');
    setGrossWeight(0);
    setStoneWeight(0);
  };

  const InputLabel = ({ label }: { label: string }) => (
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
  );

  return (
    <div className="bg-[#111115] border border-gray-800 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <h2 className="text-primary font-bold uppercase tracking-wider text-sm flex justify-between items-center border-b border-gray-800 pb-2">
        <span>Old Metal Evaluation</span>
        <select value={metal} onChange={(e) => setMetal(e.target.value as any)} className="bg-[#1A1A20] text-xs border border-gray-700 rounded px-2 py-1 outline-none text-white focus:border-primary">
          <option value="Gold">Old Gold</option>
          <option value="Silver">Old Silver</option>
        </select>
      </h2>
      
      <form onSubmit={handleAdd} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <InputLabel label="Item Name / Description" />
            <input required value={itemName} onChange={e=>setItemName(e.target.value)} className="w-full bg-[#1A1A20] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none transition-all placeholder-gray-600" placeholder="e.g. Broken Chain" />
          </div>
          
          <div>
            <InputLabel label="Gross Wt (g)" />
            <input required type="number" step="0.001" value={grossWeight || ''} onChange={e=>setGrossWeight(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none font-mono" />
          </div>
          <div>
            <InputLabel label="Stone Wt (g)" />
            <input type="number" step="0.001" value={stoneWeight || ''} onChange={e=>setStoneWeight(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <InputLabel label="Touch %" />
            <input required type="number" step="0.1" value={touch} onChange={e=>setTouch(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-primary focus:border-primary outline-none font-mono" />
          </div>
          <div>
            <InputLabel label="Wastage %" />
            <input required type="number" step="0.1" value={wastage || ''} onChange={e=>setWastage(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-primary focus:border-primary outline-none font-mono" />
          </div>
          <div>
            <InputLabel label="Fine Wt (g)" />
            <input disabled value={fineWeight.toFixed(3)} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-primary/70 outline-none font-mono cursor-not-allowed" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel label="Live Rate (₹/g)" />
            <input required type="number" value={rateApplied} onChange={e=>setRateApplied(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none font-mono" />
          </div>
          <div>
            <InputLabel label="Metal Value" />
            <input disabled value={`₹${metalValue.toFixed(2)}`} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-500 outline-none font-mono cursor-not-allowed" />
          </div>
        </div>

        {/* Deductions & Additions */}
        <div className="pt-2 border-t border-gray-800/50">
          <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Deductions (-)</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><InputLabel label="Labour (-)" /><input type="number" value={labourCharge||''} onChange={e=>setLabourCharge(Number(e.target.value))} className="w-full bg-red-950/10 border border-red-900/30 rounded px-3 py-2 text-sm text-red-400 outline-none font-mono focus:border-red-500" /></div>
            <div><InputLabel label="Testing (-)" /><input type="number" value={testingMeltingCharge||''} onChange={e=>setTestingMeltingCharge(Number(e.target.value))} className="w-full bg-red-950/10 border border-red-900/30 rounded px-3 py-2 text-sm text-red-400 outline-none font-mono focus:border-red-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div><InputLabel label="Hallmark (-)" /><input type="number" value={hallmarkCharge||''} onChange={e=>setHallmarkCharge(Number(e.target.value))} className="w-full bg-red-950/10 border border-red-900/30 rounded px-3 py-2 text-sm text-red-400 outline-none font-mono focus:border-red-500" /></div>
             <div><InputLabel label="Discount (-)" /><input type="number" value={discount||''} onChange={e=>setDiscount(Number(e.target.value))} className="w-full bg-red-950/10 border border-red-900/30 rounded px-3 py-2 text-sm text-red-400 outline-none font-mono focus:border-red-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
             <div><InputLabel label="Other (+)" /><input type="number" value={otherCharges||''} onChange={e=>setOtherCharges(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none font-mono" /></div>
          </div>
        </div>
        
        <div className="mt-2 pt-4 border-t border-gray-800 flex justify-between items-center">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Exchange Value</div>
            <div className="text-xl font-bold font-mono text-primary">₹ {calculatedValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
          </div>
          <div className="flex gap-2">
            {editingOldItem && (
              <button type="button" onClick={handleCancelEdit} className="bg-gray-800 text-gray-300 border border-gray-700 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-700 transition-colors flex items-center gap-2">
                <X size={16} /> Cancel
              </button>
            )}
            <button type="submit" className="bg-primary/10 text-primary border border-primary/30 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors flex items-center gap-2">
              {editingOldItem ? <Edit2 size={16} /> : <Plus size={16} />} 
              {editingOldItem ? 'Update Item' : 'Add to Exchange'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
