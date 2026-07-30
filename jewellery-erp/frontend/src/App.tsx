import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Billing from './pages/billing';
import Purchase from './pages/purchase';
import Inventory from './pages/inventory';
import InvoiceHistory from './pages/invoices/InvoiceHistory';

import CRM from './pages/crm';
import ExchangeModule from './pages/exchange';
import ReportsModule from './pages/reports';
import SettingsModule from './pages/settings';

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ 
        style: { background: '#171717', color: '#f3f4f6', border: '1px solid #374151' } 
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CRM />} />
            <Route path="/exchange" element={<ExchangeModule />} />
            <Route path="/reports" element={<ReportsModule />} />
            <Route path="/settings" element={<SettingsModule />} />
            <Route path="/products" element={<div className="p-4">Products Module Coming Soon</div>} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/invoices" element={<InvoiceHistory />} />
            <Route path="/purchases" element={<Purchase />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
