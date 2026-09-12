import { CardPreset, OfflineEnvelope, TerminalNode } from '../types';
import { generateNonce, pseudoSha256 } from '../utils/crypto';

export interface OfflineAuthResult {
  allowed: boolean;
  reason?: string;
  envelope?: OfflineEnvelope;
}

export function generateOfflineEnvelope(
  card: CardPreset,
  terminal: TerminalNode,
  amount: number,
  timestamp: number
): OfflineAuthResult {
  const remainingOffline = Math.max(0, card.offlineCumulativeLimit - card.offlineCurrentSpent);

  // Check if offline limits are breached
  if (amount > card.offlineSingleLimit) {
    return {
      allowed: false,
      reason: `Amount ₹${amount.toLocaleString('en-IN')} exceeds single offline cap of ₹${card.offlineSingleLimit.toLocaleString('en-IN')}`,
    };
  }

  if (amount > remainingOffline) {
    return {
      allowed: false,
      reason: `Amount ₹${amount.toLocaleString('en-IN')} breaches remaining offline limit of ₹${remainingOffline.toLocaleString('en-IN')} (max ₹${card.offlineCumulativeLimit.toLocaleString('en-IN')} reserve)`,
    };
  }

  if (terminal.currentOfflineVolume + amount > terminal.offlineTxCap) {
    return {
      allowed: false,
      reason: `Terminal offline volume buffer (₹${terminal.offlineTxCap.toLocaleString('en-IN')}) exceeded`,
    };
  }

  const nonce = generateNonce(`ENV-${terminal.id.substring(0, 4)}`);
  const sequenceNum = (card.offlineTxCount || 0) + 1;

  // Payload canonical string for signature
  const rawPayload = `${nonce}:${terminal.id}:${card.cardNumber}:${amount.toFixed(2)}:${sequenceNum}:${timestamp}`;
  const payloadDigest = pseudoSha256(rawPayload).substring(0, 16);
  const offlineSignatureSha256 = pseudoSha256(`EDGE_SIGN_KEY:${rawPayload}:${payloadDigest}`);

  const envelope: OfflineEnvelope = {
    nonce,
    terminalId: terminal.id,
    sequenceNum,
    offlineSignatureSha256,
    cardRemainingLimit: remainingOffline - amount,
    terminalRemainingLimit: terminal.offlineTxCap - (terminal.currentOfflineVolume + amount),
    payloadDigest,
    generatedAt: timestamp,
  };

  return {
    allowed: true,
    envelope,
  };
}
