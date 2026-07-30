import { useState, useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient';
import { User, Calendar, Tag, CreditCard } from 'lucide-react';

export default function TopBar() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  
  useEffect(() => {
    axiosClient.get('/customers/').then(res => setCustomers(res.data.items || [])).catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap gap-4 mb-4 bg-surface border border-primary/20 rounded-xl p-3 shadow-lg">
      <div className="flex-1 min-w-[200px] flex items-center space-x-2 bg-background px-3 py-1.5 rounded border border-gray-700">
        <User size={16} className="text-primary" />
        <select 
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
          className="bg-transparent text-sm text-textMain outline-none w-full cursor-pointer"
        >
          <option value="">Select Customer...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
      </div>

      <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded border border-gray-700">
        <Tag size={16} className="text-primary" />
        <span className="text-sm text-textMuted w-24">INV-AUTO</span>
      </div>

      <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded border border-gray-700">
        <Calendar size={16} className="text-primary" />
        <span className="text-sm text-textMain">{new Date().toLocaleDateString('en-GB')}</span>
      </div>

      <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded border border-gray-700">
        <User size={16} className="text-gray-400" />
        <select className="bg-transparent text-sm text-textMain outline-none cursor-pointer w-24">
          <option>Admin</option>
          <option>Staff 1</option>
        </select>
      </div>

      <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded border border-gray-700">
        <CreditCard size={16} className="text-gray-400" />
        <select className="bg-transparent text-sm text-textMain outline-none cursor-pointer w-24">
          <option>Cash</option>
          <option>Card</option>
          <option>UPI</option>
        </select>
      </div>
    </div>
  );
}
