import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import { NavTab } from '../layout/Sidebar';
import {
  Receipt,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  X,
  Shield,
  CreditCard,
  Lock,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/crypto';
import { Transaction } from '../../types';

interface TransactionsViewProps {
  setActiveTab: (tab: NavTab) => void;
}

type FilterStatus = 'ALL' | 'APPROVED' | 'PENDING' | 'BLOCKED' | 'REJECTED' | 'RECONCILED';

export const TransactionsView: React.FC<TransactionsViewProps> = ({ setActiveTab }) => {
  const { transactions, auditLogs } = usePayShield();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Search match
    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.qrDestination && tx.qrDestination.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Status filter
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'APPROVED') {
      return tx.status === 'APPROVED' || tx.status === 'SETTLED';
    }
    if (filterStatus === 'PENDING') {
      return tx.status === 'APPROVED_OFFLINE' || tx.reconciliationStatus?.state === 'PENDING';
    }
    if (filterStatus === 'BLOCKED') {
      return tx.status === 'REJECTED_FRAUD' || tx.status === 'REPLAY_DUPLICATE_BLOCKED';
    }
    if (filterStatus === 'REJECTED') {
      return tx.status === 'REJECTED_LIMIT_EXCEEDED' || tx.status === 'REJECTED_FRAUD';
    }
    if (filterStatus === 'RECONCILED') {
      return (
        tx.status === 'SETTLED' &&
        (tx.authMode === 'OFFLINE_PARTITION' || tx.reconciliationStatus?.state === 'LEDGER_SETTLED')
      );
    }
    return true;
  });

  // Get audit events related to selected transaction
  const getTxAuditEvents = (txId: string) => {
    return auditLogs.filter(
      a =>
        a.meta?.txId === txId ||
        a.description.includes(txId) ||
        (a.actor && a.actor.includes(txId))
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transactions Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete transaction record across online central and offline partition sessions.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('pay')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>New Payment</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Merchant or ID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'PENDING', label: 'Pending Settlement' },
                { id: 'BLOCKED', label: 'Blocked' },
                { id: 'REJECTED', label: 'Rejected' },
                { id: 'RECONCILED', label: 'Reconciled' },
              ] as const
            ).map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  filterStatus === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="fintech-card overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No transactions found</p>
            <p className="mt-1 text-slate-400">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Transaction ID & Time</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Decision</th>
                  <th className="py-3 px-4">Settlement Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(tx => {
                  const isSettled = tx.status === 'SETTLED';
                  const isOfflineApproved = tx.status === 'APPROVED_OFFLINE';
                  const isBlocked =
                    tx.status === 'REJECTED_FRAUD' ||
                    tx.status === 'REJECTED_LIMIT_EXCEEDED' ||
                    tx.status === 'REPLAY_DUPLICATE_BLOCKED';

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* ID & Time */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900">
                          {tx.id}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateTime(tx.timestamp)}
                        </div>
                      </td>

                      {/* Merchant */}
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {tx.merchant}
                      </td>

                      {/* Mode */}
                      <td className="py-3 px-4">
                        {tx.authMode === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                            <Wifi className="h-3 w-3" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            <WifiOff className="h-3 w-3" />
                            Offline
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(tx.amount)}
                      </td>

                      {/* Decision */}
                      <td className="py-3 px-4">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approved
                          </span>
                        ) : isOfflineApproved ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <Clock className="h-3.5 w-3.5" />
                            Authorized Offline
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <XCircle className="h-3.5 w-3.5" />
                            Blocked
                          </span>
                        )}
                      </td>

                      {/* Settlement */}
                      <td className="py-3 px-4">
                        {isSettled ? (
                          <span className="text-[11px] text-slate-600 font-medium">
                            Settled in Ledger
                          </span>
                        ) : isOfflineApproved ? (
                          <span className="text-[11px] text-amber-600 font-medium">
                            Pending Reconnect
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            N/A (Declined)
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium group-hover:underline inline-flex items-center gap-0.5 text-xs"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal / Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Transaction Receipt
                </span>
                <h2 className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {selectedTx.id}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatDateTime(selectedTx.timestamp)}
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Top Amount Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500">Amount Charged</span>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {formatCurrency(selectedTx.amount)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500">Final Decision</span>
                <div>
                  {selectedTx.status === 'SETTLED' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approved & Settled
                    </span>
                  ) : selectedTx.status === 'APPROVED_OFFLINE' ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                      Authorized Offline
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-xs bg-rose-50 px-2 py-1 rounded border border-rose-200">
                      <XCircle className="h-3.5 w-3.5" />
                      Blocked / Rejected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Core Transaction Metadata */}
            <div className="text-xs space-y-2.5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Payment Metadata
              </h3>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Merchant:</span>
                  <span className="font-semibold text-slate-900">{selectedTx.merchant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Merchant Category Code:</span>
                  <span className="font-mono text-slate-800">{selectedTx.mcc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination QR / Handle:</span>
                  <span className="font-mono text-slate-800 break-all text-[11px]">
                    {selectedTx.qrDestination || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorization Mode:</span>
                  <span className="font-medium text-slate-800">
                    {selectedTx.authMode === 'OFFLINE_PARTITION' ? 'Offline Partition Mode' : 'Online Real-Time'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Terminal / Device ID:</span>
                  <span className="font-mono text-slate-800">{selectedTx.deviceId || selectedTx.terminalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Idempotency Key:</span>
                  <span className="font-mono text-[11px] text-slate-700">{selectedTx.idempotencyKey}</span>
                </div>
              </div>
            </div>

            {/* Fraud Screening Assessment */}
            <div className="text-xs space-y-2.5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Inline Fraud Screening
              </h3>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Risk Score:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedTx.fraudAnalysis.riskScore}/100 ({selectedTx.fraudAnalysis.tier})
                  </span>
                </div>
                {selectedTx.fraudAnalysis.ruleTriggered && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Rule Triggered:</span>
                    <span className="font-mono font-bold text-rose-600">
                      {selectedTx.fraudAnalysis.ruleTriggered}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block mb-1">Risk Assessment Reasons:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                    {selectedTx.fraudAnalysis.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Offline Envelope (if offline) */}
            {selectedTx.offlineEnvelope && (
              <div className="text-xs space-y-2.5">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Cryptographic Offline Envelope
                </h3>
                <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/40 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-amber-800 font-sans">Auth Token Nonce:</span>
                    <span className="font-bold text-amber-900">{selectedTx.offlineEnvelope.nonce}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-800 font-sans">Remaining Card Limit:</span>
                    <span className="text-amber-900 font-bold">
                      {formatCurrency(selectedTx.offlineEnvelope.cardRemainingLimit)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-amber-800 font-sans">Cryptographic Signature (SHA-256):</span>
                    <span className="text-slate-600 break-all text-[10px] mt-0.5">
                      {selectedTx.offlineEnvelope.offlineSignatureSha256}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Log Entries for this transaction */}
            {getTxAuditEvents(selectedTx.id).length > 0 && (
              <div className="text-xs space-y-2.5">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Audit Trail
                </h3>
                <div className="space-y-1.5">
                  {getTxAuditEvents(selectedTx.id).map(evt => (
                    <div
                      key={evt.id}
                      className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] flex items-start gap-2"
                    >
                      <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">{evt.actor}: </span>
                        <span className="text-slate-600">{evt.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close CTA */}
            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
