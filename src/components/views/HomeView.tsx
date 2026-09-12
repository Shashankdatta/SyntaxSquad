import React from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import { NavTab } from '../layout/Sidebar';
import {
  Wallet,
  Send,
  Wifi,
  WifiOff,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/crypto';

interface HomeViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ setActiveTab }) => {
  const {
    selectedCard,
    networkStatus,
    setNetworkStatus,
    offlineQueue,
    transactions,
    auditLogs,
  } = usePayShield();

  const remainingOffline = Math.max(0, selectedCard.offlineCumulativeLimit - selectedCard.offlineCurrentSpent);
  const pendingCount = offlineQueue.filter(q => q.status === 'PENDING_SYNC').length;
  const recentTransactions = transactions.slice(0, 4);
  const recentSecurityAlerts = auditLogs
    .filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING')
    .slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome & Product Positioning */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome to PayShield Nexus
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Secure digital payments that continue working during network disruptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pay')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>Make a Payment</span>
          </button>

          <button
            onClick={() => setActiveTab('offline')}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium shadow-xs transition-colors"
          >
            <WifiOff className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Offline Mode</span>
          </button>
        </div>
      </div>

      {/* Main Wallet & Core Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Digital Wallet Card */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {/* Subtle background decoration */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-xs text-xs font-semibold tracking-wide uppercase">
                {selectedCard.name}
              </span>
              <span className="text-xs text-blue-200 font-mono">
                {selectedCard.cardNumber}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium">
              <span className={`h-2 w-2 rounded-full ${networkStatus === 'ONLINE' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{networkStatus === 'ONLINE' ? 'Connected' : 'Partitioned / Offline'}</span>
            </div>
          </div>

          {/* Card Center: Balance */}
          <div className="my-4 z-10">
            <div className="text-xs text-blue-200 font-medium tracking-wide">
              Available Demo Balance
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              {formatCurrency(selectedCard.accountBalance)}
            </div>
            <div className="text-[11px] text-blue-300/80 mt-1">
              Demo balance — no real money transfers
            </div>
          </div>

          {/* Card Bottom: Quick Limits & CTA */}
          <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-blue-300 block text-[11px]">Remaining Offline Allowance:</span>
                <span className="font-semibold text-white font-mono">
                  {formatCurrency(remainingOffline)} / ₹2,000
                </span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-white/20" />
              <div className="hidden sm:block">
                <span className="text-blue-300 block text-[11px]">Fraud Screening:</span>
                <span className="font-semibold text-emerald-300">Inline Verified</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('pay')}
              className="px-3 py-1.5 rounded-lg bg-white text-blue-900 font-semibold text-xs hover:bg-blue-50 transition-colors flex items-center gap-1"
            >
              <span>Pay Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Key Status & Settlement Snapshot */}
        <div className="fintech-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Operational Status
            </h2>

            <div className="space-y-3">
              {/* Network State Card */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  {networkStatus === 'ONLINE' ? (
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Wifi className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <WifiOff className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      {networkStatus === 'ONLINE' ? 'Online Mode' : 'Offline Partition'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {networkStatus === 'ONLINE' ? 'Real-time central auth' : 'Local protected auth'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setNetworkStatus(networkStatus === 'ONLINE' ? 'PARTITIONED' : 'ONLINE')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  {networkStatus === 'ONLINE' ? 'Simulate Cut' : 'Restore'}
                </button>
              </div>

              {/* Pending Settlement Card */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Settlement Queue
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {pendingCount > 0 ? `${pendingCount} awaiting network sync` : 'All transactions settled'}
                    </div>
                  </div>
                </div>

                {pendingCount > 0 ? (
                  <button
                    onClick={() => setActiveTab('settlement')}
                    className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 hover:bg-amber-100"
                  >
                    Reconcile
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">0 pending</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick tip / assurance */}
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Cryptographic idempotency guarantees zero double-deductions.</span>
          </div>
        </div>
      </div>

      {/* 4-Step Explainer Banner: How PayShield Works */}
      <div className="fintech-card p-5 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              How PayShield Nexus Protects Payments
            </h2>
          </div>
          <span className="text-[11px] text-blue-700 font-medium hidden sm:inline">
            Fintech Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Inline Screening</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Every payment passes 7 deterministic fraud rules (QR mismatch, suspicious merchants, high value).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Partition Tolerance</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              When disconnected, local terminals authorize payments safely up to the ₹2,000 offline cap.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Offline Queue</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Cryptographic envelopes with nonces and SHA-256 signatures are securely preserved locally.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">4</span>
              <span>Idempotent Settlement</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Once online, batch reconciliation finalizes ledger debits with zero duplicate risk.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Transactions & Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Transactions */}
        <div className="fintech-card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Receipt className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p>No transactions yet.</p>
              <button
                onClick={() => setActiveTab('pay')}
                className="mt-2 text-blue-600 font-semibold text-xs hover:underline"
              >
                Make your first payment &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTransactions.map(tx => {
                const isApproved = tx.status === 'SETTLED' || tx.status === 'APPROVED';
                const isOffline = tx.status === 'APPROVED_OFFLINE';
                const isBlocked = tx.status === 'REJECTED_FRAUD' || tx.status === 'REJECTED_LIMIT_EXCEEDED' || tx.status === 'REPLAY_DUPLICATE_BLOCKED';

                return (
                  <div
                    key={tx.id}
                    onClick={() => setActiveTab('transactions')}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isApproved ? 'bg-emerald-100 text-emerald-700' : isOffline ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isApproved ? '✓' : isOffline ? '⏱' : '✕'}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {tx.merchant}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {tx.id} • {tx.authMode === 'OFFLINE_PARTITION' ? 'Offline' : 'Online'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        {formatCurrency(tx.amount)}
                      </div>
                      <div className={`text-[10px] font-medium ${
                        isApproved ? 'text-emerald-600' : isOffline ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {isApproved ? 'Settled' : isOffline ? 'Authorized Offline' : 'Blocked'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Security Alerts */}
        <div className="fintech-card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">Security & Risk Guard</h2>
            </div>
            <button
              onClick={() => setActiveTab('security')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Security Center</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentSecurityAlerts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <ShieldCheck className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
              <p className="text-slate-600 font-medium">All checks normal.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No critical fraud attempts recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentSecurityAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border border-rose-100 bg-rose-50/50 flex items-start gap-3"
                >
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-900">
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(alert.timestamp).slice(11)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Inline Fraud Protection Active</span>
            <span className="text-emerald-700 font-medium">7 Active Rules</span>
          </div>
        </div>
      </div>
    </div>
  );
};
