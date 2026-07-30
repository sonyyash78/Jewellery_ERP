import { useState } from 'react';
import PurchaseGold from './PurchaseGold';
import PurchaseSilver from './PurchaseSilver';
import { usePurchaseStore } from '../../store/purchaseStore';
import { Save, Printer, Trash2, FileText, User } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function Purchase() {
  const { items, gstState, setGstState, removeItem, clearCart } = usePurchaseStore();
  const [loading, setLoading] = useState(false);

  // Seller Details State
  const [seller, setSeller] = useState({ name: '', mobile: '', aadhaar_pan: '', address: '' });

  const totalTaxable = items.reduce((sum, item) => sum + item.taxableAmount, 0);
  
  let cgst = 0, sgst = 0, igst = 0;
  if (gstState === 'same_state') {
    cgst = totalTaxable * 0.015;
    sgst = totalTaxable * 0.015;
  } else {
    igst = totalTaxable * 0.03;
  }
  
  const grandTotal = totalTaxable + cgst + sgst + igst;

  const handleSavePurchase = async () => {
    if (items.length === 0) return toast.error("No items in purchase receipt");
    if (!seller.name || !seller.mobile) return toast.error("Seller Name & Mobile are required");

    setLoading(true);
    try {
      const payload = {
        seller: {
          name: seller.name,
          mobile: seller.mobile,
          aadhaar_pan: seller.aadhaar_pan,
          address: seller.address
        },
        total_taxable: totalTaxable,
        cgst,
        sgst,
        igst,
        grand_total: grandTotal,
        status: 'Completed',
        items: items.map(i => ({
          metal_type: i.metalType,
          item_name: i.itemName,
          category: i.category,
          gross_weight: i.grossWeight,
          stone_weight: i.stoneWeight,
          net_weight: i.netWeight,
          touch_purity: i.touchPurity,
          wastage: i.wastage,
          fine_weight: i.fineWeight,
          metal_rate: i.metalRate,
          metal_value: i.metalValue,
          labour_charge: i.labourCharge,
          testing_melting_charge: i.testingMeltingCharge,
          hallmark_charge: i.hallmarkCharge,
          other_charges: i.otherCharges,
          discount: i.discount,
          taxable_amount: i.taxableAmount
        }))
      };

      const res = await axiosClient.post('/purchases/', payload);
      toast.success(`Purchase ${res.data.purchase_number} saved successfully!`);
      clearCart();
      setSeller({ name: '', mobile: '', aadhaar_pan: '', address: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to save purchase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
      
      {/* Top Bar - Seller Details */}
      <div className="mb-4 bg-surface border border-gray-800 rounded-xl p-3 shadow-lg flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
            <User size={18} className="text-primary" />
            <span className="text-sm font-bold text-textMain tracking-wide uppercase">Seller Info</span>
        </div>
        <input 
          placeholder="Seller Name *" 
          value={seller.name} onChange={e=>setSeller({...seller, name: e.target.value})}
          className="bg-background border border-gray-700 rounded px-3 py-1.5 text-sm text-textMain focus:border-primary outline-none" 
        />
        <input 
          placeholder="Mobile Number *" 
          value={seller.mobile} onChange={e=>setSeller({...seller, mobile: e.target.value})}
          className="bg-background border border-gray-700 rounded px-3 py-1.5 text-sm text-textMain focus:border-primary outline-none" 
        />
        <input 
          placeholder="Aadhaar / PAN" 
          value={seller.aadhaar_pan} onChange={e=>setSeller({...seller, aadhaar_pan: e.target.value})}
          className="bg-background border border-gray-700 rounded px-3 py-1.5 text-sm text-textMain focus:border-primary outline-none" 
        />
        <input 
          placeholder="Address (City)" 
          value={seller.address} onChange={e=>setSeller({...seller, address: e.target.value})}
          className="flex-1 bg-background border border-gray-700 rounded px-3 py-1.5 text-sm text-textMain focus:border-primary outline-none min-w-[200px]" 
        />
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Column: Calculators */}
        <div className="flex-[3] flex gap-4 overflow-y-auto custom-scrollbar">
          <div className="flex-1"><PurchaseGold /></div>
          <div className="flex-1"><PurchaseSilver /></div>
        </div>

        {/* Right Column: Receipt Summary */}
        <div className="flex-[2] bg-surface border border-primary/30 rounded-xl shadow-lg flex flex-col overflow-hidden">
          <div className="bg-background border-b border-gray-800 p-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 uppercase tracking-widest"><FileText size={20}/> Purchase Receipt</h2>
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">ITEMS: {items.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-textMuted text-sm italic">No items added yet</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-background border border-gray-800 rounded p-3 relative group">
                  <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded mr-2 ${item.metalType === 'Gold' ? 'bg-primary/20 text-primary' : 'bg-gray-700 text-gray-300'}`}>{item.metalType}</span>
                      <span className="text-sm text-textMain font-medium">{item.itemName}</span>
                    </div>
                    <span className="text-sm font-mono text-textMain">₹{item.taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-textMuted">
                    <div className="flex justify-between"><span>Gross:</span><span className="font-mono">{item.grossWeight}g</span></div>
                    <div className="flex justify-between"><span>Purity/Tanch:</span><span className="font-mono">{item.touchPurity}%</span></div>
                    <div className="flex justify-between"><span>Rec. Fine:</span><span className="font-mono text-primary">{item.fineWeight.toFixed(3)}g</span></div>
                    <div className="flex justify-between"><span>Rate:</span><span className="font-mono">₹{item.metalRate}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-background border-t border-gray-800 p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-textMuted">GST Type</span>
              <div className="flex gap-2">
                <button onClick={() => setGstState('same_state')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${gstState === 'same_state' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'}`}>Same State (3%)</button>
                <button onClick={() => setGstState('different_state')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${gstState === 'different_state' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'}`}>Diff State (IGST)</button>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm text-textMuted"><span>Total Taxable</span><span className="font-mono">₹{totalTaxable.toFixed(2)}</span></div>
              {gstState === 'same_state' ? (
                <>
                  <div className="flex justify-between text-sm text-textMuted"><span>CGST (1.5%)</span><span className="font-mono">₹{cgst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm text-textMuted"><span>SGST (1.5%)</span><span className="font-mono">₹{sgst.toFixed(2)}</span></div>
                </>
              ) : (
                <div className="flex justify-between text-sm text-textMuted"><span>IGST (3.0%)</span><span className="font-mono">₹{igst.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between text-xl font-bold text-primary pt-2 border-t border-gray-800 mt-2">
                <span>GRAND TOTAL</span><span className="font-mono">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                disabled={loading || items.length === 0}
                onClick={handleSavePurchase}
                className="bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={18} /> Save Purchase
              </button>
              <button disabled className="bg-gray-800 text-gray-500 font-bold py-3 rounded flex items-center justify-center gap-2 cursor-not-allowed">
                <Printer size={18} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
