import { CentralLedger, OfflineQueueItem, Transaction, AuditEvent } from '../types';
import { generateNonce, pseudoSha256 } from '../utils/crypto';

export interface ReconciliationBatchResult {
  settledItems: OfflineQueueItem[];
  rejectedDuplicates: OfflineQueueItem[];
  corruptedItems: OfflineQueueItem[];
  updatedLedger: CentralLedger;
  updatedQueue: OfflineQueueItem[];
  generatedAuditEvents: AuditEvent[];
  updatedTransactions: Transaction[];
}

export function runReconciliationBatch(
  queue: OfflineQueueItem[],
  existingSettledTransactions: Transaction[],
  currentLedger: CentralLedger,
  lastAuditHash: string
): ReconciliationBatchResult {
  const settledItems: OfflineQueueItem[] = [];
  const rejectedDuplicates: OfflineQueueItem[] = [];
  const corruptedItems: OfflineQueueItem[] = [];
  const updatedQueue: OfflineQueueItem[] = [];
  const generatedAuditEvents: AuditEvent[] = [];
  const updatedTransactions: Transaction[] = [...existingSettledTransactions];

  // Build sets of known nonces & idempotency keys
  const seenNonces = new Set<string>();
  const seenIdempotencyKeys = new Set<string>();

  existingSettledTransactions.forEach(t => {
    seenIdempotencyKeys.add(t.idempotencyKey);
    if (t.offlineEnvelope?.nonce) {
      seenNonces.add(t.offlineEnvelope.nonce);
    }
  });

  let runningReserve = currentLedger.corporateReservePool;
  let runningSettledVolume = currentLedger.settledVolume;
  let runningHold = currentLedger.offlineAuthorizedHold;
  let runningDisputePrevented = currentLedger.disputedLossPrevented;
  let runningTxCount = currentLedger.totalTransactionsProcessed;
  let runningAuditHash = lastAuditHash;

  // Process items in FIFO order
  queue.forEach(item => {
    if (item.status === 'RECONCILED' || item.status === 'DUPLICATE_REJECTED') {
      updatedQueue.push(item);
      return;
    }

    const { transaction } = item;
    const nonce = transaction.offlineEnvelope?.nonce || '';
    const idempKey = transaction.idempotencyKey;

    // Check for Corrupted item simulation
    if (item.status === 'CORRUPTED') {
      corruptedItems.push(item);
      updatedQueue.push({ ...item, status: 'CORRUPTED', syncAttempts: item.syncAttempts + 1 });
      const auditEvent: AuditEvent = {
        id: generateNonce('AUD'),
        timestamp: Date.now(),
        type: 'TAMPER_DETECTED',
        severity: 'CRITICAL',
        actor: 'Reconciliation-Auditor',
        description: `Corrupted cryptographic envelope rejected for Queue ID ${item.queueId}: Digest checksum mismatch.`,
        meta: { queueId: item.queueId, payloadHash: item.payloadHash },
        hashDigest: pseudoSha256(`corrupt-${item.queueId}-${Date.now()}`),
        prevHash: runningAuditHash,
      };
      runningAuditHash = auditEvent.hashDigest;
      generatedAuditEvents.push(auditEvent);
      return;
    }

    // Check Duplicate / Replay attack
    const isDuplicateNonce = nonce && seenNonces.has(nonce);
    const isDuplicateIdemp = seenIdempotencyKeys.has(idempKey);

    if (item.isReplayMock || isDuplicateNonce || isDuplicateIdemp) {
      const rejectedItem: OfflineQueueItem = {
        ...item,
        status: 'DUPLICATE_REJECTED',
        syncAttempts: item.syncAttempts + 1,
      };
      rejectedDuplicates.push(rejectedItem);
      updatedQueue.push(rejectedItem);

      runningDisputePrevented += transaction.amount;

      // Create Audit Event
      const auditEvent: AuditEvent = {
        id: generateNonce('AUD'),
        timestamp: Date.now(),
        type: 'DUPLICATE_REPLAY_DETECTED',
        severity: 'CRITICAL',
        actor: 'Reconciliation-Deduplication-Gate',
        description: `Replay attack neutralized! Duplicate transaction ${transaction.id} with nonce ${nonce || idempKey} rejected. Zero loss incurred.`,
        meta: {
          txId: transaction.id,
          nonce,
          idempotencyKey: idempKey,
          amountPrevented: transaction.amount,
          cardHolder: transaction.cardHolder,
        },
        hashDigest: pseudoSha256(`duplicate-${transaction.id}-${Date.now()}`),
        prevHash: runningAuditHash,
      };
      runningAuditHash = auditEvent.hashDigest;
      generatedAuditEvents.push(auditEvent);

      // Update transaction status if present
      const txIndex = updatedTransactions.findIndex(t => t.id === transaction.id);
      if (txIndex >= 0) {
        updatedTransactions[txIndex] = {
          ...updatedTransactions[txIndex],
          status: 'REPLAY_DUPLICATE_BLOCKED',
          reconciliationStatus: {
            state: 'CONFLICT_DUPLICATE',
            reconciledAt: Date.now(),
            notes: 'Duplicate nonce replay attempt rejected by reconciliation verifier',
          },
        };
      }
      return;
    }

    // Valid offline transaction -> Settle!
    seenNonces.add(nonce);
    seenIdempotencyKeys.add(idempKey);

    const settledItem: OfflineQueueItem = {
      ...item,
      status: 'RECONCILED',
      syncAttempts: item.syncAttempts + 1,
    };
    settledItems.push(settledItem);
    updatedQueue.push(settledItem);

    runningSettledVolume += transaction.amount;
    runningHold = Math.max(0, runningHold - transaction.amount);
    runningTxCount += 1;

    // Update Transaction
    const settledTx: Transaction = {
      ...transaction,
      status: 'SETTLED',
      reconciliationStatus: {
        state: 'LEDGER_SETTLED',
        reconciledAt: Date.now(),
        notes: `Settled via Deterministic Batch Reconciliation. Nonce ${nonce} locked.`,
      },
    };

    const existingIdx = updatedTransactions.findIndex(t => t.id === transaction.id);
    if (existingIdx >= 0) {
      updatedTransactions[existingIdx] = settledTx;
    } else {
      updatedTransactions.unshift(settledTx);
    }

    const auditEvent: AuditEvent = {
      id: generateNonce('AUD'),
      timestamp: Date.now(),
      type: 'LEDGER_SETTLEMENT',
      severity: 'SUCCESS',
      actor: 'Nexus-Central-Ledger',
      description: `Offline authorization for $${transaction.amount.toFixed(2)} (${transaction.cardHolder}) successfully settled to corporate reserve pool.`,
      meta: {
        txId: transaction.id,
        amount: transaction.amount,
        nonce,
        terminal: transaction.terminalName,
      },
      hashDigest: pseudoSha256(`settle-${transaction.id}-${Date.now()}`),
      prevHash: runningAuditHash,
    };
    runningAuditHash = auditEvent.hashDigest;
    generatedAuditEvents.push(auditEvent);
  });

  const updatedLedger: CentralLedger = {
    corporateReservePool: runningReserve,
    settledVolume: runningSettledVolume,
    offlineAuthorizedHold: runningHold,
    disputedLossPrevented: runningDisputePrevented,
    totalTransactionsProcessed: runningTxCount,
  };

  return {
    settledItems,
    rejectedDuplicates,
    corruptedItems,
    updatedLedger,
    updatedQueue,
    generatedAuditEvents,
    updatedTransactions,
  };
}
