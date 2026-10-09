import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Wallet,
  ListFilter,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'services',
      label: 'Services',
      icon: ListFilter,
    },
    {
      id: 'new-order',
      label: 'New Order',
      icon: PlusCircle,
      isSpecial: true,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
    },
    {
      id: 'deposit',
      label: 'Funds',
      icon: Wallet,
    },
    ...(user.role === 'admin'
      ? [
          {
            id: 'admin',
            label: 'Admin',
            icon: ShieldCheck,
            isAdmin: true,
          },
        ]
      : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className="relative -top-3 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-indigo-500/40 scale-105 ring-2 ring-cyan-400/50'
                      : 'bg-gradient-to-tr from-indigo-700 to-indigo-600 text-slate-100 shadow-indigo-900/50 hover:scale-105'
                  }`}
                >
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight ${
                    isActive ? 'text-cyan-400' : 'text-slate-300'
                  }`}
                >
                  New Order
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? item.isAdmin
                    ? 'text-amber-400 font-bold'
                    : 'text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {isActive && (
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                      item.isAdmin ? 'bg-amber-400' : 'bg-cyan-400 shadow-sm shadow-cyan-400'
                    }`}
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
