import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import { NavTab } from '../layout/Sidebar';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  QrCode,
  Store,
  Activity,
  UserX,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/crypto';
import { evaluateFraudRisk } from '../../services/fraudEngine';

interface SecurityViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ setActiveTab }) => {
  const { transactions, selectedCard, fraudRules } = usePayShield();

  // Sandbox testing state
  const [testMerchant, setTestMerchant] = useState<string>('FreshMart');
  const [testAmount, setTestAmount] = useState<number>(450);
  const [testQr, setTestQr] = useState<string>('upi://pay?pa=freshmart@bank&pn=FreshMart');
  const [testIsOffline, setTestIsOffline] = useState<boolean>(false);

  // Compute live sandbox evaluation
  const sandboxEvaluation = evaluateFraudRisk({
    card: selectedCard,
    amount: testAmount,
    merchant: testMerchant,
    mcc: '5411',
    qrDestination: testQr,
    transactionId: 'TXN-SANDBOX-TEST',
    isOffline: testIsOffline,
    existingTransactions: transactions,
    rules: fraudRules,
  });

  const totalScreened = transactions.length;
  const totalBlocked = transactions.filter(
    t =>
      t.status === 'REJECTED_FRAUD' ||
      t.status === 'REJECTED_LIMIT_EXCEEDED' ||
      t.status === 'REPLAY_DUPLICATE_BLOCKED'
  ).length;
  const totalPassed = totalScreened - totalBlocked;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Payment Security
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inline fraud screening across merchant identity, behavioral anomaly signals, and mule-chain patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Inline Guard: Active (7 Rules)</span>
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fintech-card p-4">
          <span className="text-xs text-slate-500 font-medium">Total Screened Payments</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalScreened}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">100% analyzed inline before authorization</span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-xs text-slate-500 font-medium">Approved / Passed</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {totalPassed}
          </div>
          <span className="text-[11px] text-emerald-700/80 mt-0.5 block">Legitimate digital transactions</span>
        </div>

        <div className="fintech-card p-4">
          <span className="text-xs text-slate-500 font-medium">Threats Blocked</span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {totalBlocked}
          </div>
          <span className="text-[11px] text-rose-700/80 mt-0.5 block">Zero fraud losses permitted</span>
        </div>
      </div>

      {/* 3 Clear Security Categories */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Inline Protection Categories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Category 1: Merchant & QR Protection */}
          <div className="fintech-card p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                1. Merchant & QR Protection
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Prevents destination tampering and verifies merchant authenticity before any payment is authorized.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">QR Mismatch Detection</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Validates that QR UPI handle matches registered merchant name.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">Merchant Identity Verification</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Screens against blacklisted and fraudulent merchant listings.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">Destination Validation</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Detects spoofed redirect strings and modified QR payloads.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Rule Code:</span>
              <span className="font-mono text-blue-700 font-semibold">QR_DESTINATION_MISMATCH</span>
            </div>
          </div>

          {/* Category 2: Transaction Behavior */}
          <div className="fintech-card p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                2. Transaction Behavior
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Evaluates payment velocities, sudden high values, repeated replay attacks, and device anomalies.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">High-Value Threshold Check</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Rejects amounts exceeding ₹5,000 regulatory instant payment cap.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">Partition Spending Cap</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Enforces strict ₹2,000 cumulative quota during offline network outage.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">Replay & Repeated Tx Detection</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Neutralizes replay attacks by tracking transaction ID and idempotency keys.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Rule Code:</span>
              <span className="font-mono text-purple-700 font-semibold">HIGH_VALUE / REPEATED_TX</span>
            </div>
          </div>

          {/* Category 3: Suspicious Account Patterns */}
          <div className="fintech-card p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <UserX className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                3. Suspicious Account Patterns
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Flags mule accounts, compromised intermediary handles, and laundering indicators.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">Mule-Chain Pattern Screening</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Flags addresses containing blacklisted keywords ("scam", "mule", "drainer").
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">Rogue Merchant Screening</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Blocks unrecognized merchants matching known shell store footprints.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-800">Velocity Spike Guard</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Throttles rapid automated transfers across disassociated nodes.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Rule Code:</span>
              <span className="font-mono text-rose-700 font-semibold">SUSPICIOUS_RECIPIENT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Fraud Rule Sandbox */}
      <div className="fintech-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Interactive Fraud Rule Sandbox
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Simulate decisions in real-time with zero wallet impact
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Merchant Name
              </label>
              <input
                type="text"
                value={testMerchant}
                onChange={e => setTestMerchant(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTestMerchant('FreshMart');
                    setTestQr('upi://pay?pa=freshmart@bank&pn=FreshMart');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 hover:bg-slate-200"
                >
                  Set FreshMart (Safe)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestMerchant('Unknown Merchant');
                    setTestQr('upi://pay?pa=unknownmerchant@bank');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-rose-600 hover:bg-slate-200"
                >
                  Set Unknown Merchant (Rogue)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={testAmount}
                onChange={e => setTestAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setTestAmount(450)}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 hover:bg-slate-200"
                >
                  ₹450 (Safe)
                </button>
                <button
                  type="button"
                  onClick={() => setTestAmount(2500)}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-amber-700 hover:bg-slate-200"
                >
                  ₹2,500 (Offline Breached)
                </button>
                <button
                  type="button"
                  onClick={() => setTestAmount(6500)}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-rose-600 hover:bg-slate-200"
                >
                  ₹6,500 (High Value)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Destination QR / UPI String
              </label>
              <input
                type="text"
                value={testQr}
                onChange={e => setTestQr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setTestQr('upi://pay?pa=scam_mule_account@bank')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-rose-600 hover:bg-slate-200"
                >
                  Tamper with Scam QR
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="sandboxOffline"
                checked={testIsOffline}
                onChange={e => setTestIsOffline(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sandboxOffline" className="text-xs text-slate-700 font-medium">
                Simulate Network Offline Mode (triggers ₹2,000 quota enforcement)
              </label>
            </div>
          </div>

          {/* Real-Time Sandbox Decision Output */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Engine Evaluation
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  sandboxEvaluation.decision === 'APPROVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : sandboxEvaluation.decision === 'CHALLENGE'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {sandboxEvaluation.decision === 'APPROVE'
                    ? '✓ PASSED'
                    : sandboxEvaluation.decision === 'CHALLENGE'
                    ? '⚠ REVIEW'
                    : '✕ BLOCKED'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Risk Score:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {sandboxEvaluation.riskScore}/100 ({sandboxEvaluation.tier})
                  </span>
                </div>

                {sandboxEvaluation.ruleTriggered && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reason Code:</span>
                    <span className="font-mono font-bold text-rose-600">
                      {sandboxEvaluation.ruleTriggered}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Explainable Rationale:</span>
                  <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium">
                    {sandboxEvaluation.reasons[0]}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-400">
              Evaluated deterministically in &lt;1ms via client-side risk heuristics.
            </div>
          </div>
        </div>
      </div>

      {/* Decision History */}
      <div className="fintech-card p-6">
        <h2 className="text-base font-bold text-slate-900 mb-3 pb-3 border-b border-slate-100">
          Recent Security Screenings
        </h2>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <ShieldCheck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p>No transactions screened yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.slice(0, 6).map(tx => {
              const isBlocked =
                tx.status === 'REJECTED_FRAUD' ||
                tx.status === 'REJECTED_LIMIT_EXCEEDED' ||
                tx.status === 'REPLAY_DUPLICATE_BLOCKED';

              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                      isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isBlocked ? '✕' : '✓'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{tx.merchant}</span>
                        <span className="font-mono text-slate-400 text-[11px]">{tx.id}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        {tx.fraudAnalysis.reasons[0]}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900">
                      {formatCurrency(tx.amount)}
                    </div>
                    {tx.fraudAnalysis.ruleTriggered ? (
                      <span className="text-[10px] font-mono font-bold text-rose-600">
                        {tx.fraudAnalysis.ruleTriggered}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        CLEAN_PASS
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
