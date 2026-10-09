import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Deposit } from '../types/index.js';
import {
  Wallet,
  Copy,
  Check,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
} from 'lucide-react';

export const DepositView: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [amountPkr, setAmountPkr] = useState('');
  const [trxId, setTrxId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderNumber, setSenderNumber] = useState('');

  // Copy states
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Exact Easypaisa details per specification
  const accountTitle = 'Sultana nisreen';
  const accountNumber = '+92 316 6967334';

  const fetchDeposits = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/deposits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      console.error('Error fetching deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [token]);

  const copyToClipboard = (text: string, type: 'title' | 'number') => {
    navigator.clipboard.writeText(text);
    if (type === 'title') {
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    } else {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
    showToast(`Copied to clipboard: ${text}`, 'success');
  };

  const pkrNum = parseFloat(amountPkr) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountPkr || pkrNum < 100) {
      showToast('Minimum deposit is 100 PKR', 'error');
      return;
    }

    if (!trxId || trxId.trim().length < 5) {
      showToast('Please enter a valid Easypaisa Transaction ID (Trx ID)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountPkr: pkrNum,
          trxId: trxId.trim(),
          senderName,
          senderNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit deposit', 'error');
      } else {
        showToast('Deposit request submitted! Status is Pending approval.', 'success');
        setAmountPkr('');
        setTrxId('');
        setSenderName('');
        setSenderNumber('');
        fetchDeposits();
      }
    } catch (err: any) {
      showToast(err.message || 'Network error submitting deposit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Wallet className="w-7 h-7 text-emerald-400" />
          <span>Add Funds (Easypaisa Pakistan)</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Direct manual deposit in Pakistani Rupees (PKR / Rs). 1:1 balance credit with zero exchange fees.
        </p>
      </div>

      {/* Withdrawal Policy Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <strong className="text-amber-300">Policy Notice: </strong>
          Deposits are non-withdrawable (Withdrawal Allowed: False). All added PKR balance is reserved for service orders.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Easypaisa Account Details Card (Left 6 cols) */}
        <div className="md:col-span-6 space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-2 border-emerald-500/40 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-emerald-500/30">
                  EP
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    Easypaisa Pakistan
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    Official Manual Gateway (PKR)
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Direct PKR
              </span>
            </div>

            {/* Account Title Box */}
            <div className="space-y-3.5">
              <div className="bg-[#0F172A] p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Account Title (Recipient Name)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white tracking-wide">
                    {accountTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(accountTitle, 'title')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    {copiedTitle ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Account Number Box */}
              <div className="bg-[#0F172A] p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Easypaisa Mobile Number
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-extrabold text-emerald-400">
                    {accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(accountNumber, 'number')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step-by-Step Flow Instructions */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
              <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
                Tariqa-e-Kaar (Step-by-step):
              </span>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <p>
                    Apne <strong>Easypaisa App</strong> ya bank app se <strong>{accountNumber}</strong> ({accountTitle}) par PKR transfer karein.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <p>
                    Transfer ke baad SMS ya receipt se <strong>Transaction ID (Trx ID)</strong> copy karein.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <p>
                    Neeche diye gaye form mein amount aur Trx ID daal kar submit karein. Verification ke baad aapka balance turant barh jayega.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Submission Form (Right 6 cols) */}
        <div className="md:col-span-6">
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Submit Easypaisa Deposit (PKR)</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Deposited Amount in PKR */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Deposited Amount (in PKR / Rs)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amountPkr}
                    onChange={(e) => setAmountPkr(e.target.value)}
                    placeholder="Min. 100 PKR (e.g. 500, 1000)"
                    min="100"
                    step="10"
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-4 pr-16 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                    PKR
                  </span>
                </div>
                {pkrNum > 0 && (
                  <div className="mt-1.5 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Balance Credit: Rs {pkrNum.toLocaleString()} PKR</span>
                  </div>
                )}
              </div>

              {/* Unique Transaction ID (Trx ID) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Easypaisa Trx ID</span>
                  <span className="text-[11px] text-slate-400 lowercase">from 3737 SMS / receipt</span>
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="e.g. 3489201948..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase font-mono"
                  required
                />
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Sender Account Title (Optional)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Apne Easypaisa account ka naam"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Sender Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Sender Mobile Number (Optional)
                </label>
                <input
                  type="text"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="03xxxxxxxxx"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Deposit ({pkrNum > 0 ? `Rs ${pkrNum.toLocaleString()} PKR` : 'PKR'})</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* USER DEPOSIT HISTORY TABLE */}
      {/* ---------------------------------------------------- */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>My Deposit History (PKR)</span>
          </h3>
          <button
            onClick={fetchDeposits}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Loading your deposits...
          </div>
        ) : deposits.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No deposit requests submitted yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Your submitted Easypaisa requests and verification status will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Deposit ID</th>
                  <th className="py-3 px-3">Trx ID</th>
                  <th className="py-3 px-3">Amount (PKR)</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-300">{d.id}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white">{d.trxId}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      Rs {d.amountPkr.toLocaleString()} PKR
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          d.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : d.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {d.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                        {d.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {d.status === 'Pending' && <Clock className="w-3 h-3" />}
                        <span>{d.status}</span>
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
