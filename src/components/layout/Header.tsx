import React from 'react';
import { usePayShield } from '../../context/PayShieldContext';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  Shield,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/crypto';

export const Header: React.FC = () => {
  const {
    networkStatus,
    setNetworkStatus,
    offlineQueue,
    selectedCard,
    resetDemoState,
    isProcessing,
  } = usePayShield();

  const pendingCount = offlineQueue.filter(q => q.status === 'PENDING_SYNC').length;
  const remainingOffline = Math.max(0, selectedCard.offlineCumulativeLimit - selectedCard.offlineCurrentSpent);

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-sm">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
          <Shield className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base md:text-lg tracking-tight text-slate-900">
              PayShield <span className="text-blue-600 font-extrabold">Nexus</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Prototype
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-500 font-normal">
            Partition-Tolerant Payment Authorization & Inline Fraud Screening
          </p>
        </div>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Demo Balance Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <Wallet className="h-4 w-4 text-blue-600" />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-slate-500 text-[11px]">Demo Balance:</span>
              <span className="font-semibold text-slate-900 font-mono text-xs">
                {formatCurrency(selectedCard.accountBalance)}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 block font-normal leading-tight">
              No real money transfers
            </span>
          </div>
        </div>

        {/* Offline Queue Indicator */}
        {pendingCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingCount} Pending Settlement</span>
          </div>
        )}

        {/* Controlled Network Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setNetworkStatus('ONLINE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              networkStatus === 'ONLINE'
                ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Online Mode: Central bank authorization and inline fraud screening active"
          >
            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Online</span>
          </button>

          <button
            onClick={() => setNetworkStatus('PARTITIONED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              networkStatus === 'PARTITIONED'
                ? 'bg-white text-amber-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Offline Mode: Partition-tolerant local authorization with spending limits"
          >
            <WifiOff className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">Offline</span>
          </button>

          <button
            onClick={() => setNetworkStatus('DEGRADED')}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              networkStatus === 'DEGRADED'
                ? 'bg-white text-slate-800 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Degraded Network: Simulated latency and jitter"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
            <span>Degraded</span>
          </button>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={resetDemoState}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors text-xs font-medium"
          title="Reset to fresh demo baseline (₹10,000 balance, ₹2,000 offline limit)"
        >
          <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${isProcessing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Reset Demo</span>
        </button>
      </div>
    </header>
  );
};
