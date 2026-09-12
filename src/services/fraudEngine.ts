import { CardPreset, FraudAnalysis, FraudRulesConfig, RiskTier, Transaction } from '../types';

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

const SUSPICIOUS_MERCHANT_KEYWORDS = [
  'unknown merchant',
  'fake store',
  'suspicious shop',
  'darkweb',
  'ghost store',
  'mule electronics',
  'anonymous vendor',
];

const MULE_RECIPIENT_KEYWORDS = ['scam', 'fraud', 'mule', 'phish', 'drainer', 'exploit', 'hacked'];

export function evaluateFraudRisk(input: FraudEvaluationInput): FraudAnalysis {
  const {
    card,
    amount,
    merchant,
    mcc,
    qrDestination = '',
    transactionId = '',
    deviceId = '',
    isOffline,
    existingTransactions = [],
    rules,
    customFlags,
  } = input;

  let score = 5;
  const reasons: string[] = [];
  let ruleTriggered: string | undefined = undefined;

  const flags = {
    velocitySpike: false,
    geoAnomaly: false,
    deviceFingerprintMismatch: false,
    highRiskMcc: false,
    offlineCapExceeded: false,
    qrMismatch: false,
    suspiciousMerchant: false,
    highValue: false,
    repeatedTxn: false,
    suspiciousRecipient: false,
  };

  const lowerMerchant = merchant.trim().toLowerCase();
  const lowerQr = qrDestination.trim().toLowerCase();

  // 1. Repeated Transaction Check (Replay Attack)
  const isDuplicateTx = Boolean(
    transactionId &&
    existingTransactions.some(
      (t) => t.id.trim().toUpperCase() === transactionId.trim().toUpperCase()
    )
  );
  if (isDuplicateTx) {
    score += 95;
    flags.repeatedTxn = true;
    ruleTriggered = 'REPEATED_TRANSACTION';
    reasons.push(`Repeated transaction ID '${transactionId}' detected in ledger. Replay attack blocked.`);
  }

  // 2. High-Value Transaction Rule (> ₹5,000)
  if (amount > 5000) {
    score += 85;
    flags.highValue = true;
    if (!ruleTriggered) ruleTriggered = 'HIGH_VALUE_TRANSACTION';
    reasons.push(`Amount ₹${amount.toLocaleString('en-IN')} exceeds regulatory limit of ₹5,000 for instant authorization.`);
  }

  // 3. Suspicious Merchant Check
  const hasSuspiciousMerchant = SUSPICIOUS_MERCHANT_KEYWORDS.some((kw) =>
    lowerMerchant.includes(kw)
  );
  if (hasSuspiciousMerchant) {
    score += 95;
    flags.suspiciousMerchant = true;
    if (!ruleTriggered) ruleTriggered = 'SUSPICIOUS_MERCHANT';
    reasons.push(`Merchant '${merchant}' matches high-risk rogue merchant blacklist.`);
  }

  // 4. Suspicious Recipient / Mule Keyword in QR or Handle
  const hasSuspiciousRecipient = MULE_RECIPIENT_KEYWORDS.some(
    (kw) => lowerQr.includes(kw) || lowerMerchant.includes(kw)
  );
  if (hasSuspiciousRecipient) {
    score += 95;
    flags.suspiciousRecipient = true;
    if (!ruleTriggered) ruleTriggered = 'SUSPICIOUS_RECIPIENT';
    reasons.push(`Destination '${qrDestination || merchant}' contains blacklisted high-risk pattern matching money mule accounts.`);
  }

  // 5. QR Destination Mismatch Check
  if (qrDestination && lowerMerchant.length > 3) {
    const merchantSlug = lowerMerchant.replace(/[^a-z0-9]/g, '');
    const qrClean = lowerQr.replace(/[^a-z0-9@.]/g, '');
    if (
      merchantSlug.length > 3 &&
      !qrClean.includes(merchantSlug) &&
      !qrClean.includes('generic') &&
      !lowerMerchant.includes('custom')
    ) {
      score += 85;
      flags.qrMismatch = true;
      if (!ruleTriggered) ruleTriggered = 'QR_DESTINATION_MISMATCH';
      reasons.push(`QR destination payload '${qrDestination}' does not match registered merchant identity '${merchant}'.`);
    }
  }

  // 6. Offline Specific Caps & Velocity
  if (isOffline) {
    const remainingOffline = Math.max(0, card.offlineCumulativeLimit - card.offlineCurrentSpent);
    if (amount > remainingOffline || amount > card.offlineSingleLimit || amount > rules.maxSingleOfflineAmount) {
      score += 90;
      flags.offlineCapExceeded = true;
      if (!ruleTriggered) ruleTriggered = 'OFFLINE_LIMIT_EXCEEDED';
      reasons.push(`Amount ₹${amount.toLocaleString('en-IN')} exceeds remaining offline limit of ₹${remainingOffline.toLocaleString('en-IN')} (max ₹2,000 cap).`);
    }
  }

  // 7. Online Balance Verification
  if (!isOffline && amount > card.accountBalance) {
    score += 70;
    if (!ruleTriggered) ruleTriggered = 'INSUFFICIENT_BALANCE';
    reasons.push(`Requested amount ₹${amount.toLocaleString('en-IN')} exceeds available central balance of ₹${card.accountBalance.toLocaleString('en-IN')}.`);
  }

  // 8. Custom Simulation Flags & Edge Attacks
  if (customFlags?.velocitySpike || card.riskProfile === 'VELOCITY_RISK') {
    score += 40;
    flags.velocitySpike = true;
    reasons.push('Rapid repeated velocity anomaly: 3+ payments recorded in under 45 seconds');
  }

  if (customFlags?.geoAnomaly) {
    score += 30;
    flags.geoAnomaly = true;
    reasons.push('Geographic jump anomaly: Impossible physical transit velocity (>900 km/h)');
  }

  if (customFlags?.spoofedFingerprint || card.riskProfile === 'BLACK_LISTED') {
    score += 90;
    flags.deviceFingerprintMismatch = true;
    reasons.push('Device hardware attestation key mismatch or entity on Global Fraud Watchlist');
  }

  // Normalize score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine Risk Tier
  let tier: RiskTier = 'LOW';
  if (normalizedScore >= 75) tier = 'CRITICAL';
  else if (normalizedScore >= 50) tier = 'HIGH';
  else if (normalizedScore >= 25) tier = 'MEDIUM';

  // Determine Decision
  let decision: 'APPROVE' | 'CHALLENGE' | 'DECLINE' = 'APPROVE';
  if (
    normalizedScore >= rules.riskScoreThresholdBlock ||
    flags.offlineCapExceeded ||
    flags.qrMismatch ||
    flags.suspiciousMerchant ||
    flags.highValue ||
    flags.repeatedTxn ||
    flags.suspiciousRecipient ||
    card.riskProfile === 'BLACK_LISTED' ||
    (!isOffline && amount > card.accountBalance)
  ) {
    decision = 'DECLINE';
  } else if (normalizedScore >= rules.riskScoreThresholdChallenge) {
    decision = 'CHALLENGE';
  }

  if (reasons.length === 0) {
    reasons.push('All inline heuristics, identity bounds, and regulatory thresholds verified clean.');
  }

  return {
    riskScore: normalizedScore,
    tier,
    reasons,
    ruleTriggered,
    flags,
    decision,
  };
}
