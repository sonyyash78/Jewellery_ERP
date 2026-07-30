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
      const response = await axiosClient.post('/auth/login', {
        username,
        password
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
            <label htmlFor="username" className="block text-sm font-medium text-textMuted mb-1">Username</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-textMuted mb-1">Password</label>
            <input 
              id="password"
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
