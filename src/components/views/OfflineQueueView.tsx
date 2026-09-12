import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  Layers,
  RefreshCw,
  Copy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCode,
  Download,
  Wifi,
  WifiOff,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/crypto';
import { OfflineQueueItem } from '../../types';
import { NavTab } from '../layout/Sidebar';

interface OfflineQueueViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const OfflineQueueView: React.FC<OfflineQueueViewProps> = ({ setActiveTab }) => {
  const {
    offlineQueue,
    networkStatus,
    reconcileQueue,
    injectDuplicateReplayMock,
    corruptQueueItem,
    clearReconciledQueue,
    isProcessing,
  } = usePayShield();

  const [selectedQueueItem, setSelectedQueueItem] = useState<OfflineQueueItem | null>(null);
  const [copied, setCopied] = useState(false);

  const pendingItems = offlineQueue.filter(q => q.status === 'PENDING_SYNC');
  const totalQueuedAmount = pendingItems.reduce((sum, item) => sum + item.transaction.amount, 0);

  const handleCopyJson = (item: OfflineQueueItem) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportBatch = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(offlineQueue, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `payshield_offline_queue_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            Offline Transaction Queue & Cryptographic Envelopes
          </h2>
          <p className="text-xs text-slate-400">
            Local browser/edge enclave store retaining encrypted, nonce-stamped authorization payloads pending uplink restoration
          </p>
        </div>

        {/* Batch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={injectDuplicateReplayMock}
            className="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Inject a duplicate nonce to test reconciliation deduplication"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Inject Replay Mock
          </button>

          <button
            onClick={handleExportBatch}
            className="px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-750 text-slate-300 border border-navy-750 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Batch JSON
          </button>

          {networkStatus === 'PARTITIONED' ? (
            <button
              onClick={() => setActiveTab('network')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-amber transition-colors"
            >
              <WifiOff className="h-3.5 w-3.5" />
              Restore Link to Reconcile
            </button>
          ) : (
            <button
              onClick={() => reconcileQueue()}
              disabled={isProcessing || pendingItems.length === 0}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                pendingItems.length === 0
                  ? 'bg-navy-800 text-slate-500 cursor-not-allowed border border-navy-750'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-navy-950 shadow-glow-emerald'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              Reconcile Queue ({pendingItems.length})
            </button>
          )}
        </div>
      </div>

      {/* Queue Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="text-xs text-slate-400 font-semibold uppercase">Pending Synchronization</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{pendingItems.length} Transactions</div>
          <div className="text-xs text-slate-500 mt-1">Stored securely in local enclave</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="text-xs text-slate-400 font-semibold uppercase">Queued Exposure Volume</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{formatCurrency(totalQueuedAmount)}</div>
          <div className="text-xs text-slate-500 mt-1">Backed by corporate reserve buffer</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="text-xs text-slate-400 font-semibold uppercase">Deduplication Integrity</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">100% Nonce Guard</div>
          <div className="text-xs text-slate-500 mt-1">Idempotent replay protection active</div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="glass-panel p-5 rounded-xl border border-navy-750">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Enqueued Authorization Payloads
          </h3>
          {offlineQueue.some(q => q.status === 'RECONCILED' || q.status === 'DUPLICATE_REJECTED') && (
            <button
              onClick={clearReconciledQueue}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Clear Processed Items
            </button>
          )}
        </div>

        {offlineQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Layers className="h-10 w-10 mx-auto text-slate-600" />
            <div className="text-sm font-semibold text-slate-400">Offline Queue is Empty</div>
            <p className="text-xs">Switch to Partitioned mode in the Payment Simulator to generate offline authorizations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="pb-3 font-semibold">Queue ID</th>
                  <th className="pb-3 font-semibold">Cardholder & Terminal</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Cryptographic Nonce</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {offlineQueue.map(item => {
                  const isReplay = item.isReplayMock;
                  return (
                    <tr
                      key={item.queueId}
                      className={`hover:bg-navy-850/40 transition-colors ${
                        isReplay ? 'bg-purple-950/20' : ''
                      }`}
                    >
                      <td className="py-3 font-mono">
                        <div className="font-semibold text-slate-200">{item.queueId}</div>
                        <div className="text-[10px] text-slate-500">{formatTime(item.enqueuedAt)}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-200">{item.transaction.cardHolder}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.transaction.terminalName}</div>
                      </td>
                      <td className="py-3 font-mono font-bold text-white">
                        {formatCurrency(item.transaction.amount)}
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        <span className="bg-navy-950 px-2 py-0.5 rounded border border-navy-800 text-[11px]">
                          {item.transaction.offlineEnvelope?.nonce || item.transaction.idempotencyKey}
                        </span>
                        {isReplay && (
                          <span className="ml-1.5 text-[10px] text-purple-400 font-bold">
                            [REPLAY TEST]
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {item.status === 'PENDING_SYNC' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse">
                            PENDING_SYNC
                          </span>
                        ) : item.status === 'RECONCILED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            SETTLED
                          </span>
                        ) : item.status === 'DUPLICATE_REJECTED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                            REPLAY_REJECTED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                            CORRUPTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedQueueItem(item)}
                            className="px-2 py-1 rounded bg-navy-850 hover:bg-navy-750 text-shield-cyan text-[11px] font-medium transition-colors"
                            title="Inspect Cryptographic Envelope"
                          >
                            Inspect
                          </button>
                          {item.status === 'PENDING_SYNC' && (
                            <button
                              onClick={() => corruptQueueItem(item.queueId)}
                              className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-[11px] border border-rose-800/60 transition-colors"
                              title="Corrupt signature to test integrity failure"
                            >
                              Tamper
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw Payload Inspector Modal */}
      {selectedQueueItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-navy-700 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-navy-750 mb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-shield-cyan" />
                <h3 className="font-bold text-sm text-white">
                  Cryptographic Offline Envelope: {selectedQueueItem.queueId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedQueueItem(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center bg-navy-950 p-2 rounded border border-navy-800">
                <span className="text-slate-400">Canonical SHA-256 Digest:</span>
                <span className="text-shield-cyan font-bold">{selectedQueueItem.payloadHash}</span>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-slate-300 text-[11px] overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedQueueItem, null, 2)}
                </pre>
                <button
                  onClick={() => handleCopyJson(selectedQueueItem)}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs flex items-center gap-1 border border-navy-700"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-navy-750 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <strong className="text-white">{selectedQueueItem.status}</strong></span>
              <button
                onClick={() => setSelectedQueueItem(null)}
                className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-white font-semibold text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
