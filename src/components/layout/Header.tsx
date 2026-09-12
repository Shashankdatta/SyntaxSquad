import React from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  Shield,
  Layers,
  Database,
  Radio,
} from 'lucide-react';
import { formatCurrency } from '../../utils/crypto';

export const Header: React.FC = () => {
  const {
    networkStatus,
    setNetworkStatus,
    networkLatencyMs,
    offlineQueue,
    centralLedger,
    resetDemoState,
    isProcessing,
  } = usePayShield();

  const pendingCount = offlineQueue.filter(q => q.status === 'PENDING_SYNC').length;

  return (
    <header className="sticky top-0 z-40 h-16 bg-navy-900/90 backdrop-blur-md border-b border-navy-750 px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-glow-cyan">
          <Shield className="h-5 w-5 text-navy-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base md:text-lg tracking-wider text-white">
              PAYSHIELD <span className="text-shield-cyan">NEXUS</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              v2.4 FinTech
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-slate-400 font-medium">
            Partition-Tolerant Payment Authorization & Inline Fraud Screening
          </p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Reserve Pool Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 border border-navy-750 text-xs">
          <Database className="h-3.5 w-3.5 text-shield-cyan" />
          <span className="text-slate-400">Settled Vol:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {formatCurrency(centralLedger.settledVolume)}
          </span>
        </div>

        {/* Offline Queue Badge Pill */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-mono animate-pulse">
            <Layers className="h-3.5 w-3.5" />
            <span>{pendingCount} Queued</span>
          </div>
        )}

        {/* Interactive Network State Toggle */}
        <div className="flex items-center bg-navy-950 p-1 rounded-lg border border-navy-750">
          <button
            onClick={() => setNetworkStatus('ONLINE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              networkStatus === 'ONLINE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to Full Online Central Authorization"
          >
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Online</span>
          </button>

          <button
            onClick={() => setNetworkStatus('DEGRADED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              networkStatus === 'DEGRADED'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Simulate High Latency & Jitter"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Degraded</span>
          </button>

          <button
            onClick={() => setNetworkStatus('PARTITIONED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              networkStatus === 'PARTITIONED'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-glow-crimson'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Simulate Complete Network Partition (Offline Controlled Mode)"
          >
            <WifiOff className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Partitioned</span>
          </button>
        </div>

        {/* Latency Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-850 border border-navy-750 text-[11px] font-mono text-slate-300">
          <Radio className={`h-3 w-3 ${networkStatus === 'ONLINE' ? 'text-emerald-400 animate-pulse' : networkStatus === 'DEGRADED' ? 'text-amber-400' : 'text-rose-500'}`} />
          <span>{networkStatus === 'PARTITIONED' ? 'AIR-GAPPED' : `${networkLatencyMs}ms`}</span>
        </div>

        {/* Reset State Button */}
        <button
          onClick={resetDemoState}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-750 transition-colors text-xs font-medium"
          title="Reset Demo State to Initial Baseline"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
