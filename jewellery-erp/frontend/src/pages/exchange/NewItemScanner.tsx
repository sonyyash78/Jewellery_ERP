import { useState } from 'react';
import { useExchangeStore } from '../../store/exchangeStore';
import { ScanLine } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function NewItemScanner() {
  const { addNewItem, newItems } = useExchangeStore();
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);

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
      const metalRate = isGold ? 7245 : 90000;
      
      let metalValue = 0;
      if (isGold) {
        metalValue = item.net_weight * metalRate;
      } else {
        metalValue = (item.net_weight / 1000) * metalRate;
      }

      const makingAmount = item.making_type === 'flat' 
        ? item.making_charge 
        : (item.making_charge * item.net_weight);
      
      const hallmark = item.hallmark || 0;
      const otherCharges = item.other_charges || 0;
      
      const finalPrice = metalValue + makingAmount + hallmark + otherCharges;

      addNewItem({
        stockItemId: item.id,
        itemCode: item.item_code,
        itemName: item.item_name,
        metal: item.metal,
        netWeight: item.net_weight,
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
