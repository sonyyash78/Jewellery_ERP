import os

base_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/frontend/src/pages/billing"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_LiveBillSummary = """
import { useBillingStore } from '../../../store/billingStore';
import { Calculator, Save, Printer, RefreshCw, Smartphone } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function LiveBillSummary() {
  const { cart, gstState, clearCart } = useBillingStore();
  const [loading, setLoading] = useState(false);

  const totalGross = cart.reduce((sum, item) => sum + item.grossWeight, 0);
  const totalStone = cart.reduce((sum, item) => sum + item.stoneWeight, 0);
  const totalNet = cart.reduce((sum, item) => sum + item.netWeight, 0);
  const totalMetal = cart.reduce((sum, item) => sum + item.metalValue, 0);
  const totalMaking = cart.reduce((sum, item) => sum + item.makingAmount, 0);
  const totalHallmark = cart.reduce((sum, item) => sum + item.hallmark, 0);
  const totalOther = cart.reduce((sum, item) => sum + item.otherCharges, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  
  const taxableAmount = cart.reduce((sum, item) => sum + item.taxableAmount, 0);
  
  let cgst = 0, sgst = 0, igst = 0;
  if (gstState === 'same_state') {
    cgst = taxableAmount * 0.015;
    sgst = taxableAmount * 0.015;
  } else {
    igst = taxableAmount * 0.03;
  }

  const exactTotal = taxableAmount + cgst + sgst + igst;
  const grandTotal = Math.round(exactTotal);
  const roundOff = grandTotal - exactTotal;

  const handleGenerate = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setLoading(true);
    
    const payload = {
      customer_id: 1, // Mock or fetch from store
      subtotal: taxableAmount,
      tax_amount: cgst + sgst + igst,
      discount_amount: totalDiscount,
      grand_total: grandTotal,
      status: 'Paid',
      items: cart.map(item => ({
        item_name: item.itemName,
        item_type: item.itemType,
        final_price: item.taxableAmount,
        gold_calculation: item.itemType === 'Gold' ? {
          metal_rate_id: 1,
          gross_weight: item.grossWeight,
          stone_weight: item.stoneWeight,
          net_weight: item.netWeight,
          making_charges_amount: item.makingAmount,
          hallmark_charges: item.hallmark,
          total_gold_value: item.metalValue
        } : null,
        silver_calculation: item.itemType === 'Silver' ? {
          metal_rate_id: 2,
          gross_weight: item.grossWeight,
          net_weight: item.netWeight,
          making_charges_amount: item.makingAmount,
          total_silver_value: item.metalValue
        } : null
      }))
    };

    try {
      const res = await axiosClient.post('/invoices/', payload);
      toast.success(`Bill Generated: ${res.data.invoice_number}`);
      clearCart();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-4 flex flex-col h-[550px] shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
      
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h3 className="font-bold text-sm tracking-widest uppercase">Bill Summary</h3>
        <span className="text-xs text-textMuted bg-gray-900 px-2 py-1 rounded">{cart.length} Items</span>
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
        <div className="flex justify-between text-red-400"><span className="">Discount</span><span className="font-mono">- ₹{totalDiscount.toFixed(2)}</span></div>
        
        <div className="flex justify-between items-center py-2 bg-gray-900/50 rounded px-2 border border-gray-800 my-2">
          <span className="text-primary font-bold">Taxable Amount</span>
          <span className="font-mono font-bold">₹{taxableAmount.toFixed(2)}</span>
        </div>

        <div className="space-y-1 pl-2 border-l-2 border-gray-800">
          <label className="flex items-center space-x-2 cursor-pointer mb-2">
            <input type="radio" checked={gstState === 'same_state'} onChange={() => useBillingStore.getState().setGstState('same_state')} className="text-primary accent-primary w-3 h-3" />
            <span className="text-textMuted">Same State (CGST+SGST)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer mb-2">
            <input type="radio" checked={gstState === 'different_state'} onChange={() => useBillingStore.getState().setGstState('different_state')} className="text-primary accent-primary w-3 h-3" />
            <span className="text-textMuted">Interstate (IGST)</span>
          </label>
          
          {gstState === 'same_state' ? (
            <>
              <div className="flex justify-between"><span className="text-gray-500">CGST 1.5%</span><span className="font-mono">₹{cgst.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">SGST 1.5%</span><span className="font-mono">₹{sgst.toFixed(2)}</span></div>
            </>
          ) : (
            <div className="flex justify-between"><span className="text-gray-500">IGST 3%</span><span className="font-mono">₹{igst.toFixed(2)}</span></div>
          )}
        </div>
        
        <div className="flex justify-between text-gray-500"><span className="">Round Off</span><span className="font-mono">{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span></div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="bg-[#052e16] border border-[#166534] rounded flex justify-between items-center px-3 py-2 mb-4 shadow-[0_0_10px_rgba(22,101,52,0.3)]">
          <span className="text-green-500 font-bold tracking-widest text-xs uppercase">Grand Total</span>
          <span className="text-2xl font-black text-green-400 tracking-tighter">₹ {grandTotal.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button className="flex items-center justify-center space-x-1 bg-background border border-gray-700 hover:border-gray-500 py-2 rounded transition-colors"><Save size={14}/> <span>Draft</span></button>
          <button className="flex items-center justify-center space-x-1 bg-background border border-gray-700 hover:border-gray-500 py-2 rounded transition-colors"><Printer size={14}/> <span>Print</span></button>
          <button className="flex items-center justify-center space-x-1 bg-green-900/30 border border-green-800 text-green-400 hover:bg-green-800/50 py-2 rounded transition-colors col-span-2"><Smartphone size={14}/> <span>WhatsApp / SMS</span></button>
          <button onClick={handleGenerate} disabled={loading} className="col-span-2 flex items-center justify-center space-x-1 bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Calculator size={16} />}
            <span>{loading ? 'Generating...' : 'GENERATE BILL (F7)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
"""

c_BillTable = """
import { useBillingStore } from '../../../store/billingStore';
import { Trash2, Copy, Edit } from 'lucide-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

const columnHelper = createColumnHelper<any>();

export default function BillTable() {
  const { cart, removeFromCart } = useBillingStore();

  const columns = [
    columnHelper.accessor((row, i) => i + 1, { id: '#', header: '#' }),
    columnHelper.accessor('itemType', { header: 'Metal', cell: info => <span className={info.getValue() === 'Gold' ? 'text-primary' : 'text-gray-300'}>{info.getValue()}</span> }),
    columnHelper.accessor('itemName', { header: 'Item' }),
    columnHelper.accessor('purityDisplay', { header: 'Purity/Tanch' }),
    columnHelper.accessor('grossWeight', { header: 'Gross Wt', cell: i => <span className="font-mono">{i.getValue().toFixed(3)}</span> }),
    columnHelper.accessor('stoneWeight', { header: 'Stone Wt', cell: i => <span className="font-mono">{i.getValue().toFixed(3)}</span> }),
    columnHelper.accessor('netWeight', { header: 'Net Wt', cell: i => <span className="font-mono font-bold text-primary">{i.getValue().toFixed(3)}</span> }),
    columnHelper.accessor('rateDisplay', { header: 'Rate', cell: i => <span className="font-mono">{i.getValue().toLocaleString()}</span> }),
    columnHelper.accessor('makingAmount', { header: 'Making', cell: i => <span className="font-mono">{i.getValue().toFixed(2)}</span> }),
    columnHelper.accessor('taxableAmount', { header: 'Amount', cell: i => <span className="font-mono">{i.getValue().toFixed(2)}</span> }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (props) => (
        <div className="flex space-x-2">
          <button className="text-gray-400 hover:text-blue-400 transition-colors"><Edit size={14} /></button>
          <button onClick={() => removeFromCart(props.row.original.id)} className="text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
        </div>
      )
    })
  ];

  const table = useReactTable({
    data: cart,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden mt-4 flex-1 flex flex-col min-h-[300px]">
      <div className="bg-[#312e81] border-b border-[#3730a3] px-4 py-2 flex justify-between items-center">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Bill Item List</h3>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-textMuted uppercase bg-background/50 border-b border-gray-800 sticky top-0">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-3 font-semibold tracking-wider">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-textMuted italic">
                  No items in bill. Add items using the calculators above.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""

c_Billing = """
import TopBar from './TopBar';
import GoldCalculator from './GoldCalculator';
import SilverCalculator from './SilverCalculator';
import LiveBillSummary from './LiveBillSummary';
import BillTable from './BillTable';

export default function Billing() {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
      {/* Dynamic Metadata Row */}
      <TopBar />
      
      {/* Main Grid Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Calculators Column */}
        <div className="flex-[3] flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-4">
            <GoldCalculator />
            <SilverCalculator />
          </div>
          <BillTable />
        </div>

        {/* Live Summary Column */}
        <div className="w-80 flex-shrink-0">
          <LiveBillSummary />
        </div>
      </div>
    </div>
  );
}
"""

write_file("LiveBillSummary.tsx", c_LiveBillSummary)
write_file("BillTable.tsx", c_BillTable)
write_file("index.tsx", c_Billing)
print("Components 2 generated.")
