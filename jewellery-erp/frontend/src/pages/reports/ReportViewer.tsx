import { useState, useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient';
import { exportReportToPDF } from '../../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { FileText, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportViewer({ reportType }: { reportType: string }) {
  const [timeFilter, setTimeFilter] = useState('Monthly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  useEffect(() => {
    fetchReport();
  }, [reportType, timeFilter]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Calculate date range based on filter
      const today = new Date();
      let startDate, endDate;

      switch (timeFilter) {
        case 'Daily':
          startDate = endDate = today.toISOString().split('T')[0];
          break;
        case 'Weekly':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'Monthly':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'Yearly':
          startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        default:
          startDate = endDate = undefined;
      }

      setDateRange({ start: startDate, end: endDate });

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await axiosClient.get(`/reports/${reportType.toLowerCase()}?${params.toString()}`);
      setData(res.data);
    } catch (e) {
      toast.error(`Failed to load ${reportType} report`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!data) {
      toast.error("No data to export");
      return;
    }
    
    const toastId = 'pdf-export';
    try {
      toast.loading('Generating PDF...', { id: toastId });
      
      exportReportToPDF(data, `${reportType} Report`, dateRange);
      
      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (error: any) {
      console.error('PDF export error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(`Failed to generate PDF: ${errorMessage}`, { id: toastId, duration: 5000 });
    }
  };

  if (loading) return <div className="p-8 text-primary font-bold animate-pulse">Loading Analytics...</div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 h-full print-safe">
      
      {/* Header and Controls */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-gray-800 shadow-lg print:hidden">
        <div>
          <h2 className="text-xl font-bold text-primary uppercase tracking-widest">{reportType} Report</h2>
          <p className="text-xs text-textMuted mt-1">Real-time analytical insights</p>
        </div>

        <div className="flex gap-4">
          <select 
            value={timeFilter} 
            onChange={e => setTimeFilter(e.target.value)}
            className="bg-background border border-gray-700 text-sm rounded px-3 py-2 outline-none text-textMain"
          >
            <option value="Daily">Today (Daily)</option>
            <option value="Weekly">Last 7 Days</option>
            <option value="Monthly">This Month</option>
            <option value="Yearly">This Year</option>
            <option value="All">All Time</option>
          </select>

          <div className="flex bg-background border border-gray-700 rounded overflow-hidden">
            <button 
              onClick={handleExportPDF} 
              className="px-3 py-2 hover:bg-gray-800 text-red-400 flex items-center gap-2 border-r border-gray-700 transition-colors"
            >
              <FileText size={16} /> PDF
            </button>
            <button 
              onClick={handlePrint} 
              className="px-3 py-2 hover:bg-gray-800 text-blue-400 flex items-center gap-2 transition-colors"
            >
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(data).filter(([k]) => k !== 'chart').map(([key, value]) => (
          <div key={key} className="bg-surface border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col justify-center">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{key.replace(/_/g, ' ')}</div>
            <div className="text-3xl font-bold font-mono text-textMain">
              {typeof value === 'object' && value !== null ? (
                <div className="flex flex-col gap-1 mt-2">
                  {Object.entries(value).map(([k, v]) => (
                    <div key={k} className="text-sm font-normal flex justify-between border-b border-gray-800 pb-1">
                      <span className="text-gray-400 capitalize">{k}</span>
                      <span>₹ {Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              ) : typeof value === 'number' && !key.includes('count') && !key.includes('margin') && !key.includes('weight') && key !== 'total' && key !== 'total_items' ? 
                `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                String(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Charting Area - Only if chart data exists */}
      {data.chart && data.chart.length > 0 && (
        <div className="flex-1 bg-surface border border-gray-800 rounded-xl p-6 shadow-lg min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {reportType === 'Inventory' ? (
              <BarChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="metal" stroke="#888" />
                <YAxis yAxisId="left" stroke="#888" />
                <YAxis yAxisId="right" orientation="right" stroke="#d4af37" />
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Item Count" />
                <Bar yAxisId="right" dataKey="weight" fill="#d4af37" name="Total Weight (g)" />
              </BarChart>
            ) : (
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" tickFormatter={t => t.split('-').slice(1).join('/')} />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                <Line type="monotone" dataKey="amount" stroke="#d4af37" strokeWidth={3} dot={{ fill: '#d4af37', r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Grid Fallback for Print */}
      {data.chart && data.chart.length > 0 && (
        <div className="hidden print:block mt-8">
          <table className="w-full text-left text-sm border-collapse border border-gray-800">
            <thead>
              <tr className="bg-gray-100 text-black">
                {Object.keys(data.chart[0]).map(k => (
                  <th key={k} className="p-2 border border-gray-300 uppercase">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.chart.map((row: any, i: number) => (
                <tr key={i}>
                  {Object.values(row).map((v: any, j: number) => (
                    <td key={j} className="p-2 border border-gray-300 text-black">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
