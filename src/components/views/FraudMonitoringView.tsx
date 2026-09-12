import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  Lock,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/crypto';
import { FraudRulesConfig, Transaction } from '../../types';

export const FraudMonitoringView: React.FC = () => {
  const {
    fraudRules,
    updateFraudRules,
    transactions,
  } = usePayShield();

  const [formRules, setFormRules] = useState<FraudRulesConfig>(fraudRules);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inspectedTx, setInspectedTx] = useState<Transaction | null>(null);

  // Filter transactions
  const flaggedTransactions = transactions.filter(
    t => t.fraudAnalysis.riskScore >= 25 || t.status === 'REJECTED_FRAUD' || t.status === 'REPLAY_DUPLICATE_BLOCKED'
  );

  const lowRiskCount = transactions.filter(t => t.fraudAnalysis.tier === 'LOW').length;
  const medRiskCount = transactions.filter(t => t.fraudAnalysis.tier === 'MEDIUM').length;
  const highRiskCount = transactions.filter(t => t.fraudAnalysis.tier === 'HIGH').length;
  const critRiskCount = transactions.filter(t => t.fraudAnalysis.tier === 'CRITICAL').length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateFraudRules(formRules);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-purple-400" />
            Inline Fraud Screening & Edge Rules Engine
          </h2>
          <p className="text-xs text-slate-400">
            Real-time heuristic evaluation running inside isolated edge enclaves, protecting against offline double-spends and velocity attacks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Model:</span>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800">
            Nexus-Edge-Heuristics v3
          </span>
        </div>
      </div>

      {/* Risk Distribution Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span className="font-semibold">LOW RISK (0-24)</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{lowRiskCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Direct pass-through authorization</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span className="font-semibold">MEDIUM RISK (25-49)</span>
            <AlertTriangle className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">{medRiskCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Logged with behavioral telemetry</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span className="font-semibold">HIGH RISK (50-74)</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{highRiskCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Reduced offline allowance or challenge</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-navy-750">
          <div className="flex items-center justify-between text-slate-400 mb-1 text-xs">
            <span className="font-semibold">CRITICAL / BLOCKED (75+)</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{critRiskCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Outright edge decline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configurable Rules Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-xl border border-navy-750">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-shield-cyan" />
                Active Heuristic Rules Matrix
              </h3>
              <span className="text-[10px] font-mono text-shield-cyan">Edge Policy</span>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Rule 1: Max Single Offline Amount */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Single Offline Transaction Cap ($)
                </label>
                <input
                  type="number"
                  value={formRules.maxSingleOfflineAmount}
                  onChange={e => setFormRules({ ...formRules, maxSingleOfflineAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-750 text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Transactions above this ceiling are declined during air-gap partition.
                </span>
              </div>

              {/* Rule 2: Risk Block Threshold */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Decline Score Threshold (0 - 100)
                </label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={formRules.riskScoreThresholdBlock}
                  onChange={e => setFormRules({ ...formRules, riskScoreThresholdBlock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-750 text-rose-400 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Any composite score exceeding this is instantly declined at the POS.
                </span>
              </div>

              {/* Rule 3: Geo Anomaly Distance */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Max Travel Speed Jump Threshold (km)
                </label>
                <input
                  type="number"
                  value={formRules.geoAnomalyDistanceThresholdKm}
                  onChange={e => setFormRules({ ...formRules, geoAnomalyDistanceThresholdKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-750 text-white font-mono font-bold"
                />
              </div>

              {/* Toggle Switches */}
              <div className="pt-2 border-t border-navy-800 space-y-2">
                <label className="flex items-center justify-between p-2 rounded bg-navy-900 border border-navy-800 cursor-pointer">
                  <span className="text-slate-300">Enforce Hardware Root of Trust</span>
                  <input
                    type="checkbox"
                    checked={formRules.enableDeviceAttestation}
                    onChange={e => setFormRules({ ...formRules, enableDeviceAttestation: e.target.checked })}
                    className="rounded border-navy-700 text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-navy-900 border border-navy-800 cursor-pointer">
                  <span className="text-slate-300">Velocity Burst Protection</span>
                  <input
                    type="checkbox"
                    checked={formRules.enableVelocityGuard}
                    onChange={e => setFormRules({ ...formRules, enableVelocityGuard: e.target.checked })}
                    className="rounded border-navy-700 text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-navy-900 border border-navy-800 cursor-pointer">
                  <span className="text-slate-300">Strict Nonce Deduplication</span>
                  <input
                    type="checkbox"
                    checked={formRules.enableStrictIdempotency}
                    onChange={e => setFormRules({ ...formRules, enableStrictIdempotency: e.target.checked })}
                    className="rounded border-navy-700 text-cyan-500 focus:ring-0"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-shield-cyan hover:bg-cyan-300 text-navy-950 font-bold tracking-wide transition-colors"
              >
                {saveSuccess ? 'Rules Updated in Edge Enclave!' : 'Deploy Rule Updates to Edge'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Flagged & Blocked Transactions Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-xl border border-navy-750">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Flagged & Intercepted Transactions
                </h3>
                <p className="text-xs text-slate-400">Transactions triggering one or more inline risk rules</p>
              </div>
              <span className="text-xs font-mono text-rose-400 bg-rose-950 px-2.5 py-1 rounded border border-rose-800">
                {flaggedTransactions.length} Flagged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-navy-800 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="pb-3 font-semibold">Tx ID</th>
                    <th className="pb-3 font-semibold">Cardholder</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Risk Score</th>
                    <th className="pb-3 font-semibold">Decision</th>
                    <th className="pb-3 font-semibold text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 font-sans">
                  {flaggedTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-navy-850/40 transition-colors">
                      <td className="py-3 font-mono text-slate-200">{tx.id}</td>
                      <td className="py-3 text-slate-300">{tx.cardHolder}</td>
                      <td className="py-3 font-mono font-semibold text-white">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 font-mono">
                        <span className={`font-bold ${
                          tx.fraudAnalysis.riskScore >= 75
                            ? 'text-rose-400'
                            : tx.fraudAnalysis.riskScore >= 50
                            ? 'text-amber-400'
                            : 'text-cyan-400'
                        }`}>
                          {tx.fraudAnalysis.riskScore} / 100
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          tx.status === 'REJECTED_FRAUD' || tx.status === 'REPLAY_DUPLICATE_BLOCKED'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : tx.status === 'REJECTED_LIMIT_EXCEEDED'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setInspectedTx(tx)}
                          className="p-1 rounded bg-navy-850 hover:bg-navy-750 text-shield-cyan transition-colors"
                          title="Inspect Fraud Analysis Reasons"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspected Transaction Drawer */}
          {inspectedTx && (
            <div className="p-4 rounded-xl bg-navy-900 border border-shield-cyan/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-shield-cyan">
                  INSPECTING TRANSACTION: {inspectedTx.id}
                </span>
                <button
                  onClick={() => setInspectedTx(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="text-slate-300 font-semibold">Triggered Heuristics:</div>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  {inspectedTx.fraudAnalysis.reasons.map((r, i) => (
                    <li key={i} className="text-amber-300/90">{r}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-navy-800">
                <div>
                  <span className="text-slate-500">Merchant: </span>
                  <span className="text-slate-300">{inspectedTx.merchant}</span>
                </div>
                <div>
                  <span className="text-slate-500">MCC: </span>
                  <span className="text-slate-300">{inspectedTx.mcc}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
