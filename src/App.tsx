import React, { useState } from 'react';
import { PayShieldProvider, usePayShield } from './context/PayShieldContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { OverviewView } from './components/views/OverviewView';
import { SimulatorView } from './components/views/SimulatorView';
import { NetworkControlView } from './components/views/NetworkControlView';
import { FraudMonitoringView } from './components/views/FraudMonitoringView';
import { OfflineQueueView } from './components/views/OfflineQueueView';
import { ReconciliationView } from './components/views/ReconciliationView';
import { AuditLogView } from './components/views/AuditLogView';
import { Menu, Shield, Radio, Layers, WifiOff, Cpu } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { networkStatus, offlineQueue } = usePayShield();

  const pendingCount = offlineQueue.filter(q => q.status === 'PENDING_SYNC').length;

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Sticky Header */}
      <Header />

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto bg-navy-950/60 scanline p-4 md:p-6 lg:p-8 space-y-6">
          {/* Mobile Menu Trigger & Breadcrumb */}
          <div className="lg:hidden flex items-center justify-between pb-2 border-b border-navy-850">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-navy-900 border border-navy-750 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold"
            >
              <Menu className="h-4 w-4 text-shield-cyan" />
              <span>Navigation Menu</span>
            </button>

            <span className="text-xs font-mono font-bold text-shield-cyan uppercase">
              {activeTab}
            </span>
          </div>

          {/* Active View Rendering */}
          {activeTab === 'overview' && <OverviewView setActiveTab={setActiveTab} />}
          {activeTab === 'simulator' && <SimulatorView setActiveTab={setActiveTab} />}
          {activeTab === 'network' && <NetworkControlView />}
          {activeTab === 'fraud' && <FraudMonitoringView />}
          {activeTab === 'queue' && <OfflineQueueView setActiveTab={setActiveTab} />}
          {activeTab === 'reconciliation' && <ReconciliationView setActiveTab={setActiveTab} />}
          {activeTab === 'audit' && <AuditLogView />}

          {/* Bottom Persistent Telemetry Ticker */}
          <footer className="pt-6 pb-2 text-[11px] font-mono text-slate-500 border-t border-navy-850/80 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-400">
                <Shield className="h-3 w-3 text-shield-cyan" />
                PayShield Nexus Node Engine v2.4
              </span>
              <span>•</span>
              <span className="text-slate-500">Partition-Tolerant Payment Architecture</span>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${networkStatus === 'ONLINE' ? 'bg-emerald-400' : networkStatus === 'DEGRADED' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                State: {networkStatus}
              </span>
              {pendingCount > 0 && (
                <span className="text-amber-400 font-semibold">
                  Queue: {pendingCount} offline txns
                </span>
              )}
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
