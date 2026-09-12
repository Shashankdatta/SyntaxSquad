import React, { useState } from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  CreditCard,
  Wifi,
  WifiOff,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Zap,
  Lock,
  CheckCircle2,
  XCircle,
  Hash,
  Terminal,
  MapPin,
  Sliders,
  DollarSign,
  QrCode,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/crypto';
import { CardPreset, Transaction } from '../../types';
import { NavTab } from '../layout/Sidebar';

interface SimulatorViewProps {
  setActiveTab: (tab: NavTab) => void;
}

const PRESET_MERCHANTS = [
  { name: 'Starbucks Coffee', mcc: '5814 - Fast Food & Coffee', city: 'Mumbai', country: 'IN', defaultQr: 'starbucks@icici', defaultAmount: 380 },
  { name: 'Metro Transit Smart Fare', mcc: '4111 - Commuter Passenger Rail', city: 'Mumbai', country: 'IN', defaultQr: 'metrotransit@sbi', defaultAmount: 450 },
  { name: 'Reliance Fresh Supermarket', mcc: '5411 - Grocery Stores', city: 'Bengaluru', country: 'IN', defaultQr: 'reliancefresh@hdfc', defaultAmount: 1150 },
  { name: 'Apple Reseller Store', mcc: '5732 - Electronic Sales', city: 'New Delhi', country: 'IN', defaultQr: 'applereseller@axis', defaultAmount: 3200 },
  { name: 'Fake Store Electronics', mcc: '5999 - Miscellaneous High Risk', city: 'Online', country: 'IN', defaultQr: 'fakestore@paytm', defaultAmount: 1200 },
  { name: 'Mule Remittance Corp', mcc: '6051 - High Risk Money Transfer', city: 'Offshore', country: 'BVI', defaultQr: 'mule_scam_drainer@upi', defaultAmount: 850 },
];

export const SimulatorView: React.FC<SimulatorViewProps> = ({ setActiveTab }) => {
  const {
    networkStatus,
    cards,
    selectedCard,
    setSelectedCard,
    terminals,
    selectedTerminal,
    setSelectedTerminal,
    processPayment,
    transactions,
    isProcessing,
  } = usePayShield();

  const [amount, setAmount] = useState<number>(380);
  const [selectedMerchantPreset, setSelectedMerchantPreset] = useState(PRESET_MERCHANTS[0]);
  const [merchantName, setMerchantName] = useState<string>(PRESET_MERCHANTS[0].name);
  const [qrDestination, setQrDestination] = useState<string>(PRESET_MERCHANTS[0].defaultQr);
  const [deviceId, setDeviceId] = useState<string>('POS-TERM-ALPHA-01');
  const [transactionId, setTransactionId] = useState<string>(() => `TXN-${Math.floor(100000 + Math.random() * 900000)}`);

  const [spoofedFingerprint, setSpoofedFingerprint] = useState<boolean>(false);
  const [geoAnomaly, setGeoAnomaly] = useState<boolean>(false);
  const [velocitySpike, setVelocitySpike] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<Transaction | null>(null);

  const handleCardChange = (card: CardPreset) => {
    setSelectedCard(card);
    if (card.riskProfile === 'BLACK_LISTED') {
      const highRisk = PRESET_MERCHANTS[4];
      setSelectedMerchantPreset(highRisk);
      setMerchantName(highRisk.name);
      setQrDestination(highRisk.defaultQr);
    }
  };

  const handleMerchantPresetSelect = (preset: typeof PRESET_MERCHANTS[0]) => {
    setSelectedMerchantPreset(preset);
    setMerchantName(preset.name);
    setQrDestination(preset.defaultQr);
    setAmount(preset.defaultAmount);
  };

  const handleReplayPreviousTx = () => {
    if (transactions.length > 0) {
      setTransactionId(transactions[0].id);
    }
  };

  const handleAuthorize = async () => {
    const res = await processPayment({
      cardId: selectedCard.id,
      amount: Number(amount),
      merchant: merchantName,
      mcc: selectedMerchantPreset.mcc,
      location: { city: selectedMerchantPreset.city, country: selectedMerchantPreset.country },
      terminalId: selectedTerminal.id,
      deviceId,
      qrDestination,
      transactionId,
      customFlags: {
        spoofedFingerprint,
        geoAnomaly,
        velocitySpike,
      },
    });

    setLastResult(res.transaction);
    // Refresh transaction ID for next transaction
    setTransactionId(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const remainingOfflineLimit = Math.max(0, selectedCard.offlineCumulativeLimit - selectedCard.offlineCurrentSpent);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-shield-cyan" />
            Payment Simulator & Virtual POS Terminal
          </h2>
          <p className="text-xs text-slate-400">
            Test partition-tolerant offline authorizations, inline fraud checks, and cryptographic token issuance
          </p>
        </div>

        {/* Network State Reminder */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Current Network Mode:</span>
          <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border flex items-center gap-1.5 ${
            networkStatus === 'PARTITIONED'
              ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
              : networkStatus === 'DEGRADED'
              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}>
            {networkStatus === 'PARTITIONED' ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            {networkStatus === 'PARTITIONED' ? 'OFFLINE (PARTITIONED)' : networkStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Card Selection & Visual Card Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-xl border border-navy-750 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Debtor Account Persona
            </h3>

            {/* Persona Selector Buttons */}
            <div className="grid grid-cols-1 gap-2">
              {cards.map(card => {
                const isSelected = selectedCard.id === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardChange(card)}
                    className={`p-3 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-navy-800/90 border-shield-cyan shadow-glow-cyan/20 text-white'
                        : 'bg-navy-900/60 border-navy-800 hover:border-navy-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-white">{card.name}</div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        card.riskProfile === 'BLACK_LISTED'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : card.riskProfile === 'VELOCITY_RISK'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : card.riskProfile === 'NEAR_CAP'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        {card.riskProfile}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                      <span>{card.cardNumber}</span>
                      <span className="text-emerald-400 font-bold">Bal: {formatCurrency(card.accountBalance)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Virtual Card Graphic */}
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-tr from-navy-950 via-navy-900 to-cyan-950/70 border border-cyan-500/30 text-white shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-8 rounded bg-gradient-to-r from-amber-400 to-yellow-200 border border-amber-300/80 shadow-sm" />
                  <span className="text-[10px] font-mono text-cyan-300 tracking-widest uppercase">
                    PayShield Contactless
                  </span>
                </div>
                <div className="font-mono font-bold tracking-widest text-shield-cyan text-sm">
                  NEXUS RUPEE
                </div>
              </div>

              <div className="font-mono text-base md:text-lg tracking-[0.2em] font-semibold text-slate-100 my-4">
                {selectedCard.cardNumber}
              </div>

              <div className="flex items-end justify-between text-xs font-mono">
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Cardholder</div>
                  <div className="font-semibold tracking-wider text-slate-200">{selectedCard.cardHolder}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Available Balance</div>
                  <div className="font-bold text-emerald-400 text-sm">{formatCurrency(selectedCard.accountBalance)}</div>
                </div>
              </div>

              <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Card Offline Capacity Meter */}
            <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Offline Spending Reserve Used:</span>
                <span className="font-mono font-semibold text-amber-400">
                  {formatCurrency(selectedCard.offlineCurrentSpent)} / {formatCurrency(selectedCard.offlineCumulativeLimit)}
                </span>
              </div>
              <div className="w-full bg-navy-850 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (selectedCard.offlineCurrentSpent / selectedCard.offlineCumulativeLimit) > 0.8
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                  style={{
                    width: `${Math.min(100, (selectedCard.offlineCurrentSpent / selectedCard.offlineCumulativeLimit) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span className="text-emerald-400">Remaining Quota: {formatCurrency(remainingOfflineLimit)}</span>
                <span>Max Reserve: {formatCurrency(selectedCard.offlineCumulativeLimit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Terminal Controls & Transaction Execution (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-xl border border-navy-750 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Payment Terminal Parameters</span>
              <Terminal className="h-4 w-4 text-shield-cyan" />
            </h3>

            {/* Merchant Presets Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Merchant Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_MERCHANTS.map((p) => {
                  const isSelected = merchantName === p.name;
                  const isHighRisk = p.name.toLowerCase().includes('fake') || p.name.toLowerCase().includes('mule');
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleMerchantPresetSelect(p)}
                      className={`p-2 rounded-lg text-left text-xs border transition-all ${
                        isSelected
                          ? 'border-shield-cyan bg-cyan-950/40 text-white font-semibold'
                          : isHighRisk
                          ? 'border-rose-800/60 bg-rose-950/20 text-slate-300 hover:border-rose-600'
                          : 'border-navy-800 bg-navy-900 text-slate-300 hover:bg-navy-850'
                      }`}
                    >
                      <div className="truncate text-[11px]">{p.name}</div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>₹{p.defaultAmount}</span>
                        {isHighRisk && <span className="text-rose-400 font-bold">Risk</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Merchant Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Merchant Name
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-navy-950 border border-navy-750 text-white text-xs font-medium focus:outline-none focus:border-shield-cyan"
                  placeholder="e.g. Starbucks Coffee"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category / MCC
                </label>
                <input
                  type="text"
                  value={selectedMerchantPreset.mcc}
                  readOnly
                  className="w-full px-3.5 py-2 rounded-lg bg-navy-900 border border-navy-800 text-slate-400 text-xs font-mono"
                />
              </div>
            </div>

            {/* Amount Input with Quick Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Transaction Amount (₹)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {networkStatus === 'PARTITIONED'
                    ? `Offline Cap: ₹${remainingOfflineLimit.toLocaleString('en-IN')} avail`
                    : 'Max Instant: ₹5,000'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-navy-950 border border-navy-750 text-white font-mono text-lg font-bold focus:outline-none focus:border-shield-cyan transition-colors"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[250, 450, 1200, 2200, 5200].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      amount === val
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
                    }`}
                  >
                    ₹{val.toLocaleString('en-IN')} {val > 5000 ? '(High Value)' : val > 2000 && networkStatus === 'PARTITIONED' ? '(Exceeds Offline Limit)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Destination & Device ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    QR Destination
                  </label>
                  <button
                    type="button"
                    onClick={() => setQrDestination('scam_mule_drainer@fakeupi')}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    + Tamper QR
                  </button>
                </div>
                <div className="relative">
                  <QrCode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={qrDestination}
                    onChange={(e) => setQrDestination(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-navy-950 border border-navy-750 text-white text-xs font-mono focus:outline-none focus:border-shield-cyan"
                    placeholder="merchant@bank"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Device Terminal ID
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-navy-950 border border-navy-750 text-white text-xs font-mono focus:outline-none focus:border-shield-cyan"
                    placeholder="POS-TERM-ALPHA-01"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Transaction ID & Replay Attack Tester */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Transaction Identifier
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTransactionId(`TXN-${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="text-[10px] text-shield-cyan hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    Regenerate
                  </button>
                  {transactions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleReplayPreviousTx}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      | Simulate Replay
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-navy-950 border border-navy-750 text-slate-300 text-xs font-mono focus:outline-none focus:border-shield-cyan"
                required
              />
            </div>

            {/* Advanced Anomaly & Attack Simulation Flags */}
            <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-shield-cyan" />
                  Inline Edge Attack Simulations
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Test Fraud Engine</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 rounded bg-navy-900 border border-navy-800 text-xs cursor-pointer hover:bg-navy-850">
                  <input
                    type="checkbox"
                    checked={velocitySpike}
                    onChange={e => setVelocitySpike(e.target.checked)}
                    className="rounded border-navy-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300 text-[11px]">Velocity Spike</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-navy-900 border border-navy-800 text-xs cursor-pointer hover:bg-navy-850">
                  <input
                    type="checkbox"
                    checked={geoAnomaly}
                    onChange={e => setGeoAnomaly(e.target.checked)}
                    className="rounded border-navy-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300 text-[11px]">Geo Anomaly</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-navy-900 border border-navy-800 text-xs cursor-pointer hover:bg-navy-850">
                  <input
                    type="checkbox"
                    checked={spoofedFingerprint}
                    onChange={e => setSpoofedFingerprint(e.target.checked)}
                    className="rounded border-navy-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300 text-[11px]">Attestation Spoof</span>
                </label>
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              disabled={isProcessing || !amount || amount <= 0}
              onClick={handleAuthorize}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg ${
                isProcessing
                  ? 'bg-navy-800 text-slate-400 cursor-not-allowed'
                  : networkStatus === 'PARTITIONED'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-navy-950 shadow-glow-amber'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-navy-950 shadow-glow-cyan'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Inline Heuristics & Cryptographic Envelope...</span>
                </>
              ) : networkStatus === 'PARTITIONED' ? (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span>Authorize via Controlled Offline Protocol (₹{Number(amount).toLocaleString('en-IN')})</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Authorize Real-Time Online (₹{Number(amount).toLocaleString('en-IN')})</span>
                </>
              )}
            </button>
          </div>

          {/* Execution Result Drawer */}
          {lastResult && (
            <div className={`p-5 rounded-xl border transition-all ${
              lastResult.status === 'APPROVED' || lastResult.status === 'SETTLED'
                ? 'bg-emerald-950/40 border-emerald-800/80 shadow-glow-emerald'
                : lastResult.status === 'APPROVED_OFFLINE'
                ? 'bg-amber-950/40 border-amber-800/80 shadow-glow-amber'
                : 'bg-rose-950/40 border-rose-800/80 shadow-glow-crimson'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {lastResult.status === 'APPROVED' || lastResult.status === 'SETTLED' ? (
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  ) : lastResult.status === 'APPROVED_OFFLINE' ? (
                    <div className="h-10 w-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Lock className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                      <XCircle className="h-6 w-6" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm tracking-wide text-white">
                        {lastResult.status === 'APPROVED' || lastResult.status === 'SETTLED'
                          ? 'ONLINE PAYMENT AUTHORIZED & SETTLED'
                          : lastResult.status === 'APPROVED_OFFLINE'
                          ? 'CONTROLLED OFFLINE PAYMENT AUTHORIZED'
                          : lastResult.status === 'REJECTED_LIMIT_EXCEEDED'
                          ? 'DECLINED: OFFLINE SPEND LIMIT EXCEEDED'
                          : `DECLINED: ${lastResult.fraudAnalysis.ruleTriggered || 'FRAUD CHECK FAILED'}`}
                      </span>
                      <span className="font-mono text-xs text-slate-300">
                        ({formatCurrency(lastResult.amount)})
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">
                      {lastResult.fraudAnalysis.reasons.join('. ')}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-mono">Risk Score</div>
                  <div className={`text-lg font-mono font-bold ${
                    lastResult.fraudAnalysis.riskScore >= 75
                      ? 'text-rose-400'
                      : lastResult.fraudAnalysis.riskScore >= 40
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {lastResult.fraudAnalysis.riskScore} / 100
                  </div>
                </div>
              </div>

              {/* Offline Envelope Details if Offline */}
              {lastResult.offlineEnvelope && (
                <div className="mt-4 pt-3 border-t border-navy-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-navy-950 p-2.5 rounded border border-navy-800">
                    <span className="text-slate-500 block text-[10px]">NONCE PROOF</span>
                    <span className="text-shield-cyan">{lastResult.offlineEnvelope.nonce}</span>
                  </div>
                  <div className="bg-navy-950 p-2.5 rounded border border-navy-800">
                    <span className="text-slate-500 block text-[10px]">SHA-256 SIGNATURE</span>
                    <span className="text-amber-300 truncate block">
                      {lastResult.offlineEnvelope.offlineSignatureSha256.substring(0, 24)}...
                    </span>
                  </div>
                </div>
              )}

              {/* Deep link actions */}
              <div className="mt-4 flex items-center justify-end gap-3 text-xs">
                {lastResult.status === 'APPROVED_OFFLINE' && (
                  <button
                    onClick={() => setActiveTab('queue')}
                    className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1"
                  >
                    View in Offline Queue <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-shield-cyan hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  View in Audit Log <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
