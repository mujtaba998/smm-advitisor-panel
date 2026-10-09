import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { User, Order, Deposit, Service, AdminStats, OrderStatus } from '../types/index.js';
import {
  ShieldCheck,
  Users,
  ShoppingBag,
  Wallet,
  Settings,
  TrendingUp,
  CheckCircle2,
  Search,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'orders' | 'deposits' | 'services'>('stats');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [defaultMarkup, setDefaultMarkup] = useState<number>(10);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [depositFilter, setDepositFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

  // Modal / Action states
  const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState('');
  const [balanceAdjustAction, setBalanceAdjustAction] = useState<'add' | 'subtract'>('add');

  const [syncingApi, setSyncingApi] = useState(false);
  const [updatingMarkup, setUpdatingMarkup] = useState(false);

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes, ordersRes, depositsRes, servicesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/deposits', { headers }),
        fetch('/api/admin/services', { headers }),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.stats);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }
      if (ordersRes.ok) {
        const o = await ordersRes.json();
        setOrders(o.orders || []);
      }
      if (depositsRes.ok) {
        const d = await depositsRes.json();
        setDeposits(d.deposits || []);
      }
      if (servicesRes.ok) {
        const srv = await servicesRes.json();
        setServices(srv.services || []);
        setDefaultMarkup(srv.defaultMarkupPercent || 10);
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      showToast('Error loading admin records: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  // Adjust User Balance in PKR
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser || !balanceAdjustAmount) return;

    try {
      const res = await fetch(`/api/admin/users/${balanceModalUser.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(balanceAdjustAmount),
          action: balanceAdjustAction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to adjust balance', 'error');
      } else {
        showToast(data.message || 'Balance updated', 'success');
        setBalanceModalUser(null);
        setBalanceAdjustAmount('');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Toggle User Status
  const handleToggleUserStatus = async (targetUser: User) => {
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`User status set to ${newStatus}`, 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Process Deposit (Approve / Reject) in PKR
  const handleProcessDeposit = async (depositId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to process deposit', 'error');
      } else {
        showToast(data.message || `Deposit marked as ${status}`, 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast(`Order #${orderId} status set to ${status}`, 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Resend Order to API
  const handleResendOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to dispatch order to API', 'error');
      } else {
        showToast(data.message || 'Order re-sent to API successfully', 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Sync Services from Provider API
  const handleSyncServices = async () => {
    setSyncingApi(true);
    try {
      const res = await fetch('/api/admin/services/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Services synced successfully', 'success');
        fetchAdminData();
      } else {
        showToast(data.error || 'Sync failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSyncingApi(false);
    }
  };

  // Update Global Markup
  const handleSaveGlobalMarkup = async () => {
    setUpdatingMarkup(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ defaultMarkupPercent: defaultMarkup }),
      });

      if (res.ok) {
        showToast(`Global profit markup updated to ${defaultMarkup}%`, 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingMarkup(false);
    }
  };

  // Toggle Service Active Status
  const handleToggleService = async (srv: Service) => {
    const newStatus = srv.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`/api/admin/services/${srv.service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Service #${srv.service} set to ${newStatus}`, 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return !userSearch || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    return !orderSearch || o.id.toLowerCase().includes(q) || o.userEmail.toLowerCase().includes(q) || o.serviceName.toLowerCase().includes(q);
  });

  const filteredDeposits = deposits.filter((d) => {
    if (depositFilter === 'All') return true;
    return d.status === depositFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Root Control (PKR)
            </span>
            <span className="text-xs text-slate-400">Authenticated: Mujtaba123</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <span>Administrator Control Center (PKR)</span>
          </h1>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 self-start sm:self-auto border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Tab Switcher */}
      <div className="bg-[#1E293B] border border-slate-700/80 p-1.5 rounded-2xl flex flex-wrap gap-1">
        {[
          { id: 'stats', label: 'Overview', icon: TrendingUp },
          { id: 'deposits', label: 'Easypaisa Deposits', icon: Wallet, badge: stats?.pendingDepositsCount },
          { id: 'orders', label: 'Orders Management', icon: ShoppingBag },
          { id: 'users', label: 'Users & Balances', icon: Users },
          { id: 'services', label: 'Services & Markup', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: OVERVIEW STATS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats?.totalUsers ?? 0}</div>
              <p className="text-[11px] text-slate-400 mt-1">Excludes admin account</p>
            </div>

            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats?.totalOrders ?? 0}</div>
              <p className="text-[11px] text-slate-400 mt-1">Processed in PKR</p>
            </div>

            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Total Revenue (PKR)</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                Rs {stats?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">10% profit margin included</p>
            </div>

            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Pending Deposits</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                {stats?.pendingDepositsCount ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Rs {(stats?.pendingDepositsTotalPkr || 0).toLocaleString()} PKR waiting verification
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">System Configuration Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#0F172A] rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block">Currency Standard</span>
                <div className="text-emerald-400 font-bold text-sm">
                  Pakistani Rupee (PKR / Rs)
                </div>
                <div className="text-slate-400 text-[11px]">Direct 1:1 Easypaisa crediting</div>
              </div>

              <div className="p-4 bg-[#0F172A] rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block">Easypaisa Gateway</span>
                <div className="text-emerald-400 font-bold">Sultana nisreen</div>
                <div className="font-mono text-slate-300 text-[11px]">+92 316 6967334</div>
              </div>

              <div className="p-4 bg-[#0F172A] rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block">SMM Provider API Key</span>
                <div className="text-cyan-400 font-mono text-[11px] truncate">
                  941c5ea8cb2e0e84d2b0be7f959794f2fdd66f31
                </div>
                <div className="text-slate-400 text-[11px]">10% hidden margin auto-applied</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: EASYPAISA DEPOSITS MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'deposits' && (
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Easypaisa Trx Verification (PKR)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Approving automatically increments the user's balance directly with the requested PKR amount.
              </p>
            </div>

            <div className="flex gap-1 bg-[#0F172A] p-1 rounded-xl border border-slate-800">
              {['Pending', 'Approved', 'Rejected', 'All'].map((f) => (
                <button
                  key={f}
                  onClick={() => setDepositFilter(f as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    depositFilter === f ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredDeposits.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/50" />
              <p className="text-sm font-semibold text-slate-300">No {depositFilter} deposits</p>
              <p className="text-xs text-slate-500">All submissions are clear and up to date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Deposit ID</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Trx ID</th>
                    <th className="py-3 px-3">Amount (PKR)</th>
                    <th className="py-3 px-3">Sender Info</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredDeposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-300">{d.id}</td>
                      <td className="py-3 px-3 font-medium text-white">{d.userEmail}</td>
                      <td className="py-3 px-3 font-mono font-extrabold text-amber-300 bg-amber-950/20 px-2 rounded">
                        {d.trxId}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400 font-mono">
                        Rs {d.amountPkr.toLocaleString()} PKR
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px]">
                        {d.senderName || d.senderNumber ? (
                          <>
                            {d.senderName && <span className="block font-medium">{d.senderName}</span>}
                            {d.senderNumber && <span className="text-slate-400 font-mono">{d.senderNumber}</span>}
                          </>
                        ) : (
                          <span className="text-slate-500 italic">Not provided</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            d.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : d.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {d.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleProcessDeposit(d.id, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors shadow-sm"
                            >
                              Approve (+Rs {d.amountPkr.toLocaleString()})
                            </button>
                            <button
                              onClick={() => handleProcessDeposit(d.id, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white font-bold text-[11px] transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: ORDER MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'orders' && (
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <span>All User Orders (PKR)</span>
              </h2>
              <p className="text-xs text-slate-400">
                View orders, modify statuses, or re-send orders to provider API.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders..."
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No orders found in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Service</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Charge (PKR)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">API Order ID</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-300">{o.id}</td>
                      <td className="py-3 px-3 text-slate-300 truncate max-w-[140px]">
                        {o.userEmail}
                      </td>
                      <td className="py-3 px-3 max-w-[200px] truncate text-white" title={o.serviceName}>
                        {o.serviceName}
                      </td>
                      <td className="py-3 px-3 font-mono">{o.quantity.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        Rs {o.charge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                          className="bg-[#0F172A] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {['Pending', 'In progress', 'Completed', 'Partial', 'Canceled', 'Refunded'].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {o.providerOrderId || (
                          <span className="text-amber-400/80 italic">Not dispatched</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleResendOrder(o.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-semibold transition-colors"
                        >
                          Re-send API
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: USER MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>User Accounts & Balances (PKR)</span>
              </h2>
              <p className="text-xs text-slate-400">
                View registered users, manually credit or debit PKR balances, and manage account statuses.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">User ID</th>
                  <th className="py-3 px-3">Username</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Balance (PKR)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">{u.id}</td>
                    <td className="py-3 px-3 font-semibold text-white">@{u.username}</td>
                    <td className="py-3 px-3 text-slate-300">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-sm">
                      Rs {u.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setBalanceModalUser(u);
                          setBalanceAdjustAmount('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        Adjust Balance
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white'
                              : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: SERVICES & MARKUP MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>Price Markup & Auto-Sync Engine (PKR)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Specification: Fetch services via API, automatically multiply provider price by 1.10 (add 10% profit margin). Prices are in PKR and markup is hidden from end users.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-700 px-3 py-2 rounded-xl">
                <span className="text-xs font-semibold text-slate-400">Profit Markup:</span>
                <input
                  type="number"
                  value={defaultMarkup}
                  onChange={(e) => setDefaultMarkup(Number(e.target.value))}
                  min="0"
                  max="500"
                  className="w-16 bg-transparent text-sm font-bold text-white text-center focus:outline-none"
                />
                <span className="text-xs font-bold text-indigo-400">%</span>
              </div>

              <button
                onClick={handleSaveGlobalMarkup}
                disabled={updatingMarkup}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {updatingMarkup ? 'Saving...' : 'Update Markup'}
              </button>

              <button
                onClick={handleSyncServices}
                disabled={syncingApi}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingApi ? 'animate-spin' : ''}`} />
                <span>Sync from Provider API</span>
              </button>
            </div>
          </div>

          {/* Services List Table */}
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Active Service Catalog in PKR ({services.length})</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Service Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Provider Raw (PKR)</th>
                    <th className="py-3 px-3">Customer Price (+{defaultMarkup}%)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {services.map((srv) => (
                    <tr key={srv.service} className="hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-400">{srv.service}</td>
                      <td className="py-3 px-3 max-w-xs truncate font-medium text-white">{srv.name}</td>
                      <td className="py-3 px-3 text-slate-400">{srv.category}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        Rs {(srv.original_rate || srv.rate / 1.1).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        Rs {srv.rate.toFixed(2)} PKR
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            srv.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {srv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleService(srv)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            srv.status === 'active'
                              ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white'
                              : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {srv.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal in PKR */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Adjust User Balance (PKR)</span>
              </h3>
              <button
                onClick={() => setBalanceModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#0F172A] rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400 block">Target Account:</span>
              <span className="font-bold text-white text-sm">
                @{balanceModalUser.username} ({balanceModalUser.email})
              </span>
              <div className="mt-1 text-slate-400">
                Current Balance:{' '}
                <strong className="text-emerald-400">Rs {balanceModalUser.balance.toFixed(2)} PKR</strong>
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceAdjustAction('add')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    balanceAdjustAction === 'add'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-[#0F172A] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Credit (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAdjustAction('subtract')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    balanceAdjustAction === 'subtract'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-[#0F172A] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Debit (-)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount in PKR (Rs)
                </label>
                <input
                  type="number"
                  step="1"
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                  placeholder="e.g. 500 or 1000"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
