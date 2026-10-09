import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Service, AIRecommendationResponse } from '../types/index.js';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Info,
  ArrowRight,
  RotateCw,
  Wallet,
} from 'lucide-react';

interface NewOrderViewProps {
  setCurrentTab: (tab: string) => void;
  preSelectedServiceId?: number | null;
}

export const NewOrderView: React.FC<NewOrderViewProps> = ({
  setCurrentTab,
  preSelectedServiceId,
}) => {
  const { user, token, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  // AI Advisor States
  const [aiPlatform, setAiPlatform] = useState('Instagram');
  const [aiGoal, setAiGoal] = useState('Organic reach & Algorithm Push');
  const [aiBudget, setAiBudget] = useState('');
  const [aiQuantity, setAiQuantity] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendationResponse | null>(null);
  const [aiExpanded, setAiExpanded] = useState(true);

  // Fetch Services
  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.services) {
          setServices(data.services);
          if (data.services.length > 0) {
            const initialCat = data.services[0].category;
            setSelectedCategory(initialCat);
            setSelectedServiceId(data.services[0].service);
          }
        }
      })
      .catch((err) => console.error('Error fetching services:', err))
      .finally(() => setLoadingServices(false));
  }, []);

  // Handle preselection if provided from Services table
  useEffect(() => {
    if (preSelectedServiceId && services.length > 0) {
      const match = services.find((s) => s.service === preSelectedServiceId);
      if (match) {
        setSelectedCategory(match.category);
        setSelectedServiceId(match.service);
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    }
  }, [preSelectedServiceId, services]);

  const categories = Array.from(new Set(services.map((s) => s.category)));
  const filteredServices = services.filter((s) => s.category === selectedCategory);
  const activeService = services.find((s) => s.service === Number(selectedServiceId));

  // Charge Calculation in PKR: (Quantity / 1000) * Service Rate
  const numQty = Number(quantity) || 0;
  const calculatedCharge = activeService ? Number(((numQty / 1000) * activeService.rate).toFixed(2)) : 0;
  const hasInsufficientFunds = user ? user.balance < calculatedCharge : false;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    const firstService = services.find((s) => s.category === cat);
    if (firstService) {
      setSelectedServiceId(firstService.service);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) {
      showToast('Please login to place an order', 'error');
      return;
    }

    if (!selectedServiceId || !link || !quantity || numQty <= 0) {
      showToast('Please provide a valid service, link, and quantity', 'error');
      return;
    }

    if (activeService && (numQty < activeService.min || numQty > activeService.max)) {
      showToast(
        `Quantity must be between ${activeService.min.toLocaleString()} and ${activeService.max.toLocaleString()}`,
        'error'
      );
      return;
    }

    if (hasInsufficientFunds) {
      showToast(
        `Insufficient balance. Please add funds via Easypaisa to place this order (Rs ${calculatedCharge.toFixed(2)} PKR)`,
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          link,
          quantity: numQty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to place order', 'error');
      } else {
        showToast(`Order #${data.order.id} placed successfully!`, 'success');
        await refreshUser();
        setLink('');
        setQuantity('');
        setCurrentTab('orders');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error submitting order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Run AI Advisor Recommendation
  const handleAskAdvisor = async () => {
    setAiLoading(true);
    setAiRecommendation(null);

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: aiPlatform,
          goal: aiGoal,
          targetBudget: aiBudget ? parseFloat(aiBudget) : undefined,
          quantityNeeded: aiQuantity ? parseInt(aiQuantity, 10) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.recommendation) {
        setAiRecommendation(data.recommendation);
        showToast('AI Advisor analyzed services and found the top match!', 'success');
      } else {
        showToast(data.error || 'AI Advisor could not generate recommendation', 'error');
      }
    } catch (err: any) {
      showToast('Error consulting AI Advisor: ' + err.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const applyRecommendation = (rec: AIRecommendationResponse) => {
    const targetService = services.find((s) => s.service === rec.recommendedServiceId);
    if (targetService) {
      setSelectedCategory(targetService.category);
      setSelectedServiceId(targetService.service);
      if (aiQuantity && parseInt(aiQuantity, 10) >= targetService.min) {
        setQuantity(parseInt(aiQuantity, 10));
      } else {
        setQuantity(targetService.min);
      }
      showToast(`Selected Service #${targetService.service}: ${targetService.name}`, 'info');
    } else {
      showToast('Service applied to form', 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Zap className="w-7 h-7 text-indigo-400" />
          <span>New Order</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Place instant orders for premium engagement. Prices displayed in Pakistani Rupees (PKR / Rs).
        </p>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SMM SMART ADVISOR AI WIDGET */}
      {/* ---------------------------------------------------- */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl shadow-indigo-950/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  SMM Smart Advisor AI
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Not sure which service works best? Let AI analyze live API services for your goal in PKR.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAiExpanded(!aiExpanded)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center gap-1"
          >
            <span>{aiExpanded ? 'Minimize' : 'Open Advisor'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                aiExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {aiExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
            {/* Step 1: Target Platform */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Target Platform:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Instagram',
                  'TikTok',
                  'YouTube',
                  'Facebook',
                  'Twitter',
                  'Telegram',
                  'Spotify',
                ].map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setAiPlatform(plat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      aiPlatform === plat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-cyan-400'
                        : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Target Goal */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                2. Select Your Primary Growth Goal:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  'Fast engagement (Rapid social proof)',
                  'High retention (Monetization & Safe)',
                  'Organic reach & Algorithm Push',
                  'Viral push (Explore page / FYP)',
                  'Reseller profit (Lowest price per 1k)',
                  'Non-drop permanent stability',
                ].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setAiGoal(goal)}
                    className={`p-2.5 rounded-xl text-left text-xs font-medium transition-all border ${
                      aiGoal === goal
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 font-bold'
                        : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Quantity (Optional)
                </label>
                <input
                  type="number"
                  value={aiQuantity}
                  onChange={(e) => setAiQuantity(e.target.value)}
                  placeholder="e.g. 1000 or 5000"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Budget in PKR / Rs (Optional)
                </label>
                <input
                  type="number"
                  value={aiBudget}
                  onChange={(e) => setAiBudget(e.target.value)}
                  placeholder="e.g. 1500 PKR"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Advisor Action Button */}
            <button
              type="button"
              onClick={handleAskAdvisor}
              disabled={aiLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>SMM Smart Advisor is analyzing services in PKR...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Get AI Service Recommendation</span>
                </>
              )}
            </button>

            {/* Recommendation Result Card */}
            {aiRecommendation && (
              <div className="mt-4 p-4 rounded-2xl bg-indigo-950/40 border border-cyan-500/40 shadow-inner space-y-3 animate-in fade-in-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500 text-slate-950">
                      Top Match #{aiRecommendation.recommendedServiceId}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {aiRecommendation.serviceName}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-emerald-400 font-mono">
                    Rs {aiRecommendation.pricePerK.toFixed(2)} PKR / 1,000
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-cyan-400">Why this service: </strong>
                  {aiRecommendation.reason}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-[#0F172A]/70 p-2.5 rounded-xl border border-indigo-900/60">
                  <div>
                    <span className="text-slate-400 block">Delivery Speed:</span>
                    <span className="text-white font-semibold">{aiRecommendation.expectedSpeed}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Quality/Retention:</span>
                    <span className="text-emerald-400 font-semibold">{aiRecommendation.retentionQuality}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block">Limits:</span>
                    <span className="text-slate-200 font-semibold">
                      Min {aiRecommendation.min.toLocaleString()} - Max {aiRecommendation.max.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Pros list */}
                {aiRecommendation.pros && aiRecommendation.pros.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Strategic Advantages:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {aiRecommendation.pros.map((pro, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{pro}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategic Tip */}
                {aiRecommendation.strategicTip && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Algorithm Tip: </strong>
                      {aiRecommendation.strategicTip}
                    </div>
                  </div>
                )}

                {/* Pre-fill Action */}
                <button
                  type="button"
                  onClick={() => applyRecommendation(aiRecommendation)}
                  className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Select This Service & Pre-Fill Order Form Below</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* STANDARD ORDER FORM */}
      {/* ---------------------------------------------------- */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <span>Order Details (PKR)</span>
        </h2>

        {loadingServices ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading synced services in PKR...</span>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-5">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Service Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Service</span>
                {activeService && (
                  <span className="text-emerald-400 font-bold text-xs font-mono">
                    Rs {activeService.rate.toFixed(2)} PKR / 1,000
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {filteredServices.map((srv) => (
                    <option key={srv.service} value={srv.service}>
                      #{srv.service} - {srv.name} — Rs {srv.rate.toFixed(2)}/1K
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Service Details Card */}
            {activeService && (
              <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                      ID: {activeService.service}
                    </span>
                    {activeService.refill && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        Refill Guarantee
                      </span>
                    )}
                    {activeService.qualityBadge && (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                        {activeService.qualityBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    Min: <strong className="text-white">{activeService.min.toLocaleString()}</strong> — Max:{' '}
                    <strong className="text-white">{activeService.max.toLocaleString()}</strong>
                  </div>
                </div>
                {activeService.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {activeService.description}
                  </p>
                )}
              </div>
            )}

            {/* Link Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Link / URL
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.instagram.com/username or video link"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Make sure your profile or post is public before placing order.
              </span>
            </div>

            {/* Quantity Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Quantity
                </label>
                {activeService && (
                  <span className="text-[11px] text-slate-400">
                    Min: {activeService.min.toLocaleString()} | Max: {activeService.max.toLocaleString()}
                  </span>
                )}
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                min={activeService?.min || 1}
                max={activeService?.max || 1000000}
                placeholder={activeService ? `e.g. ${activeService.min}` : 'Enter amount'}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                required
              />
            </div>

            {/* Price & Summary Box in PKR */}
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block">Total Calculated Charge:</span>
                <div className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-1.5">
                  <span>Rs {calculatedCharge.toFixed(2)} PKR</span>
                </div>
              </div>

              {hasInsufficientFunds ? (
                <button
                  type="button"
                  onClick={() => setCurrentTab('deposit')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Add Funds via Easypaisa</span>
                </button>
              ) : (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Available Balance:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    Rs {user?.balance.toFixed(2) || '0.00'} PKR
                  </span>
                </div>
              )}
            </div>

            {/* Insufficient balance alert */}
            {hasInsufficientFunds && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  Your balance (Rs {user?.balance.toFixed(2)} PKR) is insufficient for this order (Rs{' '}
                  {calculatedCharge.toFixed(2)} PKR). Please top up via Easypaisa.
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || hasInsufficientFunds || numQty <= 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Place Order (Rs {calculatedCharge.toFixed(2)})</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
