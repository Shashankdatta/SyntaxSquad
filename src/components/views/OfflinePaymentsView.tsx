import React, { useState } from 'react';
import { usePayShield, ProcessPaymentParams } from '../../context/PayShieldContext';
import { NavTab } from '../layout/Sidebar';
import { DEMO_MERCHANT_PRESETS } from '../../data/mockData';
import {
  WifiOff,
  Wifi,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronDown,
  AlertTriangle,
  Send,
  RotateCcw,
  Layers,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/crypto';

interface OfflinePaymentsViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const OfflinePaymentsView: React.FC<OfflinePaymentsViewProps> = ({ setActiveTab }) => {
  const {
    networkStatus,
    setNetworkStatus,
    selectedCard,
    offlineQueue,
    processPayment,
    isProcessing,
  } = usePayShield();

  const [quickAmount, setQuickAmount] = useState<number>(120);
  const [quickMerchant, setQuickMerchant] = useState<string>('Metro Transit');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const remainingAllowance = Math.max(0, selectedCard.offlineCumulativeLimit - selectedCard.offlineCurrentSpent);
  const spentPercent = Math.min(100, Math.round((selectedCard.offlineCurrentSpent / selectedCard.offlineCumulativeLimit) * 100));
  const pendingQueue = offlineQueue.filter(q => q.status === 'PENDING_SYNC');

  const handleQuickOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    // Auto-switch to offline mode if currently online to fulfill offline test
    if (networkStatus === 'ONLINE') {
      setNetworkStatus('PARTITIONED');
    }

    const preset = DEMO_MERCHANT_PRESETS.find(p => p.name === quickMerchant);
    const qrDestination = preset ? preset.qr : `upi://pay?pa=${quickMerchant.toLowerCase().replace(/\s+/g, '')}@bank`;

    const params: ProcessPaymentParams = {
      cardId: selectedCard.id,
      amount: quickAmount,
      merchant: quickMerchant,
      qrDestination,
    };

    const res = await processPayment(params);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `Offline payment of ${formatCurrency(quickAmount)} for ${quickMerchant} authorized successfully and added to pending queue!`,
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.error || 'Offline payment blocked: Limit exceeded or security check tripped.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Offline Payments
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Make limited, protected payments when connectivity is temporarily unavailable. Offline payments are verified and settled after the network returns.
        </p>
      </div>

      {/* Calm Offline State Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
        networkStatus === 'PARTITIONED'
          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          {networkStatus === 'PARTITIONED' ? (
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <WifiOff className="h-5 w-5" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Wifi className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="font-bold text-sm text-slate-900">
              {networkStatus === 'PARTITIONED' ? 'Offline Mode Active' : 'Online Mode (Network Connected)'}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {networkStatus === 'PARTITIONED'
                ? 'Offline mode active. Payments are limited, risk-screened, and queued for later reconciliation.'
                : 'Uplink active. You can simulate a network disruption anytime to demonstrate partition tolerance.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setNetworkStatus(networkStatus === 'PARTITIONED' ? 'ONLINE' : 'PARTITIONED')}
          className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shrink-0 shadow-2xs ${
            networkStatus === 'PARTITIONED'
              ? 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {networkStatus === 'PARTITIONED' ? 'Restore Uplink' : 'Simulate Network Outage'}
        </button>
      </div>

      {/* Allowance Meter & Security Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Offline Allowance Meter */}
        <div className="fintech-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Offline Allowance Meter
            </span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              ₹2,000 Regulatory Cap
            </span>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-2xl font-extrabold font-mono text-slate-900">
                {formatCurrency(remainingAllowance)}
              </span>
              <span className="text-xs text-slate-500">
                Remaining Allowance
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-300 ${
                  spentPercent > 80 ? 'bg-rose-500' : spentPercent > 50 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${spentPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
              <span>Spent: {formatCurrency(selectedCard.offlineCurrentSpent)}</span>
              <span>Cumulative Limit: ₹2,000</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Single payment ceiling:</span>
              <span className="font-semibold text-slate-900">₹2,000 max</span>
            </div>
            <div className="flex justify-between">
              <span>Offline transactions used:</span>
              <span className="font-semibold text-slate-900">{selectedCard.offlineTxCount} of {selectedCard.maxOfflineTxAllowed}</span>
            </div>
          </div>
        </div>

        {/* Offline Security Checks Active */}
        <div className="fintech-card p-5 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Offline Protection Policies
          </span>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-950">Local Spending Limit Enforcement</span>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Transactions exceeding remaining allowance are blocked instantly at the edge.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-950">Inline QR & Merchant Matching</span>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Protects against rogue merchants even without cloud lookups.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-950">Cryptographic Nonce Generation</span>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Each payment signs a unique SHA-256 HMAC payload preventing replay attacks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Offline Payment Trigger */}
      <div className="fintech-card p-5">
        <h2 className="text-base font-bold text-slate-900 mb-2">
          Test an Offline Payment
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Authorizes a payment under the partition allowance and enqueues it for post-partition settlement.
        </p>

        {feedbackMsg && (
          <div className={`p-3 rounded-lg text-xs mb-4 flex items-start gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleQuickOfflinePayment} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Merchant
            </label>
            <select
              value={quickMerchant}
              onChange={e => setQuickMerchant(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-900"
            >
              {DEMO_MERCHANT_PRESETS.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              value={quickAmount || ''}
              onChange={e => setQuickAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Authorize Offline</span>
            </button>
          </div>
        </form>
      </div>

      {/* Pending Offline Queue Table */}
      <div className="fintech-card p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pending Offline Transactions ({pendingQueue.length})
            </h2>
            <p className="text-xs text-slate-500">
              Payments stored in encrypted local queue awaiting network reconnection.
            </p>
          </div>

          {pendingQueue.length > 0 && (
            <button
              onClick={() => setActiveTab('settlement')}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>Go to Settlement</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {pendingQueue.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
            <p className="font-semibold text-slate-700">Offline Queue Clean</p>
            <p className="text-slate-400 mt-0.5">No pending offline payments waiting for sync.</p>
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
                  <th className="py-2.5 px-3">Enqueued Time</th>
                  <th className="py-2.5 px-3">Queue State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingQueue.map(item => (
                  <tr key={item.queueId} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
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
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {formatDateTime(item.enqueuedAt)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                        <Clock className="h-3 w-3" />
                        Pending Settlement
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expandable Advanced Transaction Details */}
      <div className="fintech-card p-5">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800"
        >
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            <span>Advanced Cryptographic Envelope Details</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs">
            <p className="text-slate-500 text-[11px]">
              Every offline payment produces a verifiable cryptographic envelope stored in local tamper-evident storage.
            </p>

            {pendingQueue.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 text-slate-400 text-center text-xs">
                Authorize an offline transaction to view its cryptographic signature and envelope fields here.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingQueue.map(item => (
                  <div key={item.queueId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between font-sans font-bold text-slate-900">
                      <span>Tx: {item.transaction.id}</span>
                      <span className="text-emerald-700">✓ Cryptographically Verified</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Token Nonce:</span>
                      <span className="text-slate-900">{item.transaction.offlineEnvelope?.nonce || 'NONCE-4091-889'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Terminal Device ID:</span>
                      <span className="text-slate-900">{item.transaction.deviceId || item.transaction.terminalId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Allowance Limit at Auth:</span>
                      <span className="text-slate-900">{formatCurrency(item.transaction.offlineEnvelope?.cardRemainingLimit || 2000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Token Validity / Expiry:</span>
                      <span className="text-slate-900">24 Hours (Rolling TTL)</span>
                    </div>
                    <div className="flex flex-col pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-sans">Offline Signature SHA-256 Digest:</span>
                      <span className="text-slate-700 break-all text-[10px] mt-0.5">
                        {item.transaction.offlineEnvelope?.offlineSignatureSha256 || item.payloadHash}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
