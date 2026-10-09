import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Order, OrderStatus } from '../types/index.js';
import {
  ShoppingBag,
  Search,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';

interface OrdersViewProps {
  setCurrentTab: (tab: string) => void;
  onSelectServiceForReorder?: (serviceId: number) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  setCurrentTab,
  onSelectServiceForReorder,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.status.toLowerCase() === statusFilter.toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      o.id.toLowerCase().includes(query) ||
      o.serviceName.toLowerCase().includes(query) ||
      o.link.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'In progress':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse';
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Canceled':
      case 'Refunded':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Partial':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const handleReorder = (serviceId: number) => {
    if (onSelectServiceForReorder) {
      onSelectServiceForReorder(serviceId);
    }
    setCurrentTab('new-order');
    showToast(`Loaded service #${serviceId} for new order`, 'info');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-indigo-400" />
            <span>Orders History (PKR)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status tracking and automated fulfillment log in Pakistani Rupees.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('new-order')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {['All', 'In progress', 'Completed', 'Pending', 'Canceled', 'Refunded'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#0F172A] text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, link, or service..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No orders found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {orders.length === 0
                ? 'Your order list is currently empty. Place your first order to get started.'
                : 'No orders match your selected filters.'}
            </p>
            {orders.length === 0 && (
              <button
                onClick={() => setCurrentTab('new-order')}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Place Your First Order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Link</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Charge (PKR)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{o.id}</td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString()}{' '}
                      <span className="text-[10px]">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate" title={o.serviceName}>
                        {o.serviceName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {o.serviceId}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <a
                        href={o.link.startsWith('http') ? o.link : `https://${o.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 truncate font-mono text-[11px]"
                      >
                        <span className="truncate">{o.link}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {o.quantity.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      Rs {o.charge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadge(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleReorder(o.serviceId)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-[11px] font-semibold transition-colors"
                      >
                        Re-order
                      </button>
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
