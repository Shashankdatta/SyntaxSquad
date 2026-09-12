import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Network,
  ShieldAlert,
  Layers,
  CheckCircle2,
  FileText,
  Server,
  Cpu,
} from 'lucide-react';
import { usePayShield } from '../../context/PayShieldContext';

export type NavTab =
  | 'overview'
  | 'simulator'
  | 'network'
  | 'fraud'
  | 'queue'
  | 'reconciliation'
  | 'audit';

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
      id: 'overview' as NavTab,
      label: 'Overview Dashboard',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'simulator' as NavTab,
      label: 'Payment Simulator',
      shortLabel: 'Simulator',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'network' as NavTab,
      label: 'Network Control',
      shortLabel: 'Network',
      icon: Network,
      badge: networkStatus === 'PARTITIONED' ? 'PARTITION' : networkStatus === 'DEGRADED' ? 'DEGRADED' : null,
      badgeColor: networkStatus === 'PARTITIONED' ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      id: 'fraud' as NavTab,
      label: 'Fraud Monitoring',
      shortLabel: 'Fraud Rules',
      icon: ShieldAlert,
      badge: criticalAuditCount > 0 ? `${criticalAuditCount} Blocks` : null,
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    },
    {
      id: 'queue' as NavTab,
      label: 'Offline Transaction Queue',
      shortLabel: 'Offline Queue',
      icon: Layers,
      badge: pendingQueueCount > 0 ? `${pendingQueueCount}` : null,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse',
    },
    {
      id: 'reconciliation' as NavTab,
      label: 'Reconciliation Center',
      shortLabel: 'Reconciliation',
      icon: CheckCircle2,
      badge: null,
    },
    {
      id: 'audit' as NavTab,
      label: 'Audit Log',
      shortLabel: 'Audit Log',
      icon: FileText,
      badge: `${auditLogs.length}`,
      badgeColor: 'bg-navy-800 text-slate-300 border-navy-700',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-navy-900 border-r border-navy-750 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Nav Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Operations & Control
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-shield-cyan border-l-2 border-shield-cyan font-semibold shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-shield-cyan' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                      item.badgeColor || 'bg-navy-800 text-slate-300 border-navy-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Edge Engine Hardware Telemetry Card */}
        <div className="p-3 m-3 rounded-xl bg-navy-950/80 border border-navy-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-300">
              <Cpu className="h-3.5 w-3.5 text-shield-cyan" />
              EDGE NODE STATUS
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping-slow" />
          </div>

          <div className="space-y-1 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Security Suite:</span>
              <span className="text-slate-200">SHA256-HMAC</span>
            </div>
            <div className="flex justify-between">
              <span>Idempotency:</span>
              <span className="text-emerald-400">Deterministic</span>
            </div>
            <div className="flex justify-between">
              <span>Local Store:</span>
              <span className="text-cyan-300">Encrypted Queue</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-navy-850 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Node Architecture</span>
            <span className="text-slate-300 font-mono">ARM64 Enclave</span>
          </div>
        </div>

        {/* User / Workspace Footer */}
        <div className="p-3 border-t border-navy-750 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[11px] font-bold text-shield-cyan">
              PS
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Hackathon Node</div>
              <div className="text-[10px] text-slate-400 font-mono">TERM-CLUSTER-01</div>
            </div>
          </div>
          <Server className="h-4 w-4 text-slate-400" />
        </div>
      </aside>
    </>
  );
};
