import { useState } from 'react';
import { useExchangeStore } from '../../store/exchangeStore';
import { ScanLine, Plus } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function NewItemScanner() {
  const { addNewItem, newItems } = useExchangeStore();
  
  const [tab, setTab] = useState<'scan' | 'manual'>('scan');
  
  // Scan state
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [goldRate, setGoldRate] = useState(7245);
  const [silverRate, setSilverRate] = useState(85);

  // Manual state
  const [metal, setMetal] = useState<'Gold'|'Silver'>('Gold');
  const [itemName, setItemName] = useState('');
  const [touch, setTouch] = useState(91.6);
  const [grossWeight, setGrossWeight] = useState(0);
  const [stoneWeight, setStoneWeight] = useState(0);
  const [wastage, setWastage] = useState(0);
  const [rateApplied, setRateApplied] = useState(7245);
  const [makingChargeType, setMakingChargeType] = useState('per_gm');
  const [makingChargeValue, setMakingChargeValue] = useState(0);
  const [hallmark, setHallmark] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const code = manualCode.trim().toUpperCase();
    
    // Check if already in exchange
    if (newItems.some(item => item.itemCode === code)) {
      toast.error(`Item ${code} is already in the list`);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.get(`/stock/scan/${code}`);
      const item = res.data;

      if (item.status.toLowerCase() === 'sold') {
        toast.error(`Item ${code} is already sold!`);
        return;
      }

      const isGold = item.metal.toLowerCase() === 'gold';
      const metalRate = isGold ? goldRate : silverRate;
      
      const touchPurity = item.purity ? parseFloat(item.purity) : (isGold ? 91.6 : 65);
      const itemWastage = 0; // Usually stock items don't have predefined wastage
      const fineWeight = item.net_weight * (touchPurity / 100);

      const metalValue = fineWeight * metalRate;

      const makingAmount = item.making_type === 'flat' 
        ? item.making_charge 
        : (item.making_charge * item.net_weight);
      
      const itemHallmark = item.hallmark || 0;
      const itemOtherCharges = item.other_charges || 0;
      const itemDiscount = 0;
      
      const finalPrice = metalValue + makingAmount + itemHallmark + itemOtherCharges - itemDiscount;

      addNewItem({
        id: Math.random().toString(36).substring(7),
        stockItemId: item.id,
        itemCode: item.item_code,
        itemName: item.item_name,
        metal: item.metal,
        grossWeight: item.gross_weight || item.net_weight,
        stoneWeight: item.stone_weight || 0,
        netWeight: item.net_weight,
        touchPurity,
        wastage: itemWastage,
        fineWeight,
        rateApplied: metalRate,
        makingChargeType: item.making_type || 'flat',
        makingChargeRate: item.making_charge || 0,
        makingCharges: makingAmount,
        hallmark: itemHallmark,
        otherCharges: itemOtherCharges,
        discount: itemDiscount,
        finalPrice
      });

      toast.success(`Added: ${item.item_name}`);
      setManualCode('');

    } catch (e: any) {
      if (e.response?.status === 400) {
        toast.error(e.response.data.detail);
      } else if (e.response?.status === 404) {
        toast.error(`Item ${code} not found`);
      } else {
        toast.error('Failed to fetch item');
      }
    } finally {
      setLoading(false);
    }
  };

  const netWeight = grossWeight - stoneWeight;
  const fineWeight = netWeight * ((touch + wastage) / 100);
  const metalValue = fineWeight * rateApplied;
  
  let making = 0;
  if (makingChargeType === 'percent') making = metalValue * (makingChargeValue / 100);
  else if (makingChargeType === 'per_gm') making = netWeight * makingChargeValue;
  else making = makingChargeValue;

  const finalPrice = metalValue + making + hallmark + otherCharges - discount;

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (grossWeight <= 0 || !itemName) return toast.error('Enter valid details');

    addNewItem({
      id: Math.random().toString(36).substring(7),
      stockItemId: null,
      itemCode: 'MANUAL',
      itemName,
      metal,
      grossWeight,
      stoneWeight,
      netWeight,
      touchPurity: touch,
      wastage,
      fineWeight,
      rateApplied,
      makingChargeType,
      makingChargeRate: makingChargeValue,
      makingCharges: making,
      hallmark,
      otherCharges,
      discount,
      finalPrice
    });

    toast.success("Added manual item");
    setItemName('');
    setGrossWeight(0);
    setStoneWeight(0);
    setWastage(0);
    setMakingChargeValue(0);
    setHallmark(0);
    setOtherCharges(0);
    setDiscount(0);
  };

  const InputLabel = ({ label }: { label: string }) => (
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
  );

  return (
    <div className="bg-[#111115] border border-gray-800 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] h-full overflow-hidden">
      
      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
        <h2 className="text-primary font-bold uppercase tracking-wider text-sm">Purchase New Item</h2>
        <div className="flex bg-[#1A1A20] rounded border border-gray-800">
          <button onClick={() => setTab('scan')} className={`px-3 py-1 text-xs rounded-sm transition-colors ${tab === 'scan' ? 'bg-primary text-black font-bold' : 'text-gray-400'}`}>Scan</button>
          <button onClick={() => setTab('manual')} className={`px-3 py-1 text-xs rounded-sm transition-colors ${tab === 'manual' ? 'bg-primary text-black font-bold' : 'text-gray-400'}`}>Manual</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tab === 'scan' ? (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 items-center justify-center py-6 h-full">
            <div className="flex gap-4 w-full mb-2">
              <div className="flex-1">
                <InputLabel label="Gold Live Rate /g (₹)" />
                <input type="number" value={goldRate} onChange={e=>setGoldRate(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded p-2 text-sm text-primary font-bold focus:border-primary outline-none" />
              </div>
              <div className="flex-1">
                <InputLabel label="Silver Live Rate /g (₹)" />
                <input type="number" value={silverRate} onChange={e=>setSilverRate(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded p-2 text-sm text-primary font-bold focus:border-primary outline-none" />
              </div>
            </div>
            <ScanLine size={48} className="text-primary/30" />
            <p className="text-sm text-textMuted text-center">Scan barcode or enter code to add a new inventory item to this exchange.</p>
            
            <div className="flex w-full gap-2 mt-4">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="e.g. GLD-000001"
                className="flex-1 bg-[#1A1A20] border border-gray-700 rounded-lg px-4 py-2 text-center font-mono text-primary font-bold focus:border-primary outline-none"
              />
              <button type="submit" disabled={loading} className="bg-primary/20 border border-primary/50 hover:bg-primary/30 text-primary font-bold px-6 rounded-lg transition-colors">
                Add
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddManualItem} className="space-y-4">
            <div className="flex justify-between items-center bg-[#1A1A20] border border-gray-800 rounded p-1 mb-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => {setMetal('Gold'); setRateApplied(goldRate); setTouch(91.6)}} className={`px-4 py-1 text-xs rounded transition-colors ${metal === 'Gold' ? 'bg-primary text-black font-bold' : 'text-gray-400'}`}>Gold</button>
                <button type="button" onClick={() => {setMetal('Silver'); setRateApplied(silverRate); setTouch(65.0)}} className={`px-4 py-1 text-xs rounded transition-colors ${metal === 'Silver' ? 'bg-gray-400 text-black font-bold' : 'text-gray-500'}`}>Silver</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <InputLabel label="Item Name / Description" />
                <input required value={itemName} onChange={e=>setItemName(e.target.value)} className="w-full bg-[#1A1A20] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none transition-all placeholder-gray-600" placeholder={`e.g. ${metal} Ring`} />
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

            <div className="pt-2 border-t border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Making Charge Type</span>
                <div className="flex bg-[#1A1A20] rounded border border-gray-800">
                  {[{ label: '%', val: 'percent' }, { label: '₹/g', val: 'per_gm' }, { label: '₹ Flat', val: 'flat' }].map(t => (
                    <button key={t.val} type="button" onClick={() => setMakingChargeType(t.val)} className={`px-2 py-0.5 text-[10px] rounded-sm transition-colors ${makingChargeType === t.val ? 'bg-primary text-black font-bold' : 'text-gray-400'}`}>{t.label}</button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><InputLabel label="Making Value (+)" /><input type="number" value={makingChargeValue||''} onChange={e=>setMakingChargeValue(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none font-mono focus:border-primary" /></div>
                <div><InputLabel label="Total Making" /><input disabled value={`₹${making.toFixed(2)}`} className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-500 outline-none font-mono cursor-not-allowed" /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><InputLabel label="Hallmark (+)" /><input type="number" value={hallmark||''} onChange={e=>setHallmark(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none font-mono focus:border-primary" /></div>
                <div><InputLabel label="Other (+)" /><input type="number" value={otherCharges||''} onChange={e=>setOtherCharges(Number(e.target.value))} className="w-full bg-[#1A1A20] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none font-mono focus:border-primary" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><InputLabel label="Discount (-)" /><input type="number" value={discount||''} onChange={e=>setDiscount(Number(e.target.value))} className="w-full bg-red-950/20 border border-red-900/50 rounded px-3 py-2 text-sm text-red-400 outline-none font-mono focus:border-red-500" /></div>
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-gray-800 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Value</div>
                <div className="text-xl font-bold font-mono text-red-400">₹ {finalPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
              </div>
              <button type="submit" className="bg-primary/10 text-primary border border-primary/30 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors flex items-center gap-2">
                <Plus size={16} /> Add to Bill
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
