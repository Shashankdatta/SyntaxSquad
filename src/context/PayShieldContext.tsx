import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  NetworkStatus,
  Transaction,
  OfflineQueueItem,
  CardPreset,
  TerminalNode,
  FraudRulesConfig,
  CentralLedger,
  AuditEvent,
  FraudEvaluationInput,
} from '../types';
import {
  INITIAL_CARDS,
  INITIAL_TERMINALS,
  INITIAL_FRAUD_RULES,
  INITIAL_LEDGER,
  INITIAL_SEED_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';
import { evaluateFraudRisk } from '../services/fraudEngine';
import { generateOfflineEnvelope } from '../services/offlineAuthEngine';
import { runReconciliationBatch } from '../services/reconciliationEngine';
import { generateIdempotencyKey, generateNonce, pseudoSha256 } from '../utils/crypto';

export interface ProcessPaymentParams {
  cardId?: string;
  amount: number;
  merchant: string;
  mcc?: string;
  location?: { city: string; country: string };
  terminalId?: string;
  deviceId?: string;
  qrDestination?: string;
  transactionId?: string;
  customFlags?: {
    spoofedFingerprint?: boolean;
    geoAnomaly?: boolean;
    velocitySpike?: boolean;
  };
}

interface PayShieldContextType {
  networkStatus: NetworkStatus;
  setNetworkStatus: (status: NetworkStatus) => void;
  networkLatencyMs: number;
  setNetworkLatencyMs: (ms: number) => void;
  transactions: Transaction[];
  offlineQueue: OfflineQueueItem[];
  cards: CardPreset[];
  selectedCard: CardPreset;
  setSelectedCard: (card: CardPreset) => void;
  terminals: TerminalNode[];
  selectedTerminal: TerminalNode;
  setSelectedTerminal: (term: TerminalNode) => void;
  fraudRules: FraudRulesConfig;
  updateFraudRules: (newRules: Partial<FraudRulesConfig>) => void;
  centralLedger: CentralLedger;
  auditLogs: AuditEvent[];
  isProcessing: boolean;
  lastProcessedTx: Transaction | null;
  processPayment: (params: ProcessPaymentParams) => Promise<{ success: boolean; transaction: Transaction; error?: string }>;
  reconcileQueue: () => Promise<{ settled: number; rejectedDuplicates: number }>;
  injectDuplicateReplayMock: () => void;
  corruptQueueItem: (queueId: string) => void;
  clearReconciledQueue: () => void;
  resetDemoState: () => void;
}

const STORAGE_KEYS = {
  NETWORK: 'payshield_network_status_v2',
  TRANSACTIONS: 'payshield_transactions_v2',
  QUEUE: 'payshield_offline_queue_v2',
  CARDS: 'payshield_cards_v2',
  LEDGER: 'payshield_ledger_v2',
  AUDIT: 'payshield_audit_logs_v2',
  RULES: 'payshield_rules_v2',
};

const PayShieldContext = createContext<PayShieldContextType | undefined>(undefined);

export const PayShieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkStatus, setNetworkStatusState] = useState<NetworkStatus>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NETWORK);
    return (saved as NetworkStatus) || 'ONLINE';
  });

  const [networkLatencyMs, setNetworkLatencyMs] = useState<number>(38);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastProcessedTx, setLastProcessedTx] = useState<Transaction | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_SEED_TRANSACTIONS;
  });

  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUEUE);
    return saved ? JSON.parse(saved) : [];
  });

  const [cards, setCards] = useState<CardPreset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [selectedCard, setSelectedCard] = useState<CardPreset>(() => cards[0] || INITIAL_CARDS[0]);

  const [terminals, setTerminals] = useState<TerminalNode[]>(INITIAL_TERMINALS);
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalNode>(INITIAL_TERMINALS[0]);

  const [fraudRules, setFraudRules] = useState<FraudRulesConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RULES);
    return saved ? JSON.parse(saved) : INITIAL_FRAUD_RULES;
  });

  const [centralLedger, setCentralLedger] = useState<CentralLedger>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NETWORK, networkStatus);
  }, [networkStatus]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(centralLedger));
  }, [centralLedger]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(fraudRules));
  }, [fraudRules]);

  // Append Audit Event Helper
  const addAuditEvent = useCallback((
    type: AuditEvent['type'],
    severity: AuditEvent['severity'],
    actor: string,
    description: string,
    meta: Record<string, any> = {}
  ) => {
    setAuditLogs(prev => {
      const prevHash = prev.length > 0 ? prev[0].hashDigest : '0000000000000000';
      const timestamp = Date.now();
      const hashDigest = pseudoSha256(`${prevHash}:${type}:${timestamp}:${JSON.stringify(meta)}`);
      const newEvent: AuditEvent = {
        id: generateNonce('AUD'),
        timestamp,
        type,
        severity,
        actor,
        description,
        meta,
        hashDigest,
        prevHash,
      };
      return [newEvent, ...prev];
    });
  }, []);

  // Handle Network Change with Auditing
  const setNetworkStatus = useCallback((status: NetworkStatus) => {
    setNetworkStatusState(status);
    if (status === 'PARTITIONED') {
      setNetworkLatencyMs(9999);
      addAuditEvent(
        'NETWORK_PARTITION_TRIGGERED',
        'WARNING',
        'Nexus-Network-Controller',
        'Network partition simulated. Edge terminals operating in Partition-Tolerant Offline Mode with ₹2,000 spending limit.',
        { state: 'PARTITIONED', simulatedLatency: 'INF_AIR_GAP' }
      );
    } else if (status === 'DEGRADED') {
      setNetworkLatencyMs(850);
      addAuditEvent(
        'NETWORK_DEGRADED',
        'WARNING',
        'Nexus-Network-Controller',
        'Network telemetry indicates high jitter and packet loss (850ms). Fallback timeout guard activated.',
        { state: 'DEGRADED', latencyMs: 850 }
      );
    } else {
      setNetworkLatencyMs(38);
      addAuditEvent(
        'NETWORK_RESTORED',
        'SUCCESS',
        'Nexus-Network-Controller',
        'Uplink connectivity restored to Central Core Switch. Online real-time authorization re-enabled.',
        { state: 'ONLINE', latencyMs: 38 }
      );
    }
  }, [addAuditEvent]);

  // Update Fraud Rules
  const updateFraudRules = useCallback((newRules: Partial<FraudRulesConfig>) => {
    setFraudRules(prev => {
      const updated = { ...prev, ...newRules };
      addAuditEvent(
        'RULES_UPDATED',
        'INFO',
        'Compliance-Risk-Admin',
        'Inline fraud screening thresholds updated.',
        { changedKeys: Object.keys(newRules) }
      );
      return updated;
    });
  }, [addAuditEvent]);

  // Process Payment Simulation
  const processPayment = async (params: ProcessPaymentParams): Promise<{ success: boolean; transaction: Transaction; error?: string }> => {
    setIsProcessing(true);
    const targetCard = cards.find(c => c.id === (params.cardId || selectedCard.id)) || selectedCard;
    const targetTerminal = terminals.find(t => t.id === (params.terminalId || selectedTerminal.id)) || selectedTerminal;

    // Simulate Network Latency
    const artificialDelay = networkStatus === 'ONLINE' ? 100 : networkStatus === 'DEGRADED' ? 500 : 30;
    await new Promise(r => setTimeout(r, artificialDelay));

    const isOffline = networkStatus === 'PARTITIONED';
    const timestamp = Date.now();
    const cardLast4 = targetCard.cardNumber.slice(-4);
    const txId = params.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const idempotencyKey = generateIdempotencyKey(cardLast4, params.amount, timestamp);

    // 1. Evaluate Inline Fraud Screening
    const evalInput: FraudEvaluationInput = {
      card: targetCard,
      amount: params.amount,
      merchant: params.merchant,
      mcc: params.mcc || '5411 - General Retail',
      qrDestination: params.qrDestination,
      transactionId: txId,
      deviceId: params.deviceId || targetTerminal.id,
      isOffline,
      existingTransactions: transactions,
      rules: fraudRules,
      customFlags: params.customFlags,
    };
    const fraudAnalysis = evaluateFraudRisk(evalInput);

    // 2. Branch: OFFLINE vs ONLINE
    if (isOffline) {
      // OFFLINE Mode
      const offlineResult = generateOfflineEnvelope(targetCard, targetTerminal, params.amount, timestamp);

      if (!offlineResult.allowed || fraudAnalysis.decision === 'DECLINE') {
        const rejectionReason = fraudAnalysis.reasons[0] || offlineResult.reason || 'Offline screening checks failed';
        const isLimitBreach = fraudAnalysis.flags.offlineCapExceeded || !offlineResult.allowed;

        const rejectedTx: Transaction = {
          id: txId,
          idempotencyKey,
          timestamp,
          cardHolder: targetCard.cardHolder,
          cardNumberMasked: targetCard.cardNumber,
          cardType: 'VISA',
          amount: params.amount,
          currency: 'INR',
          merchant: params.merchant,
          mcc: params.mcc || '5411 - General Retail',
          location: params.location || { city: 'Mumbai', country: 'IN' },
          terminalId: targetTerminal.id,
          terminalName: targetTerminal.name,
          deviceId: params.deviceId || targetTerminal.id,
          qrDestination: params.qrDestination,
          status: isLimitBreach ? 'REJECTED_LIMIT_EXCEEDED' : 'REJECTED_FRAUD',
          authMode: 'OFFLINE_PARTITION',
          fraudAnalysis,
        };

        setTransactions(prev => [rejectedTx, ...prev]);
        setLastProcessedTx(rejectedTx);
        setIsProcessing(false);

        addAuditEvent(
          isLimitBreach ? 'OFFLINE_LIMIT_BREACH' : 'FRAUD_BLOCK',
          'CRITICAL',
          `Edge-Node-${targetTerminal.id}`,
          `Offline payment authorization blocked: ${rejectionReason}`,
          { txId, amount: params.amount, merchant: params.merchant, riskScore: fraudAnalysis.riskScore }
        );

        return { success: false, transaction: rejectedTx, error: rejectionReason };
      }

      // Offline Approved!
      const approvedTx: Transaction = {
        id: txId,
        idempotencyKey,
        timestamp,
        cardHolder: targetCard.cardHolder,
        cardNumberMasked: targetCard.cardNumber,
        cardType: 'VISA',
        amount: params.amount,
        currency: 'INR',
        merchant: params.merchant,
        mcc: params.mcc || '5411 - General Retail',
        location: params.location || { city: 'Mumbai', country: 'IN' },
        terminalId: targetTerminal.id,
        terminalName: targetTerminal.name,
        deviceId: params.deviceId || targetTerminal.id,
        qrDestination: params.qrDestination,
        status: 'APPROVED_OFFLINE',
        authMode: 'OFFLINE_PARTITION',
        fraudAnalysis,
        offlineEnvelope: offlineResult.envelope,
        reconciliationStatus: {
          state: 'PENDING',
          notes: 'Enqueued in offline queue; awaiting network reconnect and central reconciliation',
        },
      };

      // Update Card state (spend against offline limit, but do NOT deduct main balance yet!)
      const updatedCard: CardPreset = {
        ...targetCard,
        offlineCurrentSpent: targetCard.offlineCurrentSpent + params.amount,
        offlineTxCount: targetCard.offlineTxCount + 1,
      };

      setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
      setSelectedCard(updatedCard);

      // Update Terminal offline volume
      setTerminals(prev => prev.map(t => t.id === targetTerminal.id ? {
        ...t,
        currentOfflineVolume: t.currentOfflineVolume + params.amount,
      } : t));

      // Add to Offline Queue
      const queueItem: OfflineQueueItem = {
        queueId: `Q-${Math.floor(1000 + Math.random() * 9000)}`,
        transaction: approvedTx,
        enqueuedAt: timestamp,
        syncAttempts: 0,
        status: 'PENDING_SYNC',
        payloadHash: pseudoSha256(JSON.stringify(approvedTx.offlineEnvelope)),
      };

      setOfflineQueue(prev => [queueItem, ...prev]);
      setTransactions(prev => [approvedTx, ...prev]);
      setLastProcessedTx(approvedTx);

      // Update Ledger Hold
      setCentralLedger(prev => ({
        ...prev,
        offlineAuthorizedHold: prev.offlineAuthorizedHold + params.amount,
      }));

      addAuditEvent(
        'OFFLINE_AUTH_GRANTED',
        'SUCCESS',
        `Edge-Node-${targetTerminal.id}`,
        `Controlled offline payment authorized for ₹${params.amount.toLocaleString('en-IN')}. Token: ${offlineResult.envelope?.nonce}`,
        {
          txId,
          amount: params.amount,
          nonce: offlineResult.envelope?.nonce,
          cardRemainingLimit: offlineResult.envelope?.cardRemainingLimit,
        }
      );

      setIsProcessing(false);
      return { success: true, transaction: approvedTx };
    } else {
      // ONLINE Mode
      if (fraudAnalysis.decision === 'DECLINE') {
        const rejectedTx: Transaction = {
          id: txId,
          idempotencyKey,
          timestamp,
          cardHolder: targetCard.cardHolder,
          cardNumberMasked: targetCard.cardNumber,
          cardType: 'VISA',
          amount: params.amount,
          currency: 'INR',
          merchant: params.merchant,
          mcc: params.mcc || '5411 - General Retail',
          location: params.location || { city: 'Mumbai', country: 'IN' },
          terminalId: targetTerminal.id,
          terminalName: targetTerminal.name,
          deviceId: params.deviceId || targetTerminal.id,
          qrDestination: params.qrDestination,
          status: 'REJECTED_FRAUD',
          authMode: 'ONLINE',
          fraudAnalysis,
        };

        setTransactions(prev => [rejectedTx, ...prev]);
        setLastProcessedTx(rejectedTx);
        setIsProcessing(false);

        addAuditEvent(
          'FRAUD_BLOCK',
          'CRITICAL',
          'Inline-Fraud-Guard',
          `Online transaction blocked by real-time risk engine: ${fraudAnalysis.reasons.join('; ')}`,
          { txId, amount: params.amount, merchant: params.merchant, riskScore: fraudAnalysis.riskScore }
        );

        return { success: false, transaction: rejectedTx, error: fraudAnalysis.reasons.join(', ') };
      }

      // Online Approved & Settled Immediately
      const settledTx: Transaction = {
        id: txId,
        idempotencyKey,
        timestamp,
        cardHolder: targetCard.cardHolder,
        cardNumberMasked: targetCard.cardNumber,
        cardType: 'VISA',
        amount: params.amount,
        currency: 'INR',
        merchant: params.merchant,
        mcc: params.mcc || '5411 - General Retail',
        location: params.location || { city: 'Mumbai', country: 'IN' },
        terminalId: targetTerminal.id,
        terminalName: targetTerminal.name,
        deviceId: params.deviceId || targetTerminal.id,
        qrDestination: params.qrDestination,
        status: 'SETTLED',
        authMode: 'ONLINE',
        fraudAnalysis,
        reconciliationStatus: {
          state: 'LEDGER_SETTLED',
          reconciledAt: timestamp,
          notes: 'Real-time online settlement against Central Switch',
        },
      };

      // Deduct balance ONCE
      const updatedCard: CardPreset = {
        ...targetCard,
        accountBalance: Math.max(0, targetCard.accountBalance - params.amount),
      };

      setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
      setSelectedCard(updatedCard);

      setTransactions(prev => [settledTx, ...prev]);
      setLastProcessedTx(settledTx);

      setCentralLedger(prev => ({
        ...prev,
        settledVolume: prev.settledVolume + params.amount,
        totalTransactionsProcessed: prev.totalTransactionsProcessed + 1,
      }));

      addAuditEvent(
        'ONLINE_AUTH_GRANTED',
        'SUCCESS',
        'Central-Auth-Core',
        `Online authorization granted & debited ₹${params.amount.toLocaleString('en-IN')} for ${params.merchant}. New Balance: ₹${updatedCard.accountBalance.toLocaleString('en-IN')}.`,
        { txId, amount: params.amount, merchant: params.merchant, newBalance: updatedCard.accountBalance }
      );

      setIsProcessing(false);
      return { success: true, transaction: settledTx };
    }
  };

  // Reconcile Offline Queue Idempotently
  const reconcileQueue = async (): Promise<{ settled: number; rejectedDuplicates: number }> => {
    setIsProcessing(true);
    addAuditEvent(
      'RECONCILIATION_BATCH_STARTED',
      'INFO',
      'Reconciliation-Engine',
      `Starting deterministic reconciliation batch for ${offlineQueue.filter(q => q.status === 'PENDING_SYNC').length} pending queue items.`,
      { totalInQueue: offlineQueue.length }
    );

    await new Promise(r => setTimeout(r, 600));

    const result = runReconciliationBatch(
      offlineQueue,
      transactions,
      centralLedger,
      auditLogs[0]?.hashDigest || '00000000'
    );

    // Calculate total debited during reconciliation and apply to cards
    const settledAmount = result.settledItems.reduce((acc, item) => acc + item.transaction.amount, 0);

    setOfflineQueue(result.updatedQueue);
    setTransactions(result.updatedTransactions);
    setCentralLedger(result.updatedLedger);
    setAuditLogs(prev => [...result.generatedAuditEvents, ...prev]);

    // Permanently deduct settled offline amounts from card balance & restore offline reserve
    setCards(prevCards => prevCards.map(c => {
      return {
        ...c,
        accountBalance: Math.max(0, c.accountBalance - settledAmount),
        offlineCurrentSpent: 0,
        offlineTxCount: 0,
      };
    }));

    setSelectedCard(prev => ({
      ...prev,
      accountBalance: Math.max(0, prev.accountBalance - settledAmount),
      offlineCurrentSpent: 0,
      offlineTxCount: 0,
    }));

    addAuditEvent(
      'RECONCILIATION_SUCCESS',
      'SUCCESS',
      'Reconciliation-Engine',
      `Reconciliation complete: ${result.settledItems.length} settled (₹${settledAmount.toLocaleString('en-IN')} debited), ${result.rejectedDuplicates.length} replay/duplicates blocked.`,
      {
        settledCount: result.settledItems.length,
        rejectedCount: result.rejectedDuplicates.length,
        totalDebited: settledAmount,
      }
    );

    setIsProcessing(false);
    return {
      settled: result.settledItems.length,
      rejectedDuplicates: result.rejectedDuplicates.length,
    };
  };

  // Inject Duplicate Replay Mock into Queue
  const injectDuplicateReplayMock = () => {
    const candidate = offlineQueue.find(q => q.status === 'PENDING_SYNC' || q.status === 'RECONCILED');
    if (!candidate) {
      const seed = transactions[0];
      if (seed) {
        const replayTx: Transaction = {
          ...seed,
          id: `TXN-REPLAY-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'APPROVED_OFFLINE',
          authMode: 'OFFLINE_PARTITION',
        };
        const duplicateItem: OfflineQueueItem = {
          queueId: `Q-REPLAY-${Math.floor(100 + Math.random() * 900)}`,
          transaction: replayTx,
          enqueuedAt: Date.now(),
          syncAttempts: 0,
          status: 'PENDING_SYNC',
          payloadHash: pseudoSha256(JSON.stringify(replayTx.idempotencyKey)),
          isReplayMock: true,
        };
        setOfflineQueue(prev => [duplicateItem, ...prev]);
      }
    } else {
      const duplicateItem: OfflineQueueItem = {
        ...candidate,
        queueId: `Q-REPLAY-${Math.floor(100 + Math.random() * 900)}`,
        status: 'PENDING_SYNC',
        syncAttempts: 0,
        isReplayMock: true,
      };
      setOfflineQueue(prev => [duplicateItem, ...prev]);
    }

    addAuditEvent(
      'QUEUE_ENQUEUED',
      'WARNING',
      'Attack-Simulation-Harness',
      'Duplicate replay attack payload injected into offline queue to verify deterministic deduplication.',
      { mode: 'REPLAY_TEST' }
    );
  };

  // Corrupt Queue Item
  const corruptQueueItem = (queueId: string) => {
    setOfflineQueue(prev => prev.map(q => {
      if (q.queueId === queueId) {
        return {
          ...q,
          status: 'CORRUPTED',
          payloadHash: 'CORRUPTED_TAMPERED_PAYLOAD_HASH',
        };
      }
      return q;
    }));

    addAuditEvent(
      'TAMPER_DETECTED',
      'WARNING',
      'Attack-Simulation-Harness',
      `Injected cryptographic tamper state into Queue ID ${queueId}.`,
      { queueId }
    );
  };

  // Clear Reconciled Items
  const clearReconciledQueue = () => {
    setOfflineQueue(prev => prev.filter(q => q.status === 'PENDING_SYNC'));
  };

  // Reset Everything to Pristine State
  const resetDemoState = () => {
    localStorage.clear();
    setNetworkStatusState('ONLINE');
    setNetworkLatencyMs(38);
    setTransactions([]);
    setOfflineQueue([]);
    setCards(INITIAL_CARDS);
    setSelectedCard(INITIAL_CARDS[0]);
    setTerminals(INITIAL_TERMINALS);
    setSelectedTerminal(INITIAL_TERMINALS[0]);
    setFraudRules(INITIAL_FRAUD_RULES);
    setCentralLedger(INITIAL_LEDGER);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setLastProcessedTx(null);

    addAuditEvent(
      'SYSTEM_RESET',
      'INFO',
      'Nexus-Operator',
      'Demo state reset. Balance restored to ₹10,000, offline limit to ₹2,000.',
      { balance: 10000, offlineLimit: 2000 }
    );
  };

  return (
    <PayShieldContext.Provider
      value={{
        networkStatus,
        setNetworkStatus,
        networkLatencyMs,
        setNetworkLatencyMs,
        transactions,
        offlineQueue,
        cards,
        selectedCard,
        setSelectedCard,
        terminals,
        selectedTerminal,
        setSelectedTerminal,
        fraudRules,
        updateFraudRules,
        centralLedger,
        auditLogs,
        isProcessing,
        lastProcessedTx,
        processPayment,
        reconcileQueue,
        injectDuplicateReplayMock,
        corruptQueueItem,
        clearReconciledQueue,
        resetDemoState,
      }}
    >
      {children}
    </PayShieldContext.Provider>
  );
};

export const usePayShield = () => {
  const context = useContext(PayShieldContext);
  if (!context) {
    throw new Error('usePayShield must be used within a PayShieldProvider');
  }
  return context;
};
