import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Database,
  ArrowRight,
  Wifi,
  WifiOff,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/crypto';
import { NavTab } from '../layout/Sidebar';

interface ReconciliationViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({ setActiveTab }) => {
  const {
    networkStatus,
    setNetworkStatus,
    offlineQueue,
    centralLedger,
    transactions,
    reconcileQueue,
    isProcessing,
  } = usePayShield();

  const [batchSummary, setBatchSummary] = useState<{ settled: number; rejected: number } | null>(null);

  const pendingItems = offlineQueue.filter(q => q.status === 'PENDING_SYNC');
  const settledItems = offlineQueue.filter(q => q.status === 'RECONCILED');
  const rejectedDuplicates = offlineQueue.filter(q => q.status === 'DUPLICATE_REJECTED');

  const handleRunReconciliation = async () => {
    if (networkStatus === 'PARTITIONED') {
      alert('Cannot reconcile while partitioned! Switch network to ONLINE first.');
      return;
    }
    const res = await reconcileQueue();
    setBatchSummary({ settled: res.settled, rejected: res.rejectedDuplicates });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Reconciliation Center & Ledger Settlement
          </h2>
          <p className="text-xs text-slate-400">
            Deterministic two-phase reconciliation pipeline executing nonce deduplication, replay attack neutralization, and ledger balance settlement
          </p>
        </div>

        {/* Network & Reconcile Trigger */}
        <div className="flex items-center gap-2">
          {networkStatus === 'PARTITIONED' ? (
            <button
              onClick={() => setNetworkStatus('ONLINE')}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs flex items-center gap-2 shadow-glow-emerald transition-all"
            >
              <Wifi className="h-4 w-4" />
              Restore Link & Prepare Batch
            </button>
          ) : (
            <button
              onClick={handleRunReconciliation}
              disabled={isProcessing || pendingItems.length === 0}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                pendingItems.length === 0
                  ? 'bg-navy-850 text-slate-500 border border-navy-750 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-navy-950 shadow-glow-emerald'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
              Execute Reconciliation Batch ({pendingItems.length} Pending)
            </button>
          )}
        </div>
      </div>

      {/* Network Warning Banner if Partitioned */}
      {networkStatus === 'PARTITIONED' && (
        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="text-xs text-amber-200">
              <strong className="font-semibold">Central Switch Disconnected:</strong> System is in Partition-Tolerant mode.
              Offline transactions are accumulating safely in the local queue. Reconnect uplink to process settlement.
            </div>
          </div>
          <button
            onClick={() => setNetworkStatus('ONLINE')}
            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs shrink-0"
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* 4-Stage Reconciliation Pipeline Visualizer */}
      <div className="glass-panel p-5 rounded-xl border border-navy-750">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-shield-cyan" />
            Deterministic Settlement Pipeline Flow
          </h3>
          <span className="text-[10px] font-mono text-emerald-400">IDEMPOTENT ZERO-LOSS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Stage 1 */}
          <div className="p-3.5 rounded-lg bg-navy-900 border border-navy-800">
            <div className="text-[10px] font-mono text-slate-400 mb-1">PHASE 1</div>
            <div className="text-xs font-bold text-white mb-1">Cryptographic Ingestion</div>
            <p className="text-[11px] text-slate-400">
              Validates digital signature against public terminal key. Discards corrupted envelopes.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="p-3.5 rounded-lg bg-navy-900 border border-navy-800">
            <div className="text-[10px] font-mono text-purple-400 mb-1">PHASE 2</div>
            <div className="text-xs font-bold text-white mb-1">Nonce Deduplication</div>
            <p className="text-[11px] text-slate-400">
              Cross-checks idempotency keys and nonces against central switch ledger. Neutralizes replay attacks.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="p-3.5 rounded-lg bg-navy-900 border border-navy-800">
            <div className="text-[10px] font-mono text-cyan-400 mb-1">PHASE 3</div>
            <div className="text-xs font-bold text-white mb-1">Ledger Settlement</div>
            <p className="text-[11px] text-slate-400">
              Debits user balance, releases corporate hold buffer, credits merchant clearing balance.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="p-3.5 rounded-lg bg-navy-900 border border-navy-800">
            <div className="text-[10px] font-mono text-emerald-400 mb-1">PHASE 4</div>
            <div className="text-xs font-bold text-white mb-1">Hash-Chained Audit</div>
            <p className="text-[11px] text-slate-400">
              Commits final settlement event into the immutable cryptographic audit log.
            </p>
          </div>
        </div>
      </div>

      {/* Settlement Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Settled Volume</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(centralLedger.settledVolume)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Directly cleared to Central Ledger</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="text-xs text-slate-400 uppercase font-semibold">Offline Holds Pending</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(centralLedger.offlineAuthorizedHold)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{pendingItems.length} pending sync transactions</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="text-xs text-slate-400 uppercase font-semibold">Replay Losses Prevented</div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
            {formatCurrency(centralLedger.disputedLossPrevented)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{rejectedDuplicates.length} replay attacks blocked</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="text-xs text-slate-400 uppercase font-semibold">Reserve Pool Buffer</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatCurrency(centralLedger.corporateReservePool)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Underwriting partition risk</div>
        </div>
      </div>

      {/* Batch Summary Alert if just reconciled */}
      {batchSummary && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500 flex items-center justify-between shadow-glow-emerald">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div className="text-xs text-emerald-200">
              <strong>Reconciliation Batch Completed:</strong> Successfully settled{' '}
              <span className="font-bold text-white">{batchSummary.settled}</span> transactions.{' '}
              {batchSummary.rejected > 0 && (
                <span className="text-purple-300 font-bold">
                  Intercepted and rejected {batchSummary.rejected} duplicate replay attempts!
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setBatchSummary(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settlement & Dispute Conflict Resolution Table */}
      <div className="glass-panel p-5 rounded-xl border border-navy-750">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reconciled & Neutralized Items
            </h3>
            <p className="text-xs text-slate-400">
              Audit record of post-partition settlements, deduplicated nonces, and rejected replay attacks
            </p>
          </div>
          <button
            onClick={() => setActiveTab('audit')}
            className="text-xs font-semibold text-shield-cyan hover:text-cyan-300 flex items-center gap-1"
          >
            Full Audit Stream <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-navy-800 text-slate-400 uppercase font-mono text-[11px]">
                <th className="pb-3 font-semibold">Tx ID & Nonce</th>
                <th className="pb-3 font-semibold">Cardholder</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Reconciliation State</th>
                <th className="pb-3 font-semibold">Resolution Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60 font-sans">
              {offlineQueue
                .filter(q => q.status === 'RECONCILED' || q.status === 'DUPLICATE_REJECTED')
                .map(item => (
                  <tr key={item.queueId} className="hover:bg-navy-850/40 transition-colors">
                    <td className="py-3 font-mono">
                      <div className="font-semibold text-slate-200">{item.transaction.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.transaction.offlineEnvelope?.nonce || item.transaction.idempotencyKey}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-slate-200">{item.transaction.cardHolder}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.transaction.terminalName}</div>
                    </td>
                    <td className="py-3 font-mono font-bold text-white">
                      {formatCurrency(item.transaction.amount)}
                    </td>
                    <td className="py-3">
                      {item.status === 'RECONCILED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          LEDGER_SETTLED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                          REPLAY_ATTACK_BLOCKED
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-300 text-[11px]">
                      {item.status === 'RECONCILED'
                        ? 'Nonce locked. Balance debited from cardholder and settled to central ledger.'
                        : 'Identical cryptographic nonce or idempotency key detected. Replay blocked without loss.'}
                    </td>
                  </tr>
                ))}
              {offlineQueue.filter(q => q.status === 'RECONCILED' || q.status === 'DUPLICATE_REJECTED').length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No offline transactions reconciled yet. Create offline payments in the Simulator, then click "Execute Reconciliation Batch".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
