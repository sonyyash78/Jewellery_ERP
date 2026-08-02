import { useState, useEffect } from 'react';
import { getMetrics, getChartData } from '../api/dashboardApi';
import type { DashboardMetrics, ChartData } from '../api/dashboardApi';
import StatCard from '../components/dashboard/StatCard';
import MetalRatesWidget from '../components/dashboard/MetalRatesWidget';
import QuickShortcuts from '../components/dashboard/QuickShortcuts';
import AiAssistantCard from '../components/dashboard/AiAssistantCard';
import { SalesTrendChart, TopSellingChart } from '../components/dashboard/DashboardCharts';
import RecentTables from '../components/dashboard/RecentTables';
import { IndianRupee, ShoppingBag, TrendingUp, Users, PackageOpen, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const [metricsData, chartsData] = await Promise.all([
        getMetrics(),
        getChartData()
      ]);
      setMetrics(metricsData);
      setChartData(chartsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      if (!metrics) toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load & Polling setup (every 30 seconds)
  useEffect(() => {
    fetchDashboardData();
    const intervalId = setInterval(() => {
      fetchDashboardData(true); // silent background fetch, but shows tiny spinner
    }, 30000);
    
    // Auto-refresh when window regains focus (real-time across tabs)
    const onFocus = () => fetchDashboardData(true);
    window.addEventListener('focus', onFocus);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const formatCurrency = (val: number) => `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header & Live Update Status */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Real-time insights and business metrics</p>
        </div>
        <div className="flex items-center gap-3 bg-surface/50 border border-gray-800 px-4 py-2 rounded-full shadow-inner">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            Live Updates On
          </div>
          <div className="w-px h-4 bg-gray-700"></div>
          <button onClick={() => fetchDashboardData(true)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-white transition-colors">
            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
          {chartData ? <SalesTrendChart data={chartData.sales_trend} /> : (
            <div className="bg-surface rounded-xl border border-gray-800 p-6 h-96 flex items-center justify-center">
              <RefreshCw className="animate-spin text-primary opacity-50" size={32} />
            </div>
          )}
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
          {chartData ? <TopSellingChart data={chartData.top_categories} /> : (
            <div className="bg-surface rounded-xl border border-gray-800 p-6 h-96 flex items-center justify-center">
              <RefreshCw className="animate-spin text-primary opacity-50" size={32} />
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <RecentTables />
    </div>
  );
}
