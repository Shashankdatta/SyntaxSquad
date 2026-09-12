import React from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  Clock,
  Radio,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/crypto';
import { NavTab } from '../layout/Sidebar';

interface OverviewViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ setActiveTab }) => {
  const {
    networkStatus,
    setNetworkStatus,
    networkLatencyMs,
    transactions,
    offlineQueue,
    centralLedger,
    reconcileQueue,
    isProcessing,
  } = usePayShield();

  const pendingQueue = offlineQueue.filter(q => q.status === 'PENDING_SYNC');
  const pendingHold = pendingQueue.reduce((acc, q) => acc + q.transaction.amount, 0);
  const recentTransactions = transactions.slice(0, 6);

  const fraudBlockedCount = transactions.filter(t => t.status === 'REJECTED_FRAUD' || t.status === 'REPLAY_DUPLICATE_BLOCKED').length;
  const fraudRate = transactions.length > 0
    ? ((fraudBlockedCount / transactions.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Banner: Partition-Tolerant Status Announcement */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        networkStatus === 'PARTITIONED'
          ? 'bg-rose-950/40 border-rose-800/80 shadow-glow-crimson'
          : networkStatus === 'DEGRADED'
          ? 'bg-amber-950/40 border-amber-800/80 shadow-glow-amber'
          : 'bg-gradient-to-r from-navy-900 to-navy-850 border-cyan-500/30 shadow-glow-cyan'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
            networkStatus === 'PARTITIONED'
              ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 animate-pulse'
              : networkStatus === 'DEGRADED'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
              : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
          }`}>
            {networkStatus === 'PARTITIONED' ? (
              <WifiOff className="h-6 w-6" />
            ) : networkStatus === 'DEGRADED' ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Wifi className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                System Mode:{' '}
                <span className={
                  networkStatus === 'PARTITIONED'
                    ? 'text-rose-400'
                    : networkStatus === 'DEGRADED'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }>
                  {networkStatus === 'PARTITIONED'
                    ? 'AIR-GAPPED PARTITION (Controlled Edge Mode)'
                    : networkStatus === 'DEGRADED'
                    ? 'DEGRADED NETWORK (High Latency & Jitter)'
                    : 'ONLINE (Sub-second Central Clearing)'}
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {networkStatus === 'PARTITIONED'
                ? 'Terminals are operating autonomously with signed cryptographic risk envelopes and local fraud screening heuristics.'
                : networkStatus === 'DEGRADED'
                ? `Simulating high round-trip latency (${networkLatencyMs}ms) with automatic fallback timeouts.`
                : 'Centralized Core Switch connected. Full sub-second fraud screening and real-time ledger settlement.'}
            </p>
          </div>
        </div>

        {/* Quick Partition Toggle Action */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          {networkStatus === 'PARTITIONED' ? (
            <button
              onClick={() => setNetworkStatus('ONLINE')}
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs flex items-center justify-center gap-2 shadow-glow-emerald transition-all"
            >
              <Wifi className="h-4 w-4" />
              Restore Central Uplink
            </button>
          ) : (
            <button
              onClick={() => setNetworkStatus('PARTITIONED')}
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-crimson transition-all"
            >
              <WifiOff className="h-4 w-4" />
              Cut Network (Simulate Partition)
            </button>
          )}

          {pendingQueue.length > 0 && networkStatus !== 'PARTITIONED' && (
            <button
              onClick={() => reconcileQueue()}
              disabled={isProcessing}
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs flex items-center justify-center gap-2 shadow-glow-cyan transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
              Reconcile Queue ({pendingQueue.length})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Central Ledger Settled */}
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled Volume</span>
            <Database className="h-4 w-4 text-shield-cyan" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatCurrency(centralLedger.settledVolume)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Reserve Pool:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {formatCurrency(centralLedger.corporateReservePool)}
            </span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 2: Offline Authorized on Hold */}
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Offline Hold Volume</span>
            <Layers className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(centralLedger.offlineAuthorizedHold + pendingHold)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Pending Sync Items:</span>
            <span className="font-mono text-amber-300 font-semibold">
              {pendingQueue.length} txns
            </span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 3: Fraud & Replay Losses Prevented */}
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Disputes Prevented</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(centralLedger.disputedLossPrevented)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Fraud Intercept Rate:</span>
            <span className="font-mono text-slate-200 font-semibold">{fraudRate}%</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 4: Edge Zero-Trust Enclaves */}
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Telemetry & Health</span>
            <Radio className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            4 / 4 Nodes
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Active Envelopes:</span>
            <span className="font-mono text-slate-200 font-semibold">
              {transactions.filter(t => t.offlineEnvelope).length} Signed
            </span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Interactive System Flow Architecture Visualizer */}
      <div className="glass-panel p-5 rounded-xl border border-navy-750">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-shield-cyan" />
              PayShield Nexus Architectural Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Live data-flow representation of partition-tolerant authorization and inline edge fraud heuristics
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-navy-850 border border-navy-700 text-slate-300">
            Protocol: PS-ENCLAVE-v2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Step 1: Terminal / POS */}
          <div className="p-4 rounded-xl bg-navy-900/90 border border-navy-750 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-shield-cyan font-semibold">STAGE 01</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping-slow" />
            </div>
            <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-shield-cyan" />
              POS Edge Node
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Captures card EMV / contactless tap and triggers local risk pre-attestation.
            </p>
            <div className="text-[11px] font-mono text-slate-300 bg-navy-950 p-2 rounded border border-navy-800">
              Limit Check: <span className="text-emerald-400">Max $150/txn</span>
            </div>
          </div>

          {/* Step 2: Inline Fraud Screener */}
          <div className="p-4 rounded-xl bg-navy-900/90 border border-navy-750 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-purple-400 font-semibold">STAGE 02</span>
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping-slow" />
            </div>
            <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-purple-400" />
              Inline Fraud Heuristics
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Runs edge velocity, device attestation, blacklist & risk scoring without cloud dependency.
            </p>
            <div className="text-[11px] font-mono text-slate-300 bg-navy-950 p-2 rounded border border-navy-800">
              Score Gate: <span className="text-purple-300">&lt; 75 Threshold</span>
            </div>
          </div>

          {/* Step 3: Partition / Envelope Switch */}
          <div className={`p-4 rounded-xl border relative transition-all ${
            networkStatus === 'PARTITIONED'
              ? 'bg-rose-950/30 border-rose-700/80 shadow-glow-crimson'
              : 'bg-navy-900/90 border-navy-750'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-amber-400 font-semibold">STAGE 03</span>
              <span className={`h-2 w-2 rounded-full ${networkStatus === 'PARTITIONED' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
            </div>
            <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              Cryptographic Envelope
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {networkStatus === 'PARTITIONED'
                ? 'Network Cut: Generating signed SHA-256 nonces stored in local queue.'
                : 'Uplink Active: Direct pass-through to central switch with sub-second clearing.'}
            </p>
            <div className="text-[11px] font-mono text-slate-300 bg-navy-950 p-2 rounded border border-navy-800">
              State: <span className={networkStatus === 'PARTITIONED' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {networkStatus === 'PARTITIONED' ? 'OFFLINE BUFFER' : 'ONLINE PASS'}
              </span>
            </div>
          </div>

          {/* Step 4: Central Clearing / Reconciliation */}
          <div className="p-4 rounded-xl bg-navy-900/90 border border-navy-750 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">STAGE 04</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping-slow" />
            </div>
            <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              Deterministic Reconciler
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Deduplicates nonces, prevents replay attacks, settles transactions into central ledger.
            </p>
            <div className="text-[11px] font-mono text-slate-300 bg-navy-950 p-2 rounded border border-navy-800">
              Safety: <span className="text-emerald-400">Zero-Loss Idempotent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Transactions + Quick Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-navy-750">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-shield-cyan" />
                Live Authorization Feed
              </h3>
              <p className="text-xs text-slate-400">Real-time status of online and partitioned transactions</p>
            </div>
            <button
              onClick={() => setActiveTab('simulator')}
              className="text-xs font-semibold text-shield-cyan hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              Open Simulator <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="pb-3 font-semibold">Tx ID & Nonce</th>
                  <th className="pb-3 font-semibold">Cardholder</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Auth Mode</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {recentTransactions.map(tx => {
                  return (
                    <tr key={tx.id} className="hover:bg-navy-850/40 transition-colors">
                      <td className="py-3 font-mono">
                        <div className="font-semibold text-slate-200">{tx.id}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {tx.offlineEnvelope?.nonce || tx.idempotencyKey}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-200">{tx.cardHolder}</div>
                        <div className="text-[10px] font-mono text-slate-500">{tx.cardNumberMasked}</div>
                      </td>
                      <td className="py-3 font-mono font-semibold text-white">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3">
                        {tx.authMode === 'OFFLINE_PARTITION' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
                            <WifiOff className="h-2.5 w-2.5" />
                            Offline
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                            <Wifi className="h-2.5 w-2.5" />
                            Online
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {tx.status === 'SETTLED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            SETTLED
                          </span>
                        ) : tx.status === 'APPROVED_OFFLINE' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
                            APPROVED_OFFLINE
                          </span>
                        ) : tx.status === 'REJECTED_FRAUD' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                            BLOCKED_FRAUD
                          </span>
                        ) : tx.status === 'REPLAY_DUPLICATE_BLOCKED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800">
                            REPLAY_BLOCKED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                            LIMIT_EXCEEDED
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono">
                        <span className={`font-semibold ${
                          tx.fraudAnalysis.riskScore >= 75
                            ? 'text-rose-400'
                            : tx.fraudAnalysis.riskScore >= 40
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {tx.fraudAnalysis.riskScore}/100
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Simulator & Demo Launcher (1 col) */}
        <div className="glass-panel p-5 rounded-xl border border-navy-750 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-shield-cyan" />
                Scenario Shortcuts
              </h3>
              <span className="text-[10px] font-mono text-shield-cyan">HACKATHON DEMO</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Trigger pre-configured high-impact presentation scenarios with a single click:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setNetworkStatus('ONLINE');
                  setActiveTab('simulator');
                }}
                className="w-full p-3 rounded-lg bg-navy-900 hover:bg-navy-850 border border-navy-750 hover:border-emerald-500/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    1. Clean Online Payment
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tests sub-second online authorization with instant settlement into central ledger.
                </p>
              </button>

              <button
                onClick={() => {
                  setNetworkStatus('PARTITIONED');
                  setActiveTab('simulator');
                }}
                className="w-full p-3 rounded-lg bg-navy-900 hover:bg-navy-850 border border-navy-750 hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <WifiOff className="h-3.5 w-3.5" />
                    2. Controlled Offline Swipe
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cuts uplink, issues signed cryptographic risk envelope, and enqueues offline.
                </p>
              </button>

              <button
                onClick={() => {
                  setActiveTab('queue');
                }}
                className="w-full p-3 rounded-lg bg-navy-900 hover:bg-navy-850 border border-navy-750 hover:border-purple-500/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    3. Duplicate Replay Attack
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Injects cloned nonce payload to prove deterministic deduplication defense.
                </p>
              </button>

              <button
                onClick={() => {
                  setNetworkStatus('ONLINE');
                  setActiveTab('reconciliation');
                }}
                className="w-full p-3 rounded-lg bg-navy-900 hover:bg-navy-850 border border-navy-750 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-shield-cyan flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    4. Deterministic Reconciliation
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-shield-cyan transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Re-establishes link, settles offline holds, locks nonces, and updates audit stream.
                </p>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Proof of Concept</span>
            <span className="font-mono text-slate-400">PayShield Nexus Core</span>
          </div>
        </div>
      </div>
    </div>
  );
};
