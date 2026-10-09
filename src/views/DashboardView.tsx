import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types/index.js';
import {
  LayoutDashboard,
  Wallet,
  ShoppingBag,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  setCurrentTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentTab }) => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) return null;

  const totalSpentPkr = orders.reduce((acc, o) => acc + (o.charge || 0), 0);
  const activeOrdersCount = orders.filter((o) => o.status === 'In progress' || o.status === 'Pending').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'Completed').length;
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900/60 via-indigo-800/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Currency: Pakistani Rupee (PKR)
              </span>
              <span className="text-[11px] text-slate-400">Zero Demo Data Mode</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Khush Amdeed, {user.name || user.username}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Grow your social reach across Instagram, TikTok, YouTube & Facebook with real rates in Pakistani Rupees (PKR) and direct Easypaisa deposits.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => setCurrentTab('new-order')}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>New Order</span>
            </button>
            <button
              onClick={() => setCurrentTab('deposit')}
              className="py-3 px-4 rounded-2xl bg-[#0F172A] hover:bg-slate-900 border border-emerald-500/40 text-emerald-400 font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
            >
              <Wallet className="w-4 h-4" />
              <span>Deposit (Easypaisa)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid (PKR) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Available Balance */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Balance (PKR)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            Rs {user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pakistani Rupee available
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Orders</span>
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {orders.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {completedOrdersCount} completed
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-400">
            {activeOrdersCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Live automated processing
          </div>
        </div>

        {/* Total Spent in PKR */}
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spent (PKR)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            Rs {totalSpentPkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {orders.length} orders
          </div>
        </div>
      </div>

      {/* AI Advisor Banner */}
      <div className="rounded-3xl bg-[#1E293B] border border-indigo-500/30 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">SMM Smart Advisor AI</h3>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Specify your target platform and goal in PKR. The AI advisor picks the most suitable high-retention service to maximize organic reach and viral recommendations.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('new-order')}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>Ask AI Advisor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            <span>Recent Orders (PKR)</span>
          </h3>
          <button
            onClick={() => setCurrentTab('orders')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            View All ({orders.length})
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Clean database initialized</p>
            <p className="text-xs text-slate-500">
              Zero demo orders. Ready to place your first live order in PKR!
            </p>
            <button
              onClick={() => setCurrentTab('new-order')}
              className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
            >
              Start New Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Charge (PKR)</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-300">{o.id}</td>
                    <td className="py-3 px-3 max-w-xs truncate font-medium text-white">
                      {o.serviceName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-200">
                      {o.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      Rs {o.charge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
