import React, { useState } from 'react';
import { usePayShield, ProcessPaymentParams } from '../../context/PayShieldContext';
import { NavTab } from '../layout/Sidebar';
import { DEMO_MERCHANT_PRESETS } from '../../data/mockData';
import {
  Send,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Smartphone,
  Store,
  Wallet,
  Wifi,
  WifiOff,
  ChevronDown,
  RotateCcw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/crypto';
import { Transaction } from '../../types';

interface PayViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const PayView: React.FC<PayViewProps> = ({ setActiveTab }) => {
  const {
    networkStatus,
    setNetworkStatus,
    selectedCard,
    processPayment,
    isProcessing,
    transactions,
  } = usePayShield();

  // 3-step payment flow state: 1 = Details, 2 = Review, 3 = Result
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form inputs
  const [merchant, setMerchant] = useState<string>('FreshMart');
  const [amount, setAmount] = useState<number>(450);
  const [qrDestination, setQrDestination] = useState<string>('upi://pay?pa=freshmart@bank&pn=FreshMart');
  const [deviceId, setDeviceId] = useState<string>('POS-TERM-ALPHA-01');
  const [customTxId, setCustomTxId] = useState<string>('');
  const [showAdvancedInputs, setShowAdvancedInputs] = useState<boolean>(false);

  // Result state
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    transaction: Transaction | null;
    error?: string;
  } | null>(null);

  const remainingOffline = Math.max(0, selectedCard.offlineCumulativeLimit - selectedCard.offlineCurrentSpent);

  // Handle Preset Selection
  const applyPreset = (presetName: string) => {
    const found = DEMO_MERCHANT_PRESETS.find(p => p.name === presetName);
    if (found) {
      setMerchant(found.name);
      setAmount(found.defaultAmount);
      setQrDestination(found.qr);
      setCustomTxId('');
    }
  };

  // Specific Test Scenarios
  const applyTestScenario = (type: string) => {
    if (type === 'normal') {
      setNetworkStatus('ONLINE');
      setMerchant('FreshMart');
      setAmount(450);
      setQrDestination('upi://pay?pa=freshmart@bank&pn=FreshMart');
      setCustomTxId('');
    } else if (type === 'offline_safe') {
      setNetworkStatus('PARTITIONED');
      setMerchant('Metro Transit');
      setAmount(120);
      setQrDestination('upi://pay?pa=metrotransit@bank&pn=MetroTransit');
      setCustomTxId('');
    } else if (type === 'offline_breach') {
      setNetworkStatus('PARTITIONED');
      setMerchant('Local Cafe');
      setAmount(2500); // Exceeds ₹2,000 cap
      setQrDestination('upi://pay?pa=localcafe@bank&pn=LocalCafe');
      setCustomTxId('');
    } else if (type === 'high_value') {
      setNetworkStatus('ONLINE');
      setMerchant('Grocery Store');
      setAmount(6500); // Exceeds ₹5,000
      setQrDestination('upi://pay?pa=grocerystore@bank&pn=GroceryStore');
      setCustomTxId('');
    } else if (type === 'qr_mismatch') {
      setNetworkStatus('ONLINE');
      setMerchant('FreshMart');
      setAmount(500);
      setQrDestination('upi://pay?pa=scam_mule_account@suspicious&pn=DifferentVendor');
      setCustomTxId('');
    } else if (type === 'suspicious_merchant') {
      setNetworkStatus('ONLINE');
      setMerchant('Unknown Merchant');
      setAmount(750);
      setQrDestination('upi://pay?pa=unknownmerchant@bank&pn=UnknownMerchant');
      setCustomTxId('');
    } else if (type === 'replay_attack') {
      // Use existing transaction ID if available
      const existing = transactions[0];
      setMerchant('FreshMart');
      setAmount(300);
      setQrDestination('upi://pay?pa=freshmart@bank&pn=FreshMart');
      setCustomTxId(existing ? existing.id : 'TXN-REPLAY-9999');
    }
  };

  // Step 1 -> Step 2 validation
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !merchant.trim()) return;
    setStep(2);
  };

  // Step 2 -> Step 3 execution
  const handleAuthorizePayment = async () => {
    const params: ProcessPaymentParams = {
      cardId: selectedCard.id,
      amount,
      merchant,
      qrDestination,
      deviceId,
      transactionId: customTxId.trim() || undefined,
    };

    const res = await processPayment(params);
    setPaymentResult({
      success: res.success,
      transaction: res.transaction,
      error: res.error,
    });
    setStep(3);
  };

  // Reset to Step 1
  const handleResetForm = () => {
    setStep(1);
    setPaymentResult(null);
    setCustomTxId('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Flow Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Make a Payment
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time inline fraud screening with partition-tolerant offline fallback.
          </p>
        </div>

        {/* 3-Step Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
            step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            <span>1</span>
            <span>Details</span>
          </div>
          <span className="text-slate-300">&rarr;</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
            step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            <span>2</span>
            <span>Review</span>
          </div>
          <span className="text-slate-300">&rarr;</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
            step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            <span>3</span>
            <span>Result</span>
          </div>
        </div>
      </div>

      {/* Network & Account Info Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        networkStatus === 'ONLINE'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2.5">
          {networkStatus === 'ONLINE' ? (
            <Wifi className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {networkStatus === 'ONLINE' ? 'Online Mode Active' : 'Offline Mode Active'}
            </span>
            <p className="text-[11px] opacity-80 mt-0.5">
              {networkStatus === 'ONLINE'
                ? 'Transactions authorized in real-time via Central Switch.'
                : `Operating under offline protection. Remaining allowance: ${formatCurrency(remainingOffline)}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] opacity-75">Wallet Balance:</span>
          <span className="font-bold font-mono text-slate-900">
            {formatCurrency(selectedCard.accountBalance)}
          </span>
        </div>
      </div>

      {/* STEP 1: PAYMENT DETAILS */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Quick Scenario Buttons */}
          <div className="fintech-card p-4 bg-slate-50/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Quick Test Scenarios
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => applyTestScenario('normal')}
                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-medium transition-colors"
              >
                ✓ Normal Online (₹450)
              </button>
              <button
                type="button"
                onClick={() => applyTestScenario('offline_safe')}
                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-amber-800 font-medium transition-colors"
              >
                ⏱ Offline Pay (₹120)
              </button>
              <button
                type="button"
                onClick={() => applyTestScenario('offline_breach')}
                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-rose-700 font-medium transition-colors"
              >
                ✕ Offline Cap Breach (₹2,500)
              </button>
              <button
                type="button"
                onClick={() => applyTestScenario('high_value')}
                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-rose-700 font-medium transition-colors"
              >
                ✕ High Value (&gt;₹5,000)
              </button>
              <button
                type="button"
                onClick={() => applyTestScenario('qr_mismatch')}
                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-rose-700 font-medium transition-colors"
              >
                ✕ QR Mismatch
              </button>
              <button
                type="button"
                onClick={() => applyTestScenario('suspicious_merchant')}
                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-rose-700 font-medium transition-colors"
              >
                ✕ Suspicious Merchant
              </button>
              <button
                type="button"
                onClick={() => applyTestScenario('replay_attack')}
                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-purple-700 font-medium transition-colors"
              >
                ✕ Replay / Duplicate ID
              </button>
            </div>
          </div>

          {/* Payment Form Card */}
          <form onSubmit={handleProceedToReview} className="fintech-card p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Payment Details
            </h2>

            {/* Merchant Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Merchant / Store
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {DEMO_MERCHANT_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.name)}
                    className={`px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                      merchant === preset.name
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-400">{preset.category}</div>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                placeholder="Or enter custom merchant..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Amount (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 text-lg font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[150, 450, 850, 1500, 3500, 6000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-medium transition-colors"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Destination Payload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-slate-500" />
                  QR Destination Payload / UPI Handle
                </label>
                <span className="text-[10px] text-slate-400">Inline verified against merchant</span>
              </div>
              <input
                type="text"
                value={qrDestination}
                onChange={e => setQrDestination(e.target.value)}
                placeholder="e.g. upi://pay?pa=merchant@bank&pn=MerchantName"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Collapsible Advanced Parameters */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
              >
                <span>Advanced parameters (Device ID, Custom Tx ID)</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvancedInputs ? 'rotate-180' : ''}`} />
              </button>

              {showAdvancedInputs && (
                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Originating Device / Terminal ID
                    </label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={e => setDeviceId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Custom Transaction ID (use to simulate replay attacks)
                    </label>
                    <input
                      type="text"
                      value={customTxId}
                      onChange={e => setCustomTxId(e.target.value)}
                      placeholder="Leave blank for auto-generated ID"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit CTA */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center gap-2"
              >
                <span>Review Payment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: REVIEW PAYMENT */}
      {step === 2 && (
        <div className="fintech-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Review Payment Order
            </h2>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </button>
          </div>

          {/* Amount Card */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-medium">Total Payment Amount</span>
            <div className="text-4xl font-extrabold text-slate-900 font-mono mt-1">
              {formatCurrency(amount)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">From Demo Wallet (₹10,000 baseline)</span>
          </div>

          {/* Summary Details Table */}
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Merchant:</span>
              <span className="font-semibold text-slate-900">{merchant}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500">Destination QR / Handle:</span>
              <span className="font-mono text-slate-800 max-w-xs truncate">{qrDestination}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500">Network Mode:</span>
              <span className={`font-semibold flex items-center gap-1.5 ${
                networkStatus === 'ONLINE' ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {networkStatus === 'ONLINE' ? (
                  <>
                    <Wifi className="h-3.5 w-3.5" />
                    Online Real-Time Authorization
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5" />
                    Offline Partition Mode (Holding Queue)
                  </>
                )}
              </span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Originating Device:</span>
              <span className="font-mono text-slate-800">{deviceId}</span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-slate-800">{customTxId || '(Auto-generated UUID)'}</span>
            </div>
          </div>

          {/* Security Pre-Check Notice */}
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Inline Risk Engine Active</span>
              <p className="text-[11px] text-blue-800/80 mt-0.5">
                Payment will be screened against QR destination mismatch, blacklisted merchant lists, high-value limits, and partition quota.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
            >
              Back
            </button>

            <button
              onClick={handleAuthorizePayment}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Screening & Authorizing...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Authorize Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT RESULT */}
      {step === 3 && paymentResult && (
        <div className="fintech-card p-6 space-y-6">
          {/* Outcome Status Banner */}
          {paymentResult.success ? (
            paymentResult.transaction?.authMode === 'OFFLINE_PARTITION' ? (
              // Offline Authorized
              <div className="text-center py-6">
                <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Authorized Offline — Pending Settlement
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Payment successfully approved under the ₹2,000 partition allowance. Transaction is enqueued locally and will settle once the network reconnects.
                </p>
              </div>
            ) : (
              // Online Approved
              <div className="text-center py-6">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Payment Approved & Settled
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Transaction verified by inline risk engine and debited from central balance in real-time.
                </p>
              </div>
            )
          ) : (
            // Blocked / Declined
            <div className="text-center py-6">
              <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Payment Blocked
              </h2>
              <p className="text-xs text-rose-600 max-w-md mx-auto mt-1 font-medium">
                {paymentResult.error || 'Transaction tripped an inline fraud screening rule.'}
              </p>
            </div>
          )}

          {/* Receipt Breakdown */}
          {paymentResult.transaction && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  {paymentResult.transaction.id}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(paymentResult.transaction.amount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Merchant:</span>
                <span className="font-semibold text-slate-900">
                  {paymentResult.transaction.merchant}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Authorization Mode:</span>
                <span className="font-medium text-slate-800">
                  {paymentResult.transaction.authMode === 'OFFLINE_PARTITION' ? 'Offline Partition' : 'Online Central'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Risk Score:</span>
                <span className={`font-mono font-bold ${
                  paymentResult.transaction.fraudAnalysis.riskScore > 50 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {paymentResult.transaction.fraudAnalysis.riskScore}/100 ({paymentResult.transaction.fraudAnalysis.tier})
                </span>
              </div>

              {paymentResult.transaction.fraudAnalysis.ruleTriggered && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Rule Triggered:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {paymentResult.transaction.fraudAnalysis.ruleTriggered}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Current Wallet Balance:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(selectedCard.accountBalance)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Make Another Payment</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View in Transactions Ledger</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
