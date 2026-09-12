import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  Clock,
  Search,
  Filter,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  Hash,
} from 'lucide-react';
import { formatDateTime } from '../../utils/crypto';
import { AuditEvent } from '../../types';

export const ActivityLogView: React.FC = () => {
  const { auditLogs } = usePayShield();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'INFO'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    // Search
    const matchesSearch =
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.meta?.txId && log.meta.txId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Severity
    if (severityFilter !== 'ALL' && log.severity !== severityFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Activity Log & Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable, cryptographically chained audit events tracking all payment authorizations, screening decisions, and reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
            {auditLogs.length} Total Events
          </span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Action, Tx ID, or Actor..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            {(['ALL', 'SUCCESS', 'WARNING', 'CRITICAL', 'INFO'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  severityFilter === sev
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {sev === 'ALL' ? 'All Events' : sev.charAt(0) + sev.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="fintech-card overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Clock className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No matching activity records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type / Action</th>
                  <th className="py-3 px-4">Result / Severity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Digest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </td>

                        {/* Action / Type */}
                        <td className="py-3 px-4 font-semibold text-slate-900 font-mono text-[11px]">
                          {log.type}
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-4">
                          {log.severity === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              Success
                            </span>
                          ) : log.severity === 'CRITICAL' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                              <XCircle className="h-3 w-3" />
                              Blocked
                            </span>
                          ) : log.severity === 'WARNING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                              <AlertTriangle className="h-3 w-3" />
                              Warning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                              <Info className="h-3 w-3" />
                              Info
                            </span>
                          )}
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {log.actor}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 text-slate-800 max-w-xs sm:max-w-md truncate">
                          {log.description}
                        </td>

                        {/* Hash Digest */}
                        <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                          {log.hashDigest ? `${log.hashDigest.slice(0, 10)}...` : log.id}
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="p-4 space-y-2 border-b border-slate-200">
                            <div className="font-semibold text-slate-900 text-xs">
                              Detailed Audit Record ({log.id})
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed">
                              {log.description}
                            </p>
                            {log.meta && Object.keys(log.meta).length > 0 && (
                              <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                                <pre>{JSON.stringify(log.meta, null, 2)}</pre>
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row justify-between text-[10px] font-mono text-slate-400 pt-1">
                              <span>Digest: {log.hashDigest}</span>
                              <span>Prev: {log.prevHash}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
