import { CardPreset, TerminalNode, FraudRulesConfig, CentralLedger, Transaction, AuditEvent } from '../types';
import { pseudoSha256 } from '../utils/crypto';

export const DEMO_MERCHANT_PRESETS = [
  { name: 'FreshMart', category: 'Grocery Store', qr: 'upi://pay?pa=freshmart@bank&pn=FreshMart', defaultAmount: 450, mcc: '5411' },
  { name: 'Local Cafe', category: 'Food & Dining', qr: 'upi://pay?pa=localcafe@bank&pn=LocalCafe', defaultAmount: 180, mcc: '5812' },
  { name: 'Metro Transit', category: 'Transportation', qr: 'upi://pay?pa=metrotransit@bank&pn=MetroTransit', defaultAmount: 120, mcc: '4111' },
  { name: 'Grocery Store', category: 'Retail', qr: 'upi://pay?pa=grocerystore@bank&pn=GroceryStore', defaultAmount: 850, mcc: '5411' },
  { name: 'Unknown Merchant', category: 'Flagged Rogue Store', qr: 'upi://pay?pa=unknownmerchant@bank&pn=UnknownMerchant', defaultAmount: 950, mcc: '5999' },
];

export const INITIAL_CARDS: CardPreset[] = [
  {
    id: 'demo-wallet',
    name: 'Demo Account (Primary Wallet)',
    cardNumber: '4242 •••• •••• 4092',
    expiry: '08/29',
    cardHolder: 'Demo Account',
    accountBalance: 10000.00,
    offlineSingleLimit: 2000.00,
    offlineCumulativeLimit: 2000.00,
    offlineCurrentSpent: 0.00,
    offlineTxCount: 0,
    maxOfflineTxAllowed: 10,
    riskProfile: 'CLEAN',
    description: 'Primary demo wallet with ₹10,000 balance and ₹2,000 offline spending limit',
  },
  {
    id: 'demo-wallet-low-allowance',
    name: 'Demo Account (Low Offline Allowance)',
    cardNumber: '5500 •••• •••• 4421',
    expiry: '11/27',
    cardHolder: 'Demo Account',
    accountBalance: 10000.00,
    offlineSingleLimit: 2000.00,
    offlineCumulativeLimit: 2000.00,
    offlineCurrentSpent: 1850.00,
    offlineTxCount: 3,
    maxOfflineTxAllowed: 8,
    riskProfile: 'NEAR_CAP',
    description: 'Demo wallet with ₹1,850 spent offline, leaving ₹150 offline allowance',
  },
];

export const INITIAL_TERMINALS: TerminalNode[] = [
  {
    id: 'POS-TERM-ALPHA-01',
    name: 'Metro Transit Smart Gate POS',
    type: 'TRANSIT_TURNSTILE',
    location: 'Mumbai Central, IN',
    status: 'ONLINE',
    offlineTxCap: 50000,
    currentOfflineVolume: 0,
    lastPing: Date.now() - 3000,
    latencyMs: 32,
  },
  {
    id: 'POS-TERM-BETA-02',
    name: 'Express Retail Checkout Terminal',
    type: 'AIRPORT_GATE',
    location: 'Terminal 2, Bengaluru, IN',
    status: 'PARTITIONED',
    offlineTxCap: 30000,
    currentOfflineVolume: 450,
    lastPing: Date.now() - 120000,
    latencyMs: 1250,
  },
  {
    id: 'POS-TERM-GAMMA-03',
    name: 'Underground Metro Line Station POS',
    type: 'TRANSIT_TURNSTILE',
    location: 'New Delhi Metro, IN',
    status: 'ONLINE',
    offlineTxCap: 40000,
    currentOfflineVolume: 0,
    lastPing: Date.now() - 2100,
    latencyMs: 28,
  },
  {
    id: 'POS-TERM-DELTA-04',
    name: 'Highway Toll Outpost Terminal',
    type: 'SUBSEA_RETAIL',
    location: 'Western Ghats Outpost, IN',
    status: 'DEGRADED',
    offlineTxCap: 25000,
    currentOfflineVolume: 0,
    lastPing: Date.now() - 14000,
    latencyMs: 650,
  },
];

export const INITIAL_FRAUD_RULES: FraudRulesConfig = {
  maxSingleOfflineAmount: 2000.00,
  maxOfflineVelocityWindowSec: 60,
  maxOfflineVelocityTxns: 3,
  riskScoreThresholdBlock: 75,
  riskScoreThresholdChallenge: 50,
  geoAnomalyDistanceThresholdKm: 800,
  enableDeviceAttestation: true,
  enableVelocityGuard: true,
  enableStrictIdempotency: true,
};

export const INITIAL_LEDGER: CentralLedger = {
  corporateReservePool: 500000.00,
  settledVolume: 0.00,
  offlineAuthorizedHold: 0.00,
  disputedLossPrevented: 0.00,
  totalTransactionsProcessed: 0,
};

export const INITIAL_SEED_TRANSACTIONS: Transaction[] = [];

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'AUD-001',
    timestamp: Date.now() - 1000 * 60 * 15,
    type: 'SYSTEM_RESET',
    severity: 'INFO',
    actor: 'Nexus-Bootstrap-Daemon',
    description: 'PayShield Nexus partition-tolerant payment engine initialized with ₹10,000 balance and ₹2,000 offline limit.',
    meta: { version: '2.4.0-fintech', baseCurrency: 'INR', offlineCap: 2000 },
    hashDigest: pseudoSha256('genesis-payshield-001'),
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
  },
];
