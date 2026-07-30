import { useState } from 'react';
import ReportViewer from './ReportViewer';
import { LineChart, LayoutDashboard, Package, Users, Landmark, Receipt, Banknote } from 'lucide-react';

export default function ReportsModule() {
  const [activeReport, setActiveReport] = useState('Sales');

  const navs = [
    { name: 'Sales', icon: <LineChart size={18} /> },
    { name: 'Purchases', icon: <Package size={18} /> },
    { name: 'Profit', icon: <Landmark size={18} /> },
    { name: 'Inventory', icon: <LayoutDashboard size={18} /> },
    { name: 'GST', icon: <Receipt size={18} /> },
    { name: 'Customers', icon: <Users size={18} /> },
    { name: 'Suppliers', icon: <Users size={18} /> },
    { name: 'Expenses', icon: <Banknote size={18} /> },
  ];

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden">
      
      {/* Left Navigation */}
      <div className="w-64 bg-surface border border-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden print:hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-primary font-bold uppercase tracking-widest text-sm">Analytics Engine</h2>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {navs.map(nav => (
            <button
              key={nav.name}
              onClick={() => setActiveReport(nav.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-bold text-sm ${
                activeReport === nav.name 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-textMuted hover:bg-gray-800 hover:text-textMain'
              }`}
            >
              <span className={activeReport === nav.name ? 'text-primary' : 'text-gray-500'}>{nav.icon}</span>
              {nav.name} Report
            </button>
          ))}
        </div>
      </div>

      {/* Right Viewer */}
      <div className="flex-1 min-w-0">
        <ReportViewer reportType={activeReport} />
      </div>

    </div>
  );
}
