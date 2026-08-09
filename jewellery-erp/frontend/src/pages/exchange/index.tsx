import { useState, useEffect } from 'react';
import OldItemsForm from './OldItemsForm';
import NewItemScanner from './NewItemScanner';
import { useExchangeStore } from '../../store/exchangeStore';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Trash2, Edit2 } from 'lucide-react';
import ExchangeCheckoutModal from './ExchangeCheckoutModal';

export default function ExchangeModule() {
  const { oldItems, newItems, gstState, setGstState, removeOldItem, removeNewItem, customerId, setCustomerId, clearExchange, setEditingOldItem } = useExchangeStore();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const totalOldValue = oldItems.reduce((acc, i) => acc + i.calculatedValue, 0);
  const totalNewValue = newItems.reduce((acc, i) => acc + i.finalPrice, 0);
  
  // Tax calculation on New Value
  let gstAmount = 0;
  if (gstState !== 'none') {
    gstAmount = totalNewValue * 0.03; // 3% GST standard on jewellery
  }
  const grandTotal = totalNewValue + gstAmount;
  
  // Difference = What customer pays - what we owe them
  const differenceAmount = grandTotal - totalOldValue;

  useEffect(() => {
    axiosClient.get('/customers/').then(res => setCustomers(res.data.items)).catch();
  }, []);

  const handleProcessExchange = () => {
    // if (!customerId) return toast.error("Select a customer"); // We'll let the modal handle it or require it there
    if (oldItems.length === 0 && newItems.length === 0) return toast.error("No items in exchange");
    setShowCheckout(true);
  };

  const getPayload = () => {
    return {
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
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 overflow-hidden">
      
      {/* Top Bar Customer Select */}
      <div className="bg-surface border border-gray-800 rounded-xl p-4 shadow-lg flex justify-between items-center z-10 shrink-0">
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

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Column: Calculators */}
        <div className="flex-[3] flex gap-4 overflow-y-auto custom-scrollbar">
          <div className="flex-1"><OldItemsForm /></div>
          <div className="flex-1"><NewItemScanner /></div>
        </div>

        {/* Right Column: Receipt Summary */}
        <div className="flex-[2] bg-surface border border-primary/30 rounded-xl shadow-lg flex flex-col overflow-hidden">
          <div className="bg-background border-b border-gray-800 p-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              Exchange Summary
            </h2>
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">ITEMS: {oldItems.length + newItems.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {oldItems.length === 0 && newItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-textMuted text-sm italic">No items added yet</div>
            ) : (
              <>
                {oldItems.map(item => (
                  <div key={`old-${item.id}`} className="bg-background border border-gray-800 rounded p-3 relative group">
                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingOldItem(item)} className="text-gray-600 hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => removeOldItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-12">
                      <div>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded mr-2 bg-green-500/20 text-green-400">OLD (IN)</span>
                        <span className="text-sm text-textMain font-medium">{item.itemName}</span>
                      </div>
                      <span className="text-sm font-mono text-green-400">- ₹{item.calculatedValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-textMuted">
                      <div className="flex justify-between"><span>Net Wt:</span><span className="font-mono">{item.netWeight}g</span></div>
                      <div className="flex justify-between"><span>Tanch:</span><span className="font-mono">{item.touch}%</span></div>
                      <div className="flex justify-between"><span>Fine:</span><span className="font-mono text-primary">{item.fineWeight.toFixed(3)}g</span></div>
                      <div className="flex justify-between"><span>Rate:</span><span className="font-mono">₹{item.rateApplied}</span></div>
                    </div>
                  </div>
                ))}
                
                {newItems.map(item => (
                  <div key={`new-${item.id}`} className="bg-background border border-gray-800 rounded p-3 relative group">
                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removeNewItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-12">
                      <div>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded mr-2 bg-primary/20 text-primary">NEW (OUT)</span>
                        <span className="text-sm text-textMain font-medium">{item.itemName}</span>
                      </div>
                      <span className="text-sm font-mono text-red-400">+ ₹{item.finalPrice.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-textMuted">
                      <div className="flex justify-between"><span>Net Wt:</span><span className="font-mono">{item.netWeight}g</span></div>
                      <div className="flex justify-between"><span>Making:</span><span className="font-mono">₹{item.makingCharges.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Other:</span><span className="font-mono">₹{(item.hallmark + item.otherCharges).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Rate:</span><span className="font-mono">₹{item.rateApplied}</span></div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="bg-background border-t border-gray-800 p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-textMuted">GST Type</span>
              <div className="flex gap-2">
                <button onClick={() => setGstState('same_state')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${gstState === 'same_state' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'}`}>Same State</button>
                <button onClick={() => setGstState('different_state')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${gstState === 'different_state' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'}`}>Interstate</button>
                <button onClick={() => setGstState('none')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${gstState === 'none' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'}`}>No GST</button>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm text-textMuted"><span>Total New Value</span><span className="font-mono">₹{totalNewValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
              <div className="flex justify-between text-sm text-textMuted"><span>GST ({gstState === 'none' ? '0%' : '3%'})</span><span className="font-mono">₹{gstAmount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
              <div className="flex justify-between text-sm text-textMain font-bold"><span>Grand Total (Bill)</span><span className="font-mono">₹{grandTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
              <div className="flex justify-between text-sm text-green-400"><span>Old Items Trade-In</span><span className="font-mono">- ₹{totalOldValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
              
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-800 mt-2 items-center">
                <span className="text-sm uppercase text-gray-400 font-bold">{differenceAmount > 0 ? 'Customer Pays' : differenceAmount < 0 ? 'You Pay' : 'Settled'}</span>
                <span className={`font-mono ${differenceAmount > 0 ? 'text-primary' : 'text-green-400'}`}>₹{Math.abs(differenceAmount).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
              </div>
            </div>

            <button 
              disabled={oldItems.length === 0 && newItems.length === 0}
              onClick={handleProcessExchange}
              className="bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded w-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Process Exchange
            </button>
          </div>
        </div>
      </div>
      
      {showCheckout && (
        <ExchangeCheckoutModal 
          payload={getPayload()}
          differenceAmount={differenceAmount}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            clearExchange();
          }}
        />
      )}
    </div>
  );
}
