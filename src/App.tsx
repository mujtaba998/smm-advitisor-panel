import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthView } from './views/AuthView';
import { AdminLoginView } from './views/AdminLoginView';
import { DashboardView } from './views/DashboardView';
import { NewOrderView } from './views/NewOrderView';
import { OrdersView } from './views/OrdersView';
import { DepositView } from './views/DepositView';
import { ServicesView } from './views/ServicesView';
import { AdminView } from './views/AdminView';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => window.location.pathname === '/admin');
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<number | null>(null);

  // Sync URL path on mount & popstate
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/admin') {
        setIsAdminRoute(true);
        setCurrentTab('admin');
      } else {
        setIsAdminRoute(false);
        if (currentTab === 'admin') setCurrentTab('dashboard');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Update browser URL silently when switching tabs
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'admin') {
      setIsAdminRoute(true);
      window.history.pushState(null, '', '/admin');
    } else {
      if (window.location.pathname === '/admin') {
        setIsAdminRoute(false);
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handleBackToClient = () => {
    setIsAdminRoute(false);
    setCurrentTab('dashboard');
    window.history.pushState(null, '', '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
          Initializing SMM Engine...
        </span>
      </div>
    );
  }

  // 1. If user navigated to /admin and is not logged in as admin:
  if (isAdminRoute && (!user || user.role !== 'admin')) {
    return <AdminLoginView onBackToClient={handleBackToClient} />;
  }

  // 2. If user is not logged in on standard client route:
  if (!user) {
    return <AuthView />;
  }

  const handleSelectServiceForOrder = (serviceId: number) => {
    setPreSelectedServiceId(serviceId);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-50 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={handleTabChange} />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={handleTabChange} />

        {/* Dynamic View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && <DashboardView setCurrentTab={handleTabChange} />}
          {currentTab === 'new-order' && (
            <NewOrderView
              setCurrentTab={handleTabChange}
              preSelectedServiceId={preSelectedServiceId}
            />
          )}
          {currentTab === 'orders' && (
            <OrdersView
              setCurrentTab={handleTabChange}
              onSelectServiceForReorder={handleSelectServiceForOrder}
            />
          )}
          {currentTab === 'deposit' && <DepositView />}
          {currentTab === 'services' && (
            <ServicesView
              setCurrentTab={handleTabChange}
              onSelectService={handleSelectServiceForOrder}
            />
          )}
          {currentTab === 'admin' && (
            user.role === 'admin' ? (
              <AdminView />
            ) : (
              <div className="py-20 text-center text-slate-400">
                <p className="text-base font-bold text-rose-400">Access Restricted</p>
                <p className="text-xs mt-1">
                  Administrator credentials required (Mujtaba123 / Mujtaba123?).
                </p>
                <button
                  onClick={handleBackToClient}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Return to Dashboard
                </button>
              </div>
            )
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
