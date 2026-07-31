import { useState, useEffect } from 'react';
import { getMetrics } from '../api/dashboardApi';
import type { DashboardMetrics } from '../api/dashboardApi';
import StatCard from '../components/dashboard/StatCard';
import MetalRatesWidget from '../components/dashboard/MetalRatesWidget';
import QuickShortcuts from '../components/dashboard/QuickShortcuts';
import AiAssistantCard from '../components/dashboard/AiAssistantCard';
import { SalesTrendChart, TopSellingChart } from '../components/dashboard/DashboardCharts';
import RecentTables from '../components/dashboard/RecentTables';
import { IndianRupee, ShoppingBag, TrendingUp, Users, PackageOpen } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Sales" 
          value={loading || !metrics ? '…' : formatCurrency(metrics.today_sales)} 
          icon={<IndianRupee size={24} />} 
          subtitle={metrics ? `${metrics.today_bills} Bills generated` : undefined}
          trend={metrics ? "up" : undefined}
        />
        <StatCard 
          title="Today's Purchases" 
          value={loading || !metrics ? '…' : formatCurrency(metrics.today_purchases)} 
          icon={<ShoppingBag size={24} />} 
        />
        <StatCard 
          title="Today's Profit" 
          value={loading || !metrics ? '…' : formatCurrency(metrics.today_profit)} 
          icon={<TrendingUp size={24} />} 
          trend={metrics && metrics.today_profit >= 0 ? 'up' : metrics ? 'down' : undefined}
        />
        <StatCard 
          title="Total Customers" 
          value={loading || !metrics ? '…' : metrics.total_customers.toLocaleString()} 
          icon={<Users size={24} />} 
        />
      </div>

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
