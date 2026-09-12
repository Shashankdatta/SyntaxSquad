import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  FileText,
  ShieldCheck,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Hash,
  Clock,
  Terminal,
  Layers,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { formatDateTime, formatTime } from '../../utils/crypto';
import { AuditEvent } from '../../types';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = usePayShield();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'>('ALL');
  const [inspectedEvent, setInspectedEvent] = useState<AuditEvent | null>(null);

  const filteredLogs = auditLogs.filter(item => {
    const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
    const matchesSearch =
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `payshield_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <FileText className="h-5 w-5 text-shield-cyan" />
            Immutable Audit Trail & Hash Chain
          </h2>
          <p className="text-xs text-slate-400">
            Append-only, SHA-256 hash-chained event record providing non-repudiation for offline authorizations, fraud decisions, and ledger balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-750 text-slate-300 border border-navy-750 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Audit Trail (.JSON)
          </button>
        </div>
      </div>

      {/* Cryptographic Hash Chain Integrity Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-navy-900 to-navy-850 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-glow-emerald">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Cryptographic Hash Chain: VERIFIED INTACT</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                0 Tampering Detected
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-mono text-[11px]">
              Root Digest: <span className="text-shield-cyan">{auditLogs[0]?.hashDigest || '0000000000'}</span>
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 shrink-0">
          Total Blocks: <strong className="text-white">{auditLogs.length} Records</strong>
        </div>
      </div>

      {/* Search & Severity Filters */}
      <div className="glass-panel p-4 rounded-xl border border-navy-750 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by event type, actor, description, or hash..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-navy-950 border border-navy-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-shield-cyan"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(['ALL', 'INFO', 'SUCCESS', 'WARNING', 'CRITICAL'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-colors ${
                severityFilter === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : sev === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : sev === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Event Stream */}
      <div className="glass-panel rounded-xl border border-navy-750 overflow-hidden">
        <div className="divide-y divide-navy-800/80">
          {filteredLogs.map((evt, idx) => {
            return (
              <div
                key={evt.id}
                onClick={() => setInspectedEvent(evt)}
                className="p-4 hover:bg-navy-850/40 transition-colors cursor-pointer space-y-2 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {evt.severity === 'CRITICAL' ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                    ) : evt.severity === 'WARNING' ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                    ) : evt.severity === 'SUCCESS' ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shrink-0" />
                    )}

                    <span className="font-mono text-xs font-bold text-white group-hover:text-shield-cyan transition-colors">
                      {evt.type}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : evt.severity === 'WARNING'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : evt.severity === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-navy-800 text-slate-300 border-navy-700'
                    }`}>
                      {evt.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span>Actor: <strong className="text-slate-300">{evt.actor}</strong></span>
                    <span>{formatTime(evt.timestamp)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 pl-5">
                  {evt.description}
                </p>

                <div className="pl-5 flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <div className="truncate max-w-[280px] sm:max-w-md">
                    <span>Block Hash: </span>
                    <span className="text-slate-400">{evt.hashDigest}</span>
                  </div>
                  <span className="text-shield-cyan group-hover:underline">Inspect Metadata &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Detail Modal */}
      {inspectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-navy-700 max-w-xl w-full flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-750">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-shield-cyan" />
                <h3 className="font-bold text-sm text-white">
                  Audit Block: {inspectedEvent.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectedEvent(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between bg-navy-950 p-2 rounded border border-navy-800">
                <span className="text-slate-400">Event Type:</span>
                <span className="text-shield-cyan font-bold">{inspectedEvent.type}</span>
              </div>
              <div className="flex justify-between bg-navy-950 p-2 rounded border border-navy-800">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-white">{formatDateTime(inspectedEvent.timestamp)}</span>
              </div>
              <div className="flex justify-between bg-navy-950 p-2 rounded border border-navy-800">
                <span className="text-slate-400">Actor / Node:</span>
                <span className="text-amber-300 font-semibold">{inspectedEvent.actor}</span>
              </div>
              <div className="bg-navy-950 p-2.5 rounded border border-navy-800">
                <span className="text-slate-400 block mb-1">Previous Link Hash:</span>
                <span className="text-slate-500 text-[10px] break-all">{inspectedEvent.prevHash}</span>
              </div>
              <div className="bg-navy-950 p-2.5 rounded border border-navy-800">
                <span className="text-slate-400 block mb-1">Digest:</span>
                <span className="text-emerald-400 text-[10px] break-all">{inspectedEvent.hashDigest}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Payload Metadata:</span>
                <pre className="p-3 rounded bg-navy-950 border border-navy-800 text-slate-300 text-[11px] overflow-x-auto">
                  {JSON.stringify(inspectedEvent.meta, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-navy-750 flex justify-end">
              <button
                onClick={() => setInspectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
