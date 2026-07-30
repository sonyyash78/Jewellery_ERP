import os

base_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/frontend"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_dashboard_api = """
import { axiosClient } from './axiosClient';

export interface DashboardMetrics {
  today_sales: number;
  today_bills: number;
  today_purchases: number;
  today_profit: number;
  total_customers: number;
  inventory_value: number;
  low_stock_count: number;
}

export interface RecentActivity {
  recent_bills: any[];
  recent_purchases: any[];
}

export const getMetrics = async (): Promise<DashboardMetrics> => {
  const res = await axiosClient.get('/dashboard/metrics');
  return res.data;
};

export const getRecentActivity = async (): Promise<RecentActivity> => {
  const res = await axiosClient.get('/dashboard/recent-activity');
  return res.data;
};

export const getMetalRates = async () => {
  const res = await axiosClient.get('/metal-rates/latest');
  return res.data;
};
"""

c_stat_card = """
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ title, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-gray-800 hover:border-primary/50 transition-colors group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>
      
      <div className="flex justify-between items-start">
        <div>
          <p className="text-textMuted text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-textMain mt-2 tracking-tight">{value}</h3>
          
          {subtitle && (
            <p className={`text-xs mt-2 font-medium ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-textMuted'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        
        {icon && (
          <div className="p-3 bg-gray-800/50 rounded-lg text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
"""

c_metal_rates = """
import { useState, useEffect } from 'react';
import { getMetalRates } from '../../api/dashboardApi';
import { Activity } from 'lucide-react';

export default function MetalRatesWidget() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMetalRates().then(data => {
      setRates(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-surface animate-pulse rounded-xl border border-gray-800"></div>;

  return (
    <div className="bg-surface rounded-xl border border-gray-800 p-6 flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-4">
        <Activity size={20} className="text-primary" />
        <h3 className="font-bold text-lg text-textMain">Live Metal Rates</h3>
      </div>
      
      <div className="flex-1 space-y-3 overflow-auto pr-2">
        {rates.length === 0 ? (
          <p className="text-sm text-textMuted italic">No rates available.</p>
        ) : (
          rates.map((rate, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-background rounded border border-gray-800">
              <div>
                <span className="font-semibold text-textMain">{rate.purity_name}</span>
                <span className="text-xs text-textMuted ml-2">{rate.metal_type}</span>
              </div>
              <div className="font-bold text-primary">₹ {Number(rate.rate_per_gram).toLocaleString()} /g</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
"""

c_shortcuts = """
import { PlusCircle, Users, Package, FileText, Receipt, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuickShortcuts() {
  const shortcuts = [
    { name: 'New Bill', icon: <Receipt size={24} />, path: '/billing', color: 'bg-green-500/10 text-green-500' },
    { name: 'Add Customer', icon: <Users size={24} />, path: '/customers', color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Add Product', icon: <Package size={24} />, path: '/products', color: 'bg-purple-500/10 text-purple-500' },
    { name: 'New Expense', icon: <FileText size={24} />, path: '/', color: 'bg-orange-500/10 text-orange-500' },
    { name: 'Inventory In', icon: <PlusCircle size={24} />, path: '/', color: 'bg-primary/10 text-primary' },
    { name: 'Reports', icon: <FileSpreadsheet size={24} />, path: '/', color: 'bg-teal-500/10 text-teal-500' },
  ];

  return (
    <div className="bg-surface rounded-xl border border-gray-800 p-6">
      <h3 className="font-bold text-lg text-textMain mb-4">Quick Shortcuts</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {shortcuts.map(s => (
          <Link 
            key={s.name} 
            to={s.path}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-background border border-gray-800 hover:border-gray-600 transition-colors group"
          >
            <div className={`p-3 rounded-full mb-3 ${s.color} group-hover:scale-110 transition-transform`}>
              {s.icon}
            </div>
            <span className="text-sm font-medium text-textMuted group-hover:text-textMain">{s.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
"""

c_ai_card = """
import { Sparkles } from 'lucide-react';

export default function AiAssistantCard() {
  return (
    <div className="bg-gradient-to-br from-surface to-background rounded-xl border border-primary/30 p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles size={120} className="text-primary" />
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles size={20} className="text-primary" />
          <h3 className="font-bold text-lg text-primary">ERP AI Assistant</h3>
        </div>
        
        <p className="text-sm text-textMuted mb-6 flex-1">
          Ask me to analyze sales trends, find a specific customer, or generate an inventory restock report.
        </p>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask AI..." 
            className="w-full bg-background/50 border border-gray-700 rounded-full px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary placeholder-gray-500 backdrop-blur-sm"
          />
          <button className="absolute right-1 top-1 bottom-1 bg-primary text-black font-medium px-4 rounded-full text-xs hover:bg-primary-dark transition-colors">
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
"""

c_charts = """
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
"""

c_tables = """
import { useState, useEffect } from 'react';
import { getRecentActivity } from '../../api/dashboardApi';

export default function RecentTables() {
  const [data, setData] = useState<{recent_bills: any[], recent_purchases: any[]}>({ recent_bills: [], recent_purchases: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentActivity().then(res => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 bg-surface animate-pulse rounded-xl border border-gray-800"></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-surface rounded-xl border border-gray-800 p-6">
        <h3 className="font-bold text-lg text-textMain mb-4">Recent Bills</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-textMuted border-b border-gray-800">
                <th className="pb-3 font-medium">Invoice #</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_bills.length === 0 ? (
                <tr><td colSpan={3} className="py-4 text-center text-textMuted italic">No recent bills</td></tr>
              ) : (
                data.recent_bills.map((bill, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="py-3 font-medium text-primary">{bill.invoice_number}</td>
                    <td className="py-3 text-textMuted">{new Date(bill.date).toLocaleDateString()}</td>
                    <td className="py-3 text-right font-semibold text-textMain">₹ {bill.amount.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-gray-800 p-6">
        <h3 className="font-bold text-lg text-textMain mb-4">Recent Expenses/Purchases</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-textMuted border-b border-gray-800">
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_purchases.length === 0 ? (
                <tr><td colSpan={3} className="py-4 text-center text-textMuted italic">No recent purchases</td></tr>
              ) : (
                data.recent_purchases.map((purchase, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="py-3 text-textMain">{purchase.description}</td>
                    <td className="py-3 text-textMuted">{new Date(purchase.date).toLocaleDateString()}</td>
                    <td className="py-3 text-right font-semibold text-red-400">₹ {purchase.amount.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
"""

c_dashboard_page = """
import { useState, useEffect } from 'react';
import { getMetrics, DashboardMetrics } from '../api/dashboardApi';
import StatCard from '../components/dashboard/StatCard';
import MetalRatesWidget from '../components/dashboard/MetalRatesWidget';
import QuickShortcuts from '../components/dashboard/QuickShortcuts';
import AiAssistantCard from '../components/dashboard/AiAssistantCard';
import { SalesTrendChart, TopSellingChart } from '../components/dashboard/DashboardCharts';
import RecentTables from '../components/dashboard/RecentTables';
import { IndianRupee, FileText, ShoppingBag, TrendingUp, Users, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMetrics().then(data => {
      setMetrics(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast.error('Failed to load dashboard metrics');
      setLoading(false);
    });
  }, []);

  const formatCurrency = (val: number) => `₹ ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface rounded-xl border border-gray-800"></div>)}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Today's Sales" 
            value={formatCurrency(metrics.today_sales)} 
            icon={<IndianRupee size={24} />} 
            subtitle={`${metrics.today_bills} Bills generated`}
            trend="up"
          />
          <StatCard 
            title="Today's Purchases" 
            value={formatCurrency(metrics.today_purchases)} 
            icon={<ShoppingBag size={24} />} 
          />
          <StatCard 
            title="Today's Profit" 
            value={formatCurrency(metrics.today_profit)} 
            icon={<TrendingUp size={24} />} 
            trend={metrics.today_profit >= 0 ? 'up' : 'down'}
          />
          <StatCard 
            title="Total Customers" 
            value={metrics.total_customers.toLocaleString()} 
            icon={<Users size={24} />} 
          />
        </div>
      ) : null}

      {/* Middle Row: Charts & AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesTrendChart />
        </div>
        <div className="flex flex-col space-y-6">
          <div className="flex-1">
            <AiAssistantCard />
          </div>
          <div className="flex-1">
            <MetalRatesWidget />
          </div>
        </div>
      </div>

      {/* Lower Row: Inventory & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <StatCard 
            title="Inventory Value (Est)" 
            value={loading ? '...' : formatCurrency(metrics?.inventory_value || 0)} 
            icon={<PackageOpen size={24} />} 
          />
          <QuickShortcuts />
        </div>
        <div className="lg:col-span-2">
          <TopSellingChart />
        </div>
      </div>

      {/* Tables Row */}
      <RecentTables />
    </div>
  );
}
"""

write_file("src/api/dashboardApi.ts", c_dashboard_api)
write_file("src/components/dashboard/StatCard.tsx", c_stat_card)
write_file("src/components/dashboard/MetalRatesWidget.tsx", c_metal_rates)
write_file("src/components/dashboard/QuickShortcuts.tsx", c_shortcuts)
write_file("src/components/dashboard/AiAssistantCard.tsx", c_ai_card)
write_file("src/components/dashboard/DashboardCharts.tsx", c_charts)
write_file("src/components/dashboard/RecentTables.tsx", c_tables)
write_file("src/pages/Dashboard.tsx", c_dashboard_page)

print("Frontend Dashboard components created.")
