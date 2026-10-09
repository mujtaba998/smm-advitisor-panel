import React, { useState, useEffect } from 'react';
import type { Service } from '../types/index.js';
import {
  ListFilter,
  Search,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface ServicesViewProps {
  setCurrentTab: (tab: string) => void;
  onSelectService: (serviceId: number) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  setCurrentTab,
  onSelectService,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [selectedServiceModal, setSelectedServiceModal] = useState<Service | null>(null);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.services) setServices(data.services);
      })
      .catch((err) => console.error('Error fetching services:', err))
      .finally(() => setLoading(false));
  }, []);

  const platforms = [
    'All',
    'Instagram',
    'TikTok',
    'YouTube',
    'Facebook',
    'Twitter',
    'Telegram',
    'Spotify',
  ];

  const filteredServices = services.filter((s) => {
    const matchesPlatform = platformFilter === 'All' || s.platform.toLowerCase() === platformFilter.toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query) ||
      String(s.service).includes(query);
    return matchesPlatform && matchesSearch;
  });

  const handleOrderClick = (serviceId: number) => {
    onSelectService(serviceId);
    setCurrentTab('new-order');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <ListFilter className="w-7 h-7 text-indigo-400" />
          <span>Services & Rates (PKR)</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          All active services in Pakistani Rupees (Rs). Prices include automatic 10% platform margin.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-lg">
        {/* Platform Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                platformFilter === plat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#0F172A] text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {plat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services by ID, platform, or title..."
            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading services catalog...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <p className="text-base font-semibold text-slate-300">No services match your search</p>
            <p className="text-xs text-slate-500">Try adjusting your platform filter or keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#0F172A] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-16">ID</th>
                  <th className="py-3.5 px-4">Service Name</th>
                  <th className="py-3.5 px-4">Rate / 1K (PKR)</th>
                  <th className="py-3.5 px-4">Min / Max</th>
                  <th className="py-3.5 px-4">Refill</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredServices.map((srv) => (
                  <tr key={srv.service} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {srv.service}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white max-w-md">{srv.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {srv.category}
                        </span>
                        {srv.qualityBadge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {srv.qualityBadge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-emerald-400 text-sm font-mono">
                        Rs {srv.rate.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        PKR per 1,000
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {srv.min.toLocaleString()} / {srv.max.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {srv.refill ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Guaranteed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                          <span>No Refill</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {srv.description && (
                        <button
                          type="button"
                          onClick={() => setSelectedServiceModal(srv)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                        >
                          View Info
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOrderClick(srv.service)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1 ml-auto"
                      >
                        <Zap className="w-3 h-3 text-cyan-300" />
                        <span>Order</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Details Modal */}
      {selectedServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  ID: #{selectedServiceModal.service}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedServiceModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedServiceModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#0F172A] rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {selectedServiceModal.description || 'No additional description provided.'}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#0F172A] rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Price per 1,000</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  Rs {selectedServiceModal.rate.toFixed(2)} PKR
                </span>
              </div>
              <div className="p-2.5 bg-[#0F172A] rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Min / Max Order</span>
                <span className="font-semibold text-white">
                  {selectedServiceModal.min.toLocaleString()} - {selectedServiceModal.max.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const srvId = selectedServiceModal.service;
                  setSelectedServiceModal(null);
                  handleOrderClick(srvId);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Order This Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
