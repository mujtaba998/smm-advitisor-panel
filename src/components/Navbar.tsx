import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Wallet,
  ShieldCheck,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    SMM ADVISOR
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PKR (Rs)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                  Pakistan SMM & AI Growth Panel
                </p>
              </div>
            </button>
          </div>

          {/* Quick Actions & Balance in PKR */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Balance Pill (PKR) */}
            <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-inner">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider leading-none">
                  Balance (PKR)
                </div>
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <span>Rs {user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab('deposit')}
                className="ml-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm flex items-center gap-1"
              >
                <span>Add</span>
                <span className="text-[10px] bg-slate-950 text-emerald-300 font-bold px-1 rounded-sm">
                  EP
                </span>
              </button>
            </div>

            {/* Admin Switcher (If Admin) */}
            {user.role === 'admin' && (
              <button
                onClick={() => setCurrentTab(currentTab === 'admin' ? 'dashboard' : 'admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shadow-sm ${
                  currentTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {/* User Profile / Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border border-indigo-500/40 bg-slate-800"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.name || user.username}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    @{user.username}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
