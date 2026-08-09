import { useState } from 'react';
import { useExchangeStore } from '../../store/exchangeStore';
import { ScanLine } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function NewItemScanner() {
  const { addNewItem, newItems } = useExchangeStore();
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [goldRate, setGoldRate] = useState(7245);
  const [silverRate, setSilverRate] = useState(85);

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
      const wastage = 0; // Usually stock items don't have predefined wastage
      const fineWeight = item.net_weight * (touchPurity / 100);

      const metalValue = fineWeight * metalRate;

      const makingAmount = item.making_type === 'flat' 
        ? item.making_charge 
        : (item.making_charge * item.net_weight);
      
      const hallmark = item.hallmark || 0;
      const otherCharges = item.other_charges || 0;
      const discount = 0;
      
      const finalPrice = metalValue + makingAmount + hallmark + otherCharges - discount;

      addNewItem({
        stockItemId: item.id,
        itemCode: item.item_code,
        itemName: item.item_name,
        metal: item.metal,
        grossWeight: item.gross_weight || item.net_weight,
        stoneWeight: item.stone_weight || 0,
        netWeight: item.net_weight,
        touchPurity,
        wastage,
        fineWeight,
        rateApplied: metalRate,
        makingChargeType: item.making_type || 'flat',
        makingChargeRate: item.making_charge || 0,
        makingCharges: makingAmount,
        hallmark,
        otherCharges,
        discount,
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

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <h2 className="text-primary font-bold uppercase tracking-wider text-sm">Purchase New Item</h2>
      
      <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 items-center justify-center py-6">
        <div className="flex gap-4 w-full mb-2">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gold Live Rate /g (₹)</label>
            <input type="number" value={goldRate} onChange={e=>setGoldRate(Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-primary font-bold focus:border-primary outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Silver Live Rate /g (₹)</label>
            <input type="number" value={silverRate} onChange={e=>setSilverRate(Number(e.target.value))} className="w-full bg-background border border-gray-700 rounded p-2 text-sm text-primary font-bold focus:border-primary outline-none" />
          </div>
        </div>
        <ScanLine size={48} className="text-primary/30" />
        <p className="text-sm text-textMuted text-center">Scan barcode or enter code to add a new inventory item to this exchange.</p>
        
        <div className="flex w-full max-w-[300px] gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="e.g. GLD-000001"
            className="flex-1 bg-background border border-gray-700 rounded-lg px-4 py-2 text-center font-mono text-primary font-bold focus:border-primary outline-none"
          />
          <button type="submit" disabled={loading} className="bg-primary hover:bg-primary-dark text-black font-bold px-4 rounded-lg transition-colors">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
