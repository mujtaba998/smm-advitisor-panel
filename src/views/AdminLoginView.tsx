import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

interface AdminLoginViewProps {
  onBackToClient: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onBackToClient }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter admin username and password', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      showToast('Authenticated as Administrator. Welcome to Root Control.', 'success');
    } else {
      setError(result.error || 'Invalid administrator credentials');
      showToast(result.error || 'Invalid administrator credentials', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-[#1E293B] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 shadow-lg shadow-amber-500/30 mb-4">
            <ShieldCheck className="w-7 h-7 text-slate-950" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2">
            Restricted Access
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access to root management, user balances, orders, and Easypaisa verification.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onBackToClient}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Client Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
