import { useBillingStore } from '../../store/billingStore';
import { Calculator, Save, Printer, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import CheckoutModal from './CheckoutModal';
import LiveRatesModal from './LiveRatesModal';

export default function LiveBillSummary() {
  const { cart, gstState, clearCart, liveRates, globalDiscount, setGlobalDiscount } = useBillingStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  
  // To hold the prepared payload for CheckoutModal
  const [checkoutPayload, setCheckoutPayload] = useState<any>(null);

  const totalGross = cart.reduce((sum, item) => sum + item.grossWeight, 0);
  const totalStone = cart.reduce((sum, item) => sum + item.stoneWeight, 0);
  const totalNet = cart.reduce((sum, item) => sum + item.netWeight, 0);
  const totalMetal = cart.reduce((sum, item) => sum + item.metalValue, 0);
  const totalMaking = cart.reduce((sum, item) => sum + item.makingAmount, 0);
  const totalHallmark = cart.reduce((sum, item) => sum + item.hallmark, 0);
  const totalOther = cart.reduce((sum, item) => sum + item.otherCharges, 0);
  const totalItemDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalDiscount = totalItemDiscount + globalDiscount;
  
  const baseTaxableAmount = cart.reduce((sum, item) => sum + item.taxableAmount, 0);
  const taxableAmount = Math.max(0, baseTaxableAmount - globalDiscount);
  
  let cgst = 0, sgst = 0, igst = 0;
  if (gstState === 'same_state') {
    cgst = taxableAmount * 0.015;
    sgst = taxableAmount * 0.015;
  } else if (gstState === 'different_state') {
    igst = taxableAmount * 0.03;
  }

  const exactTotal = taxableAmount + cgst + sgst + igst;
  const grandTotal = Math.round(exactTotal);
  const roundOff = grandTotal - exactTotal;

  const equivalentGold = liveRates.gold24k > 0 ? grandTotal / liveRates.gold24k : 0;
  const equivalentSilver = liveRates.silver > 0 ? grandTotal / (liveRates.silver / 10) : 0;

  const handleGenerate = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    const payload = {
      // customer_id and amount_paid will be added by CheckoutModal
      subtotal: baseTaxableAmount,
      tax_amount: cgst + sgst + igst,
      discount_amount: globalDiscount,
      grand_total: grandTotal,
      items: cart.map(item => ({
        stock_item_id: item.stockItemId || null,
        item_name: item.itemName,
        item_type: item.itemType,
        final_price: item.taxableAmount,
        gold_calculation: item.itemType === 'Gold' ? {
          metal_rate_id: null,
          applied_rate: item.rateDisplay,
          gross_weight: item.grossWeight,
          stone_weight: item.stoneWeight,
          net_weight: item.netWeight,
          making_charge_type: item.rawGold?.makingChargeType || 'flat',
          making_charge_rate: item.rawGold?.makingChargeValue || 0,
          making_charges_amount: item.makingAmount,
          hallmark_charges: item.hallmark,
          total_gold_value: item.metalValue
        } : null,
        silver_calculation: item.itemType === 'Silver' ? {
          metal_rate_id: null,
          applied_rate: item.rateDisplay,
          gross_weight: item.grossWeight,
          net_weight: item.netWeight,
          making_charge_type: item.rawSilver?.makingChargeType || 'flat',
          making_charge_rate: item.rawSilver?.makingChargeValue || 0,
          making_charges_amount: item.makingAmount,
          total_silver_value: item.metalValue
        } : null
      }))
    };

    setCheckoutPayload(payload);
    setShowCheckout(true);
  };

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-4 flex flex-col h-[550px] shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
      
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h3 className="font-bold text-sm tracking-widest uppercase">Bill Summary</h3>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowRatesModal(true)} className="text-primary hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <span className="text-xs text-textMuted bg-gray-900 px-2 py-1 rounded">{cart.length} Items</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 text-xs custom-scrollbar overflow-y-auto pr-2">
        <div className="flex justify-between"><span className="text-textMuted">Gross Wt</span><span className="font-mono">{totalGross.toFixed(3)}g</span></div>
        <div className="flex justify-between"><span className="text-textMuted">Stone Wt</span><span className="font-mono">{totalStone.toFixed(3)}g</span></div>
        <div className="flex justify-between text-white font-medium"><span className="text-textMuted">Net Wt</span><span className="font-mono">{totalNet.toFixed(3)}g</span></div>
        <div className="h-px bg-gray-800 my-1"></div>
        <div className="flex justify-between"><span className="text-textMuted">Metal Value</span><span className="font-mono">₹{totalMetal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-textMuted">Making Total</span><span className="font-mono">₹{totalMaking.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-textMuted">Hallmark</span><span className="font-mono">₹{totalHallmark.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-textMuted">Other Chg</span><span className="font-mono">₹{totalOther.toFixed(2)}</span></div>
        <div className="flex justify-between items-center text-red-400 mt-1">
          <span className="">Bill Discount</span>
          <div className="flex items-center">
            <span className="mr-1">- ₹</span>
            <input 
              type="number" 
              className="bg-gray-900 border border-red-900/50 rounded w-20 text-right px-1 font-mono text-red-400 outline-none focus:border-red-500"
              value={globalDiscount === 0 ? '' : globalDiscount}
              onChange={e => setGlobalDiscount(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center py-2 bg-gray-900/50 rounded px-2 border border-gray-800 my-2">
          <span className="text-primary font-bold">Taxable Amount</span>
          <span className="font-mono font-bold">₹{taxableAmount.toFixed(2)}</span>
        </div>

        <div className="space-y-1 pl-2 border-l-2 border-gray-800">
          <label className="flex items-center space-x-2 cursor-pointer mb-2">
            <input type="radio" checked={gstState === 'same_state'} onChange={() => useBillingStore.getState().setGstState('same_state')} className="text-primary accent-primary w-3 h-3" />
            <span className="text-textMuted">Same State (3%)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer mb-2">
            <input type="radio" checked={gstState === 'different_state'} onChange={() => useBillingStore.getState().setGstState('different_state')} className="text-primary accent-primary w-3 h-3" />
            <span className="text-textMuted">Interstate (3%)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer mb-2">
            <input type="radio" checked={gstState === 'none'} onChange={() => useBillingStore.getState().setGstState('none')} className="text-primary accent-primary w-3 h-3" />
            <span className="text-textMuted">Without GST (0%)</span>
          </label>
          
          {gstState === 'same_state' ? (
            <>
              <div className="flex justify-between"><span className="text-gray-500">CGST 1.5%</span><span className="font-mono">₹{cgst.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">SGST 1.5%</span><span className="font-mono">₹{sgst.toFixed(2)}</span></div>
            </>
          ) : gstState === 'different_state' ? (
            <div className="flex justify-between"><span className="text-gray-500">IGST 3%</span><span className="font-mono">₹{igst.toFixed(2)}</span></div>
          ) : (
            <div className="flex justify-between"><span className="text-gray-500">GST 0%</span><span className="font-mono">₹0.00</span></div>
          )}
        </div>
        
        <div className="flex justify-between text-gray-500"><span className="">Round Off</span><span className="font-mono">{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span></div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="bg-[#052e16] border border-[#166534] rounded flex justify-between items-center px-3 py-2 mb-2 shadow-[0_0_10px_rgba(22,101,52,0.3)]">
          <span className="text-green-500 font-bold tracking-widest text-xs uppercase">Grand Total</span>
          <span className="text-2xl font-black text-green-400 tracking-tighter">₹ {grandTotal.toLocaleString()}</span>
        </div>

        {grandTotal > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#1a1500] border border-[#4d3d00] rounded p-2 flex justify-between items-center">
              <span className="text-yellow-600/80 font-bold text-[9px] uppercase tracking-wider">Or Gold (24K)</span>
              <span className="text-yellow-500 font-mono font-bold text-sm">{equivalentGold.toFixed(3)}g</span>
            </div>
            <div className="bg-[#0a1128] border border-[#1a2d66] rounded p-2 flex justify-between items-center">
              <span className="text-blue-500/80 font-bold text-[9px] uppercase tracking-wider">Or Silver (Fine)</span>
              <span className="text-blue-400 font-mono font-bold text-sm">{equivalentSilver.toFixed(3)}g</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button className="flex items-center justify-center space-x-1 bg-background border border-gray-700 hover:border-gray-500 py-2 rounded transition-colors"><Save size={14}/> <span>Draft</span></button>
          <button className="flex items-center justify-center space-x-1 bg-background border border-gray-700 hover:border-gray-500 py-2 rounded transition-colors"><Printer size={14}/> <span>Print</span></button>
          <button className="flex items-center justify-center space-x-1 bg-green-900/30 border border-green-800 text-green-400 hover:bg-green-800/50 py-2 rounded transition-colors col-span-2"><Smartphone size={14}/> <span>WhatsApp / SMS</span></button>
          <button onClick={handleGenerate} className="col-span-2 flex items-center justify-center space-x-1 bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-50">
            <Calculator size={16} />
            <span>GENERATE BILL (F7)</span>
          </button>
        </div>
      </div>
      
      {showCheckout && checkoutPayload && (
        <CheckoutModal 
          payload={checkoutPayload}
          grandTotal={grandTotal}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            setCheckoutPayload(null);
            clearCart();
            useBillingStore.getState().setSelectedCustomerId(null);
            // We can optionally show the print dialog here or navigate
          }}
        />
      )}

      {showRatesModal && (
        <LiveRatesModal onClose={() => setShowRatesModal(false)} />
      )}
    </div>
  );
}
