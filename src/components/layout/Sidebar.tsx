import React from 'react';
import {
  Home,
  Send,
  Receipt,
  ShieldCheck,
  WifiOff,
  RefreshCw,
  Clock,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { usePayShield } from '../../context/PayShieldContext';

export type NavTab =
  | 'home'
  | 'pay'
  | 'transactions'
  | 'security'
  | 'offline'
  | 'settlement'
  | 'activity';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { offlineQueue, networkStatus, auditLogs } = usePayShield();

  const pendingQueueCount = offlineQueue.filter(q => q.status === 'PENDING_SYNC').length;
  const criticalAuditCount = auditLogs.filter(a => a.severity === 'CRITICAL').length;

  const navItems = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: Home,
      badge: null,
    },
    {
      id: 'pay' as NavTab,
      label: 'Pay',
      icon: Send,
      badge: null,
    },
    {
      id: 'transactions' as NavTab,
      label: 'Transactions',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'security' as NavTab,
      label: 'Payment Security',
      icon: ShieldCheck,
      badge: criticalAuditCount > 0 ? `${criticalAuditCount} Blocks` : null,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'offline' as NavTab,
      label: 'Offline Payments',
      icon: WifiOff,
      badge: pendingQueueCount > 0 ? `${pendingQueueCount}` : null,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'settlement' as NavTab,
      label: 'Settlement & Reconciliation',
      icon: RefreshCw,
      badge: pendingQueueCount > 0 ? 'Pending' : null,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'activity' as NavTab,
      label: 'Activity Log',
      icon: Clock,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out shadow-xs ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Payment Navigation
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Protection & Partition Status Card */}
        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-800">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              PROTECTION ACTIVE
            </span>
            <span className={`h-2 w-2 rounded-full ${networkStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>

          <div className="space-y-1 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>Inline Screening:</span>
              <span className="text-emerald-700 font-medium">Active (7 Rules)</span>
            </div>
            <div className="flex justify-between">
              <span>Partition Tolerance:</span>
              <span className="text-blue-700 font-medium">₹2,000 Quota</span>
            </div>
            <div className="flex justify-between">
              <span>Reconciliation:</span>
              <span className="text-slate-700 font-medium">Deterministic</span>
            </div>
          </div>
        </div>

        {/* Workspace Footer Disclaimer */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="text-[11px] text-slate-500 font-medium leading-tight">
            Simulation Prototype
          </div>
          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
            No real money transfers
          </div>
        </div>
      </aside>
    </>
  );
};
