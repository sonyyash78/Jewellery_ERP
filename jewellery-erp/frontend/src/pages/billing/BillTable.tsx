import { useBillingStore } from '../../store/billingStore';
import { Trash2, Edit } from 'lucide-react';
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
    columnHelper.accessor((_: any, i: number) => i + 1, { id: '#', header: '#' }),
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
      cell: (props) => {
        const item = props.row.original;
        
        const handleEdit = () => {
          if (item.itemType === 'Gold') {
            useBillingStore.setState({ 
              goldForm: item.rawGold || {
                itemName: item.itemName,
                category: '',
                hsn: '',
                purity: item.purityDisplay || '22K Gold',
                touch: item.touchDisplay || 91.6,
                grossWeight: item.grossWeight || 0,
                stoneWeight: item.stoneWeight || 0,
                ratePerGm: item.rateDisplay || 0,
                makingChargeType: 'flat',
                makingChargeValue: item.makingAmount || 0,
                hallmark: item.hallmark || 0,
                otherCharges: item.otherCharges || 0,
                discount: item.discount || 0
              }
            });
          } else if (item.itemType === 'Silver') {
            useBillingStore.setState({ 
              silverForm: item.rawSilver || {
                itemName: item.itemName,
                category: '',
                hsn: '',
                tanch: item.touchDisplay || 65,
                silverPurity: item.purityDisplay || 'Fine',
                grossWeight: item.grossWeight || 0,
                ratePerKg: item.rateDisplay || 0,
                makingChargeType: 'flat',
                makingChargeValue: item.makingAmount || 0,
                otherCharges: item.otherCharges || 0,
                discount: item.discount || 0
              }
            });
          }
          useBillingStore.getState().setEditingItemId(item.id);
          
          // UX Feedback
          import('react-hot-toast').then(mod => mod.default.success("Item loaded into calculator for editing"));
          
          // Find the scroll container and scroll it to top
          const scrollContainer = document.querySelector('.custom-scrollbar.overflow-y-auto');
          if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        };

        return (
          <div className="flex space-x-2">
            <button onClick={handleEdit} className="text-gray-400 hover:text-blue-400 transition-colors" title="Edit Item"><Edit size={14} /></button>
            <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-400 transition-colors" title="Delete Item"><Trash2 size={14} /></button>
          </div>
        );
      }
    })
  ];

  const table = useReactTable({
    data: cart,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden mt-4 flex-shrink-0 flex flex-col min-h-[350px]">
      <div className="bg-[#312e81] border-b border-[#3730a3] px-4 py-2 flex justify-between items-center">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Bill Item List</h3>
      </div>
      <div className="overflow-auto flex-1 custom-scrollbar">
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
