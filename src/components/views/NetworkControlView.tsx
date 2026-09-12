import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  Network,
  Wifi,
  WifiOff,
  AlertTriangle,
  Radio,
  Activity,
  Server,
  Cpu,
  RefreshCw,
  Sliders,
  Shield,
  Zap,
} from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/crypto';
import { NetworkStatus } from '../../types';

export const NetworkControlView: React.FC = () => {
  const {
    networkStatus,
    setNetworkStatus,
    networkLatencyMs,
    setNetworkLatencyMs,
    terminals,
  } = usePayShield();

  const [packetLossPct, setPacketLossPct] = useState<number>(0);

  const handleModeSelect = (mode: NetworkStatus) => {
    setNetworkStatus(mode);
    if (mode === 'ONLINE') setPacketLossPct(0);
    else if (mode === 'DEGRADED') setPacketLossPct(18);
    else setPacketLossPct(100);
  };

  return (
    <div className="space-y-6">
      {/* View Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Network className="h-5 w-5 text-shield-cyan" />
            Network Topology & Partition Control
          </h2>
          <p className="text-xs text-slate-400">
            Simulate physical link breaks, fiber cuts, satellite blackouts, and test graceful partition tolerance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">CAP Theorem Architecture:</span>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-navy-850 text-cyan-300 border border-cyan-800">
            AP Mode (Eventual Consistency)
          </span>
        </div>
      </div>

      {/* Global Network Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Option 1: ONLINE */}
        <button
          onClick={() => handleModeSelect('ONLINE')}
          className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden group ${
            networkStatus === 'ONLINE'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-glow-emerald'
              : 'bg-navy-900/80 border-navy-800 hover:border-navy-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wifi className="h-5 w-5" />
            </div>
            {networkStatus === 'ONLINE' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm text-white mb-1">1. Full Online Central Switch</h3>
          <p className="text-xs text-slate-400">
            Zero partition. Sub-second authorization (45ms). Direct real-time ledger settlement.
          </p>
          <div className="mt-3 pt-2 border-t border-navy-800 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Latency: 45ms</span>
            <span>Packet Drop: 0%</span>
          </div>
        </button>

        {/* Option 2: DEGRADED */}
        <button
          onClick={() => handleModeSelect('DEGRADED')}
          className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden group ${
            networkStatus === 'DEGRADED'
              ? 'bg-amber-950/40 border-amber-500 shadow-glow-amber'
              : 'bg-navy-900/80 border-navy-800 hover:border-navy-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            {networkStatus === 'DEGRADED' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ACTIVE
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm text-white mb-1">2. Degraded Network (Jitter)</h3>
          <p className="text-xs text-slate-400">
            Simulates satellite congestion, transit tunnels, or cellular latency with fallback timeouts.
          </p>
          <div className="mt-3 pt-2 border-t border-navy-800 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Latency: 850ms</span>
            <span>Packet Drop: 18%</span>
          </div>
        </button>

        {/* Option 3: PARTITIONED */}
        <button
          onClick={() => handleModeSelect('PARTITIONED')}
          className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden group ${
            networkStatus === 'PARTITIONED'
              ? 'bg-rose-950/40 border-rose-500 shadow-glow-crimson'
              : 'bg-navy-900/80 border-navy-800 hover:border-navy-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <WifiOff className="h-5 w-5" />
            </div>
            {networkStatus === 'PARTITIONED' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                ACTIVE
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm text-white mb-1">3. Complete Air-Gap Partition</h3>
          <p className="text-xs text-slate-400">
            100% disconnected. POS switches to Autonomous Edge Enclaves with signed offline envelopes.
          </p>
          <div className="mt-3 pt-2 border-t border-navy-800 flex justify-between text-[11px] font-mono text-slate-400">
            <span>Latency: Air-Gapped</span>
            <span>Packet Drop: 100%</span>
          </div>
        </button>
      </div>

      {/* Manual Fine-Tuning Sliders */}
      <div className="glass-panel p-5 rounded-xl border border-navy-750">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-shield-cyan" />
          Network Telemetry Simulation Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latency dial */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Round-Trip Latency (RTT):</span>
              <span className="font-mono font-bold text-shield-cyan">
                {networkStatus === 'PARTITIONED' ? 'Air-Gapped (∞)' : `${networkLatencyMs} ms`}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="2500"
              step="10"
              disabled={networkStatus === 'PARTITIONED'}
              value={networkLatencyMs}
              onChange={e => setNetworkLatencyMs(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Fiber LAN (10ms)</span>
              <span>Cellular 4G (150ms)</span>
              <span>Subsea / Satellite (2500ms)</span>
            </div>
          </div>

          {/* Packet Drop */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Simulated Packet Loss Rate:</span>
              <span className="font-mono font-bold text-amber-400">{packetLossPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={packetLossPct}
              onChange={e => setPacketLossPct(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Clean (0%)</span>
              <span>Intermittent (25%)</span>
              <span>Severed (100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Node Cluster Status */}
      <div className="glass-panel p-5 rounded-xl border border-navy-750">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-shield-cyan" />
              Connected Edge Terminals Cluster
            </h3>
            <p className="text-xs text-slate-400">
              Distributed point-of-sale nodes operating under local cryptographic risk quotas
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
            {terminals.length} Nodes Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terminals.map(term => {
            const isTerminalPartitioned = networkStatus === 'PARTITIONED' || term.status === 'PARTITIONED';
            return (
              <div
                key={term.id}
                className="p-4 rounded-xl bg-navy-900/80 border border-navy-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-shield-cyan">{term.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        isTerminalPartitioned
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : term.status === 'DEGRADED' || networkStatus === 'DEGRADED'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        {isTerminalPartitioned ? 'PARTITIONED' : term.status === 'DEGRADED' || networkStatus === 'DEGRADED' ? 'DEGRADED' : 'ONLINE'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">{term.name}</div>
                    <div className="text-xs text-slate-400">{term.location}</div>
                  </div>

                  <div className="h-8 w-8 rounded-lg bg-navy-850 flex items-center justify-center text-slate-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                </div>

                {/* Offline Quota Meter */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Offline Volume Buffer:</span>
                    <span className="text-slate-200">
                      {formatCurrency(term.currentOfflineVolume)} / {formatCurrency(term.offlineTxCap)}
                    </span>
                  </div>
                  <div className="w-full bg-navy-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-shield-cyan h-full rounded-full transition-all"
                      style={{ width: `${(term.currentOfflineVolume / term.offlineTxCap) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-navy-850">
                  <span>Ping: {isTerminalPartitioned ? 'NO RESPONSE' : `${term.latencyMs}ms`}</span>
                  <span>Enclave: Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
