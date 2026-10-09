import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Wallet,
  ListFilter,
  ShieldCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  if (!user) return null;

  const mainLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'new-order', label: 'New Order (AI)', icon: PlusCircle, isNew: true },
    { id: 'orders', label: 'Order History', icon: ShoppingBag, badge: null },
    { id: 'services', label: 'Services & Pricing', icon: ListFilter, badge: 'PKR' },
    { id: 'deposit', label: 'Add Funds (Easypaisa)', icon: Wallet, badge: 'EP' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] border-r border-slate-800 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation */}
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {mainLinks.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.isNew && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-400 text-slate-950">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI
                </span>
              )}
              {item.badge && !item.isNew && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-emerald-500/20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Admin Section if Admin */}
      {user.role === 'admin' && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-amber-400/80 flex items-center justify-between">
            <span>Administration</span>
            <Lock className="w-3 h-3 text-amber-400" />
          </div>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              currentTab === 'admin'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Management</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 font-bold">
              Root
            </span>
          </button>
        </div>
      )}

      {/* Easypaisa Promo / Info Card in PKR */}
      <div className="mt-auto pt-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Easypaisa (PKR)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
              0% Fee
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Transfer directly in PKR via Easypaisa App or 3737 code. Instant manual crediting.
          </p>
          <button
            onClick={() => setCurrentTab('deposit')}
            className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm text-center block"
          >
            Add Funds (Easypaisa)
          </button>
        </div>

        {/* Currency & API notice */}
        <div className="mt-3 px-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Currency: Pakistani Rupee (PKR)</span>
          </div>
          <span className="text-slate-400 font-semibold">10% Margin</span>
        </div>
      </div>
    </aside>
  );
};
