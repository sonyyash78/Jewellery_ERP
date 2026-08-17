import { useState, useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient';
import { Save, Upload, Download, ShieldCheck, Database, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsModule() {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axiosClient.get('/settings/');
      setSettings(res.data);
    } catch (e) {
      toast.error('Failed to load settings');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
    try {
      await axiosClient.post('/settings/', payload);
      toast.success('Settings saved successfully');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    const formData = new FormData();
    formData.append('file', logoFile);
    try {
      await axiosClient.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Logo uploaded! Refresh to see changes.');
    } catch (e) {
      toast.error('Failed to upload logo');
    }
  };

  const handleBackup = async () => {
    try {
      const response = await axiosClient.get('/backup/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jewellery_erp_backup_${new Date().toISOString().slice(0,10)}.sql`);
      document.body.appendChild(link);
      link.click();
      toast.success('Database backup downloaded successfully!');
    } catch (e) {
      toast.error('Backup failed');
    }
  };

  const handleExcelBackup = async () => {
    try {
      const response = await axiosClient.get('/backup/excel-download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jewellery_erp_backup_${new Date().toISOString().slice(0,10)}.zip`);
      document.body.appendChild(link);
      link.click();
      toast.success('Database Excel backup downloaded successfully!');
    } catch (e) {
      toast.error('Excel Backup failed');
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-surface border border-gray-800 rounded-xl shadow-lg flex flex-col p-4">
        <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-6 border-b border-gray-800 pb-4">Global Settings</h2>
        
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-bold text-sm ${activeTab === 'profile' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-textMuted hover:bg-gray-800'}`}
          >
            <Building2 size={18} /> Business Profile
          </button>
          
          <button 
            onClick={() => setActiveTab('security')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-bold text-sm ${activeTab === 'security' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-textMuted hover:bg-gray-800'}`}
          >
            <ShieldCheck size={18} /> Roles & Permissions
          </button>
          
          <button 
            onClick={() => setActiveTab('database')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-bold text-sm ${activeTab === 'database' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-textMuted hover:bg-gray-800'}`}
          >
            <Database size={18} /> Backup & Restore
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-surface border border-gray-800 rounded-xl shadow-lg overflow-auto p-8">
        
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-textMain mb-6">Business Profile</h2>
            
            <div className="mb-8 p-6 border border-gray-800 rounded-xl bg-black/20">
              <h3 className="text-sm font-bold text-primary uppercase mb-4">Shop Logo</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/static/logo.png?v=${Date.now()}`} alt="Logo" className="max-w-full max-h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/png, image/jpeg" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary-dark mb-4" />
                  <button onClick={async () => {
                    await handleLogoUpload();
                    window.location.reload();
                  }} className="bg-background border border-gray-700 hover:border-primary text-textMain px-4 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2"><Upload size={16} /> Upload Logo</button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Name</label>
                  <input value={settings['business_name'] || ''} onChange={e=>setSettings({...settings, business_name: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tagline (Subtitle)</label>
                  <input value={settings['tagline'] || ''} placeholder="e.g. Trust. Purity. Elegance." onChange={e=>setSettings({...settings, tagline: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                  <input value={settings['phone'] || ''} onChange={e=>setSettings({...settings, phone: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                  <input value={settings['email'] || ''} onChange={e=>setSettings({...settings, email: e.target.value})} type="email" className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GSTIN Number</label>
                  <input value={settings['gstin'] || ''} onChange={e=>setSettings({...settings, gstin: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PAN Number</label>
                  <input value={settings['pan'] || ''} onChange={e=>setSettings({...settings, pan: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                  <textarea value={settings['address'] || ''} onChange={e=>setSettings({...settings, address: e.target.value})} rows={3} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none resize-none" />
                </div>

                <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-primary font-bold text-sm mb-4 uppercase tracking-widest">Invoice Print Settings (Other Details)</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Print Hallmark</label>
                  <textarea value={settings['print_hallmark'] || ''} placeholder="BIS 916 (Gold)&#10;BIS 925 (Silver)" onChange={e=>setSettings({...settings, print_hallmark: e.target.value})} rows={2} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Print Wastage</label>
                  <input value={settings['print_wastage'] || ''} placeholder="0.00%" onChange={e=>setSettings({...settings, print_wastage: e.target.value})} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Print Making Charges</label>
                  <textarea value={settings['print_making_charges'] || ''} placeholder="Gold ₹ 1,000.00/gm&#10;Silver ₹ 20.00/gm" onChange={e=>setSettings({...settings, print_making_charges: e.target.value})} rows={2} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Print Remarks</label>
                  <textarea value={settings['print_remarks'] || ''} placeholder="Subject to realization of cheque." onChange={e=>setSettings({...settings, print_remarks: e.target.value})} rows={2} className="w-full bg-background border border-gray-700 rounded p-3 text-sm text-textMain focus:border-primary outline-none resize-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-800 mt-4">
                <button type="submit" className="bg-primary hover:bg-primary-dark text-black px-6 py-3 rounded font-bold text-sm transition-colors flex items-center gap-2"><Save size={18} /> Save Settings</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-textMain mb-6">Roles & Permissions</h2>
            <div className="p-6 border border-gray-800 rounded-xl bg-black/20 text-center">
              <ShieldCheck size={48} className="mx-auto text-primary/40 mb-4" />
              <p className="text-gray-400">RBAC (Role Based Access Control) is active. Currently, you are logged in as the master SuperAdmin. Additional Cashier and Manager roles can be created here in a future update.</p>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-textMain mb-6">Database Management</h2>
            
            <div className="p-6 border border-gray-800 rounded-xl bg-black/20">
              <h3 className="text-lg font-bold text-white mb-2">Backup System</h3>
              <p className="text-sm text-gray-400 mb-6">Download a complete, instantaneous snapshot of your live SQLite database. Keep this file safe. It contains all your sales, inventory, and ledger history.</p>
              
              <div className="flex gap-4">
                <button onClick={handleBackup} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-black px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-3">
                  <Download size={20} /> Download Full Backup (.sqlite)
                </button>
                <button onClick={handleExcelBackup} className="bg-green-900/20 text-green-400 border border-green-900/30 hover:bg-green-500 hover:text-black px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-3">
                  <Download size={20} /> Download Database Data (Excel ZIP)
                </button>
              </div>
            </div>

            <div className="p-6 border border-red-900/30 rounded-xl bg-red-900/10 mt-6">
              <h3 className="text-lg font-bold text-red-400 mb-2">Restore System</h3>
              <p className="text-sm text-gray-400 mb-6">To restore from a backup, simply replace the `jewellery_erp.db` file in your root folder with your downloaded backup file and restart the server. (Manual restore recommended for safety).</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
