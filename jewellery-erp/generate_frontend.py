import os

base_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/frontend"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_tailwind_config = """
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#171717',
        primary: '#d4af37',
        'primary-dark': '#b5952f',
        textMain: '#f3f4f6',
        textMuted: '#9ca3af'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
"""

c_index_css = """
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-textMain antialiased;
  }
}

/* Custom Scrollbar for a premium feel */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #0a0a0a; 
}
::-webkit-scrollbar-thumb {
  background: #333; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #d4af37; 
}
"""

c_auth_store = """
import { create } from 'zustand';

interface AuthState {
  token: str | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('erp_token'),
  user: JSON.parse(localStorage.getItem('erp_user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    set({ token: null, user: null });
  }
}));
"""

c_axios_client = """
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const axiosClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to attach JWT
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 Unauthorized globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
"""

c_protected_route = """
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const token = useAuthStore(state => state.token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}
"""

c_admin_layout = """
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Users, Coins, LogOut, Package } from 'lucide-react';

export default function AdminLayout() {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
    { name: 'Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Billing', path: '/billing', icon: <Coins size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background text-textMain overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-gray-800 flex flex-col">
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
"""

c_login = """
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { axiosClient } from '../api/axiosClient';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await axiosClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const { access_token } = response.data;
      
      // Fetch user profile
      const userRes = await axiosClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      setAuth(access_token, userRes.data);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-2xl border border-gray-800 relative overflow-hidden">
        {/* Decorative gold accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-dark"></div>
        
        <h2 className="text-3xl font-bold text-center text-textMain mb-2 uppercase tracking-wide">
          Jewellery <span className="text-primary">ERP</span>
        </h2>
        <p className="text-center text-textMuted mb-8 text-sm">Secure Portal Access</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-black font-semibold py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
"""

c_dashboard = """
export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <div className="bg-surface p-6 rounded-xl border border-gray-800">
          <p className="text-textMuted text-sm">Today's Sales</p>
          <p className="text-3xl font-bold text-textMain mt-2">₹ 0.00</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-gray-800">
          <p className="text-textMuted text-sm">Total Invoices</p>
          <p className="text-3xl font-bold text-textMain mt-2">0</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-gray-800">
          <p className="text-textMuted text-sm">Active Customers</p>
          <p className="text-3xl font-bold text-textMain mt-2">0</p>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-xl border border-gray-800 h-96 flex items-center justify-center">
        <p className="text-textMuted">Analytics Chart Placeholder</p>
      </div>
    </div>
  );
}
"""

c_app_tsx = """
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';

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
            <Route path="/customers" element={<div className="p-4">Customers Module Coming Soon</div>} />
            <Route path="/products" element={<div className="p-4">Products Module Coming Soon</div>} />
            <Route path="/billing" element={<div className="p-4">Billing Module Coming Soon</div>} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
"""

c_main_tsx = """
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
"""

# Write files
write_file("tailwind.config.js", c_tailwind_config)
write_file("src/index.css", c_index_css)
write_file("src/store/authStore.ts", c_auth_store)
write_file("src/api/axiosClient.ts", c_axios_client)
write_file("src/routes/ProtectedRoute.tsx", c_protected_route)
write_file("src/components/layout/AdminLayout.tsx", c_admin_layout)
write_file("src/pages/Login.tsx", c_login)
write_file("src/pages/Dashboard.tsx", c_dashboard)
write_file("src/App.tsx", c_app_tsx)
write_file("src/main.tsx", c_main_tsx)

print("Frontend setup files created successfully.")
