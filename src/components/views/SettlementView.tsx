import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import { NavTab } from '../layout/Sidebar';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  ShieldCheck,
  Lock,
  Layers,
  FileCheck,
  Database,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/crypto';

interface SettlementViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const SettlementView: React.FC<SettlementViewProps> = ({ setActiveTab }) => {
  const {
    networkStatus,
    setNetworkStatus,
    offlineQueue,
    centralLedger,
    reconcileQueue,
    injectDuplicateReplayMock,
    isProcessing,
  } = usePayShield();

  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [reconcileResult, setReconcileResult] = useState<{
    settled: number;
    rejectedDuplicates: number;
    timestamp: number;
  } | null>(null);

  const pendingQueue = offlineQueue.filter(q => q.status === 'PENDING_SYNC');
  const settledQueue = offlineQueue.filter(q => q.status === 'RECONCILED');
  const rejectedQueue = offlineQueue.filter(q => q.status === 'DUPLICATE_REJECTED' || q.status === 'CORRUPTED');

  // Trigger 8-step visual reconciliation
  const handleRunReconciliation = async () => {
    // If currently offline, restore network first
    if (networkStatus !== 'ONLINE') {
      setNetworkStatus('ONLINE');
      await new Promise(r => setTimeout(r, 200));
    }

    // Step through the visual pipeline for hackathon presentation
    for (let s = 1; s <= 8; s++) {
      setActivePipelineStep(s);
      await new Promise(r => setTimeout(r, 120));
    }

    const res = await reconcileQueue();
    setReconcileResult({
      settled: res.settled,
      rejectedDuplicates: res.rejectedDuplicates,
      timestamp: Date.now(),
    });
    setActivePipelineStep(0);
  };

  const pipelineSteps = [
    { num: 1, name: 'Offline Queue Found', desc: 'Scan encrypted local storage' },
    { num: 2, name: 'Token Verification', desc: 'Verify SHA-256 HMAC nonces' },
    { num: 3, name: 'Expiry Check', desc: 'Validate 24h rolling TTL bounds' },
    { num: 4, name: 'Duplicate Check', desc: 'Strict idempotency key lookup' },
    { num: 5, name: 'Fraud Re-Screening', desc: 'Check central consortium watchlists' },
    { num: 6, name: 'Balance Validation', desc: 'Verify central wallet sufficiency' },
    { num: 7, name: 'Conflict Resolution', desc: 'Isolate tampered/replayed envelopes' },
    { num: 8, name: 'Final Ledger Update', desc: 'Atomic debit & audit log commit' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Settlement & Reconciliation
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Offline-authorized payments are verified and finalized after connectivity is restored.
        </p>
      </div>

      {/* Network & Queue Readiness Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
        networkStatus === 'ONLINE'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-amber-50/80 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          {networkStatus === 'ONLINE' ? (
            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Wifi className="h-5 w-5" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <WifiOff className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="font-bold text-sm text-slate-900">
              {networkStatus === 'ONLINE'
                ? 'Network Uplink Active — Ready to Settle'
                : 'Network Disconnected — Restore to Settle'}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {pendingQueue.length > 0
                ? `${pendingQueue.length} offline payment(s) awaiting deterministic batch settlement.`
                : 'All offline payments have been settled and reconciled.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {networkStatus !== 'ONLINE' && (
            <button
              onClick={() => setNetworkStatus('ONLINE')}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs shadow-2xs transition-colors"
            >
              Restore Network First
            </button>
          )}

          <button
            onClick={handleRunReconciliation}
            disabled={isProcessing}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Reconcile Pending Payments</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="fintech-card p-4">
          <span className="text-xs text-slate-500 font-medium">Pending Sync</span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {pendingQueue.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Waiting in local queue</span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-xs text-slate-500 font-medium">Reconciled & Settled</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {settledQueue.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Finalized to ledger</span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-xs text-slate-500 font-medium">Duplicates Blocked</span>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {rejectedQueue.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Replay attacks neutralized</span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-xs text-slate-500 font-medium">Prevented Loss</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatCurrency(centralLedger.disputedLossPrevented)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Duplicate debits prevented</span>
        </div>
      </div>

      {/* 8-Step Reconciliation Pipeline Visualizer */}
      <div className="fintech-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              8-Step Deterministic Reconciliation Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Executed atomically when connectivity is restored.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Idempotency Guaranteed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {pipelineSteps.map(st => {
            const isCurrent = activePipelineStep === st.num;
            const isCompleted = activePipelineStep > st.num || (reconcileResult && activePipelineStep === 0);

            return (
              <div
                key={st.num}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/80 shadow-xs'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 text-slate-900'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {st.num}
                  </span>
                  {isCompleted && <span className="text-emerald-600 text-[10px] font-bold">✓</span>}
                </div>
                <div className="font-bold text-slate-900 leading-snug">
                  {st.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {st.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Idempotency & Duplicate Replay Test Sandbox */}
      <div className="fintech-card p-5 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Idempotency & Deduplication Assurance
            </h3>
          </div>
          <p className="text-xs text-slate-600 max-w-xl">
            Clicking <strong>"Reconcile Pending Payments"</strong> repeatedly will <strong>never</strong> double-deduct the account balance or insert duplicate ledger entries.
          </p>
        </div>

        <button
          onClick={injectDuplicateReplayMock}
          className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
          <span>Inject Replay Attack</span>
        </button>
      </div>

      {/* Reconciliation Queue Records Table */}
      <div className="fintech-card p-5">
        <h2 className="text-base font-bold text-slate-900 mb-3 pb-3 border-b border-slate-100">
          Reconciliation Queue History
        </h2>

        {offlineQueue.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Layers className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No Queue Records</p>
            <p className="text-slate-400 mt-0.5">Authorize an offline transaction from the Pay tab to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Queue ID</th>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Merchant</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Sync Status</th>
                  <th className="py-2.5 px-3">Idempotency Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offlineQueue.map(item => {
                  const isSettled = item.status === 'RECONCILED';
                  const isRejected = item.status === 'DUPLICATE_REJECTED';
                  const isPending = item.status === 'PENDING_SYNC';

                  return (
                    <tr key={item.queueId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {item.queueId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {item.transaction.id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {item.transaction.merchant}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {formatCurrency(item.transaction.amount)}
                      </td>
                      <td className="py-2.5 px-3">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            Settled & Reconciled
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                            <ShieldAlert className="h-3 w-3" />
                            Duplicate Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                            <RefreshCw className="h-3 w-3" />
                            Pending Sync
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                        {item.transaction.idempotencyKey.slice(0, 18)}...
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
