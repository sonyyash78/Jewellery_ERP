import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Users, ArrowLeftRight, LogOut, Package, Settings, Receipt, FileText, ShoppingBag, BarChart2 } from 'lucide-react';
import AIAssistant from '../ai/AIAssistant';

export default function AdminLayout() {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
    { name: 'Billing', path: '/billing', icon: <Receipt size={20} /> },
    { name: 'Invoices', path: '/invoices', icon: <FileText size={20} /> },
    { name: 'Exchange', path: '/exchange', icon: <ArrowLeftRight size={20} /> },
    { name: 'Purchases', path: '/purchases', icon: <ShoppingBag size={20} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart2 size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background text-textMain overflow-hidden relative">
      <AIAssistant />
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-gray-800 flex flex-col hidden md:flex print:hidden">
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <h1 className="text-xl font-bold text-primary tracking-widest uppercase">Jewellery ERP</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-textMuted hover:bg-gray-800 hover:text-textMain'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="h-16 bg-surface border-b border-gray-800 flex items-center justify-between px-6">
          <div className="text-lg font-semibold text-textMuted">
            {navItems.find(i => i.path === location.pathname)?.name || 'Admin'}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-textMuted">Welcome, <span className="text-primary">{user?.username || 'User'}</span></span>
            <button 
              onClick={logout}
              className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-1.5 rounded"
            >
              <LogOut size={16} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
