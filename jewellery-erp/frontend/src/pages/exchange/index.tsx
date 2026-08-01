import { useState, useEffect } from 'react';
import OldItemsForm from './OldItemsForm';
import NewItemScanner from './NewItemScanner';
import { useExchangeStore } from '../../store/exchangeStore';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export default function ExchangeModule() {
  const { oldItems, newItems, removeOldItem, removeNewItem, customerId, setCustomerId, clearExchange } = useExchangeStore();
  
  const [customers, setCustomers] = useState<any[]>([]);
  
  const totalOldValue = oldItems.reduce((acc, i) => acc + i.calculatedValue, 0);
  const totalNewValue = newItems.reduce((acc, i) => acc + i.finalPrice, 0);
  
  // Tax calculation on New Value
  const gstAmount = totalNewValue * 0.03; // 3% GST standard on jewellery
  const grandTotal = totalNewValue + gstAmount;
  
  // Difference = What customer pays - what we owe them
  const differenceAmount = grandTotal - totalOldValue;

  useEffect(() => {
    axiosClient.get('/customers/').then(res => setCustomers(res.data.items)).catch();
  }, []);

  const handleProcessExchange = async () => {
    if (!customerId) return toast.error("Select a customer");
    if (oldItems.length === 0 && newItems.length === 0) return toast.error("No items in exchange");
    
    try {
      const payload = {
        customer_id: customerId,
        total_old_value: totalOldValue,
        total_new_value: totalNewValue,
        gst_amount: gstAmount,
        grand_total: grandTotal,
        difference_amount: differenceAmount,
        old_items: oldItems.map(i => ({
          item_name: i.itemName, metal: i.metal, purity: i.purity, touch: i.touch,
          gross_weight: i.grossWeight, stone_weight: i.stoneWeight, net_weight: i.netWeight,
          rate_applied: i.rateApplied, calculated_value: i.calculatedValue
        })),
        new_items: newItems.map(i => ({
          stock_item_id: i.stockItemId, item_name: i.itemName, metal: i.metal,
          net_weight: i.netWeight, final_price: i.finalPrice
        }))
      };

      await axiosClient.post('/exchanges/', payload);
      toast.success("Exchange Processed Successfully");
      clearExchange();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to process exchange");
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 overflow-hidden">
      
      {/* Top Bar Customer Select */}
      <div className="bg-surface border border-gray-800 rounded-xl p-4 shadow-lg flex justify-between items-center z-10">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mr-3">Customer</label>
          <select 
            value={customerId || ''} 
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="bg-background border border-gray-700 rounded px-4 py-2 outline-none text-textMain min-w-[250px]"
          >
            <option value="">-- Select Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ''} ({c.phone_number})</option>
            ))}
          </select>
        </div>
        <div className="text-primary font-bold tracking-widest uppercase">Exchange Module</div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Column - Old Items Intake */}
        <div className="flex-[5] flex flex-col gap-4 overflow-hidden">
          <OldItemsForm />
          
          <div className="flex-1 bg-surface border border-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-800 bg-black/40"><h3 className="font-bold text-sm uppercase text-gray-400">Old Items Traded In</h3></div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-textMuted">
                <thead className="bg-background sticky top-0 border-b border-gray-800 text-xs">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Net Wt</th>
                    <th className="py-2 px-3">Tanch</th>
                    <th className="py-2 px-3">Rate</th>
                    <th className="py-2 px-3 text-right text-green-400">Value (₹)</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {oldItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-800/30">
                      <td className="py-2 px-3 font-bold text-textMain">{item.itemName}</td>
                      <td className="py-2 px-3">{item.netWeight}g</td>
                      <td className="py-2 px-3">{item.touch}%</td>
                      <td className="py-2 px-3">₹ {item.rateApplied}</td>
                      <td className="py-2 px-3 text-right font-mono text-green-400">{item.calculatedValue.toLocaleString(undefined, {maximumFractionDigits:2})}</td>
                      <td className="py-2 px-3 text-right">
                        <button onClick={() => removeOldItem(item.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {oldItems.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-xs italic">No old items</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-gray-800 bg-black/40 flex justify-between font-bold text-green-400">
              <span>Total Old Value</span>
              <span>₹ {totalOldValue.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
            </div>
          </div>
        </div>

        {/* Middle Column - New Items Purchase */}
        <div className="flex-[4] flex flex-col gap-4 overflow-hidden">
          <NewItemScanner />
          
          <div className="flex-1 bg-surface border border-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-800 bg-black/40"><h3 className="font-bold text-sm uppercase text-gray-400">New Items Purchased</h3></div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-textMuted">
                <thead className="bg-background sticky top-0 border-b border-gray-800 text-xs">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Net Wt</th>
                    <th className="py-2 px-3">Rate</th>
                    <th className="py-2 px-3">Making</th>
                    <th className="py-2 px-3">Other</th>
                    <th className="py-2 px-3 text-right text-red-400">Total (₹)</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {newItems.map(item => (
                    <tr key={item.stockItemId} className="hover:bg-gray-800/30 text-[11px]">
                      <td className="py-2 px-3 font-bold text-textMain">{item.itemName}</td>
                      <td className="py-2 px-3">{item.netWeight}g</td>
                      <td className="py-2 px-3">₹ {item.rateApplied}</td>
                      <td className="py-2 px-3">₹ {item.makingCharges.toLocaleString()}</td>
                      <td className="py-2 px-3">₹ {(item.hallmark + item.otherCharges).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-red-400 text-sm font-bold">{item.finalPrice.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">
                        <button onClick={() => removeNewItem(item.stockItemId)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {newItems.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-xs italic">No new items</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-gray-800 bg-black/40 flex justify-between font-bold text-red-400">
              <span>Total New Price (Ex. Tax)</span>
              <span>₹ {totalNewValue.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Final Settlement */}
        <div className="flex-[3] bg-surface border border-gray-800 rounded-xl shadow-lg p-6 flex flex-col z-0">
          <h2 className="text-primary font-bold uppercase tracking-widest mb-6 pb-4 border-b border-gray-800">Final Settlement</h2>
          
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 font-bold uppercase">Total New Value</span>
              <span className="font-mono text-red-400">₹ {totalNewValue.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 font-bold uppercase">GST (3%)</span>
              <span className="font-mono text-red-400">₹ {gstAmount.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
              <span className="text-white font-bold uppercase">Grand Total (Bill)</span>
              <span className="font-mono text-red-400 font-bold text-lg">₹ {grandTotal.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
            </div>

            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800 text-sm">
              <span className="text-gray-400 font-bold uppercase">Old Items Trade-In</span>
              <span className="font-mono text-green-400 font-bold text-lg">- ₹ {totalOldValue.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-gray-800">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Net Amount Payable</div>
            <div className={`text-4xl font-bold font-mono text-center mb-6 ${differenceAmount > 0 ? 'text-primary' : 'text-green-400'}`}>
              ₹ {Math.abs(differenceAmount).toLocaleString(undefined, {maximumFractionDigits:0})}
            </div>
            <div className="text-center text-xs text-gray-400 mb-6 font-bold uppercase">
              {differenceAmount > 0 ? 'Customer Pays You' : differenceAmount < 0 ? 'You Pay Customer (or Credit)' : 'Settled Even'}
            </div>
            
            <button 
              onClick={handleProcessExchange}
              className="w-full bg-primary hover:bg-primary-dark text-black font-bold uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            >
              Process Exchange
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
