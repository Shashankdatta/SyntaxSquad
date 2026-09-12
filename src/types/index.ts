export type NetworkStatus = 'ONLINE' | 'DEGRADED' | 'PARTITIONED';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FraudAnalysis {
  riskScore: number; // 0 - 100
  tier: RiskTier;
  reasons: string[];
  ruleTriggered?: string;
  flags: {
    velocitySpike: boolean;
    geoAnomaly: boolean;
    deviceFingerprintMismatch: boolean;
    highRiskMcc: boolean;
    offlineCapExceeded: boolean;
    qrMismatch?: boolean;
    suspiciousMerchant?: boolean;
    highValue?: boolean;
    repeatedTxn?: boolean;
    suspiciousRecipient?: boolean;
  };
  decision: 'APPROVE' | 'CHALLENGE' | 'DECLINE';
}

export interface OfflineEnvelope {
  nonce: string;
  terminalId: string;
  sequenceNum: number;
  offlineSignatureSha256: string;
  cardRemainingLimit: number;
  terminalRemainingLimit: number;
  payloadDigest: string;
  generatedAt: number;
}

export type TransactionStatus =
  | 'APPROVED'
  | 'APPROVED_OFFLINE'
  | 'REJECTED_FRAUD'
  | 'REJECTED_LIMIT_EXCEEDED'
  | 'PENDING_RECONCILIATION'
  | 'SETTLED'
  | 'REPLAY_DUPLICATE_BLOCKED';

export interface Transaction {
  id: string;
  idempotencyKey: string;
  timestamp: number;
  cardHolder: string;
  cardNumberMasked: string;
  cardType: 'VISA' | 'MASTERCARD' | 'AMEX';
  amount: number;
  currency: 'USD' | 'INR';
  merchant: string;
  mcc: string;
  location: {
    city: string;
    country: string;
  };
  terminalId: string;
  terminalName: string;
  deviceId?: string;
  qrDestination?: string;
  status: TransactionStatus;
  authMode: 'ONLINE' | 'OFFLINE_PARTITION';
  fraudAnalysis: FraudAnalysis;
  offlineEnvelope?: OfflineEnvelope;
  reconciliationStatus?: {
    state: 'NOT_APPLICABLE' | 'PENDING' | 'RECONCILED' | 'CONFLICT_DUPLICATE' | 'LEDGER_SETTLED';
    reconciledAt?: number;
    notes?: string;
  };
}

export interface OfflineQueueItem {
  queueId: string;
  transaction: Transaction;
  enqueuedAt: number;
  syncAttempts: number;
  status: 'PENDING_SYNC' | 'SYNCING' | 'RECONCILED' | 'DUPLICATE_REJECTED' | 'CORRUPTED';
  payloadHash: string;
  isReplayMock?: boolean;
}

export interface CardPreset {
  id: string;
  name: string;
  cardNumber: string;
  expiry: string;
  cardHolder: string;
  accountBalance: number;
  offlineSingleLimit: number; // e.g. ₹2,000
  offlineCumulativeLimit: number; // e.g. ₹2,000
  offlineCurrentSpent: number;
  offlineTxCount: number;
  maxOfflineTxAllowed: number;
  riskProfile: 'CLEAN' | 'VELOCITY_RISK' | 'BLACK_LISTED' | 'NEAR_CAP';
  description: string;
}

export interface TerminalNode {
  id: string;
  name: string;
  type: 'AIRPORT_GATE' | 'IN_FLIGHT_POS' | 'TRANSIT_TURNSTILE' | 'SUBSEA_RETAIL';
  location: string;
  status: NetworkStatus;
  offlineTxCap: number;
  currentOfflineVolume: number;
  lastPing: number;
  latencyMs: number;
}

export type AuditEventType =
  | 'NETWORK_PARTITION_TRIGGERED'
  | 'NETWORK_RESTORED'
  | 'NETWORK_DEGRADED'
  | 'ONLINE_AUTH_GRANTED'
  | 'OFFLINE_AUTH_GRANTED'
  | 'OFFLINE_LIMIT_BREACH'
  | 'FRAUD_BLOCK'
  | 'QUEUE_ENQUEUED'
  | 'RECONCILIATION_BATCH_STARTED'
  | 'RECONCILIATION_SUCCESS'
  | 'DUPLICATE_REPLAY_DETECTED'
  | 'LEDGER_SETTLEMENT'
  | 'TAMPER_DETECTED'
  | 'RULES_UPDATED'
  | 'SYSTEM_RESET';

export interface AuditEvent {
  id: string;
  timestamp: number;
  type: AuditEventType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  actor: string;
  description: string;
  meta: Record<string, any>;
  hashDigest: string;
  prevHash: string;
}

export interface CentralLedger {
  corporateReservePool: number;
  settledVolume: number;
  offlineAuthorizedHold: number;
  disputedLossPrevented: number;
  totalTransactionsProcessed: number;
}

export interface FraudRulesConfig {
  maxSingleOfflineAmount: number;
  maxOfflineVelocityWindowSec: number;
  maxOfflineVelocityTxns: number;
  riskScoreThresholdBlock: number;
  riskScoreThresholdChallenge: number;
  geoAnomalyDistanceThresholdKm: number;
  enableDeviceAttestation: boolean;
  enableVelocityGuard: boolean;
  enableStrictIdempotency: boolean;
}

export interface FraudEvaluationInput {
  card: CardPreset;
  amount: number;
  merchant: string;
  mcc: string;
  qrDestination?: string;
  transactionId?: string;
  deviceId?: string;
  isOffline: boolean;
  existingTransactions?: Transaction[];
  rules: FraudRulesConfig;
  customFlags?: {
    spoofedFingerprint?: boolean;
    geoAnomaly?: boolean;
    velocitySpike?: boolean;
  };
}
