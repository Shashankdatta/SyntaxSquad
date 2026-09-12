import React, { useState } from 'react';
import { PayShieldProvider, usePayShield } from './context/PayShieldContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { HomeView } from './components/views/HomeView';
import { PayView } from './components/views/PayView';
import { TransactionsView } from './components/views/TransactionsView';
import { SecurityView } from './components/views/SecurityView';
import { OfflinePaymentsView } from './components/views/OfflinePaymentsView';
import { SettlementView } from './components/views/SettlementView';
import { ActivityLogView } from './components/views/ActivityLogView';
import { Menu, Shield, WifiOff, RefreshCw } from 'lucide-react';
import { formatCurrency } from './utils/crypto';

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { networkStatus, setNetworkStatus, selectedCard, offlineQueue } = usePayShield();

  const remainingOffline = Math.max(0, selectedCard.offlineCumulativeLimit - selectedCard.offlineCurrentSpent);
  const pendingCount = offlineQueue.filter(q => q.status === 'PENDING_SYNC').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-800">
      {/* Top Header */}
      <Header />

      {/* Calm Offline Notification Banner (Shown when network is partitioned) */}
      {networkStatus === 'PARTITIONED' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 md:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900 transition-all">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Offline mode active.</strong> Payments are limited, risk-screened, and queued for later reconciliation.
              <span className="hidden md:inline ml-2 text-amber-800">
                (Remaining allowance: {formatCurrency(remainingOffline)})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {pendingCount > 0 && (
              <button
                onClick={() => setActiveTab('settlement')}
                className="underline hover:text-amber-950 font-medium"
              >
                {pendingCount} pending settlement &rarr;
              </button>
            )}
            <button
              onClick={() => setNetworkStatus('ONLINE')}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] transition-colors shadow-2xs"
            >
              Restore Network
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Mobile Navigation Trigger */}
          <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-200">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs flex items-center gap-2 text-xs font-semibold"
            >
              <Menu className="h-4 w-4 text-blue-600" />
              <span>Navigation Menu</span>
            </button>

            <span className="text-xs font-bold text-slate-700 capitalize">
              {activeTab === 'security'
                ? 'Payment Security'
                : activeTab === 'settlement'
                ? 'Settlement & Reconciliation'
                : activeTab === 'offline'
                ? 'Offline Payments'
                : activeTab === 'activity'
                ? 'Activity Log'
                : activeTab}
            </span>
          </div>

          {/* Active View */}
          {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} />}
          {activeTab === 'pay' && <PayView setActiveTab={setActiveTab} />}
          {activeTab === 'transactions' && <TransactionsView setActiveTab={setActiveTab} />}
          {activeTab === 'security' && <SecurityView setActiveTab={setActiveTab} />}
          {activeTab === 'offline' && <OfflinePaymentsView setActiveTab={setActiveTab} />}
          {activeTab === 'settlement' && <SettlementView setActiveTab={setActiveTab} />}
          {activeTab === 'activity' && <ActivityLogView />}

          {/* Clean Fintech Footer */}
          <footer className="pt-6 pb-2 text-xs text-slate-500 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium text-slate-700">PayShield Nexus</span>
              <span>•</span>
              <span>Partition-Tolerant Payment Authorization Prototype</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Simulation Prototype — No Real Money Transfers</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <PayShieldProvider>
      <DashboardContent />
    </PayShieldProvider>
  );
}

export default App;
