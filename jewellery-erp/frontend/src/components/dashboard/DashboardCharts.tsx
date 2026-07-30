import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export function SalesTrendChart() {
  // Mock data for visual purpose until historical aggregation is built
  const data = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 5000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 8900 },
    { name: 'Sat', sales: 12000 },
    { name: 'Sun', sales: 9000 },
  ];

  return (
    <div className="bg-surface rounded-xl border border-gray-800 p-6 h-96 flex flex-col">
      <h3 className="font-bold text-lg text-textMain mb-4">Weekly Sales Trend</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#171717', borderColor: '#374151', borderRadius: '8px' }}
              itemStyle={{ color: '#d4af37' }}
            />
            <Line type="monotone" dataKey="sales" stroke="#d4af37" strokeWidth={3} dot={{ fill: '#d4af37', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopSellingChart() {
  const data = [
    { name: 'Rings', qty: 120 },
    { name: 'Chains', qty: 98 },
    { name: 'Bangles', qty: 86 },
    { name: 'Earrings', qty: 70 },
  ];

  return (
    <div className="bg-surface rounded-xl border border-gray-800 p-6 h-96 flex flex-col">
      <h3 className="font-bold text-lg text-textMain mb-4">Top Categories</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" stroke="#9ca3af" axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#333' }}
              contentStyle={{ backgroundColor: '#171717', borderColor: '#374151', borderRadius: '8px' }}
              itemStyle={{ color: '#d4af37' }}
            />
            <Bar dataKey="qty" fill="#d4af37" radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
