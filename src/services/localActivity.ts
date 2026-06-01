import type { Activity, ProofEvent } from '../types';

export interface LocalSecurityEvent {
  type: string;
  desc: string;
  time: Date;
  level: 'info' | 'success' | 'warning';
}

interface StoredLocalEvent {
  walletAddress: string;
  network: string;
  activity?: Activity;
  proofs: ProofEvent[];
  securityEvents: LocalSecurityEvent[];
}

const STORAGE_KEY = 'titan-wallet-local-activity';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function serializeEvent(event: StoredLocalEvent) {
  return {
    ...event,
    activity: event.activity
      ? {
          ...event.activity,
          timestamp: event.activity.timestamp.toISOString(),
        }
      : undefined,
    proofs: event.proofs.map((proof) => ({
      ...proof,
      timestamp: proof.timestamp.toISOString(),
    })),
    securityEvents: event.securityEvents.map((securityEvent) => ({
      ...securityEvent,
      time: securityEvent.time.toISOString(),
    })),
  };
}

function deserializeEvent(event: ReturnType<typeof serializeEvent>): StoredLocalEvent {
  return {
    ...event,
    activity: event.activity
      ? {
          ...event.activity,
          timestamp: new Date(event.activity.timestamp),
        }
      : undefined,
    proofs: event.proofs.map((proof) => ({
      ...proof,
      timestamp: new Date(proof.timestamp),
    })),
    securityEvents: event.securityEvents.map((securityEvent) => ({
      ...securityEvent,
      time: new Date(securityEvent.time),
    })),
  };
}

export function addLocalWalletEvent(event: StoredLocalEvent) {
  if (!canUseStorage()) {
    return;
  }

  const existing = getAllLocalWalletEvents();
  const eventKey = getStoredEventKey(event);
  const withoutDuplicate = existing.filter((item) => getStoredEventKey(item) !== eventKey);
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([serializeEvent(event), ...withoutDuplicate.map(serializeEvent)].slice(0, 100)),
  );
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([serializeEvent(event), ...withoutDuplicate.map(serializeEvent)].slice(0, 100)),
  );
}

export function addLocalWalletProof(input: {
  walletAddress: string;
  network: string;
  proof: ProofEvent;
  securityEvents?: LocalSecurityEvent[];
}) {
  addLocalWalletEvent({
    walletAddress: input.walletAddress,
    network: input.network,
    proofs: [input.proof],
    securityEvents: input.securityEvents || [],
  });
}

export function getLocalWalletEvents(walletAddress: string | null, network: string) {
  if (!walletAddress) {
    return {
      activity: [] as Activity[],
      proofs: [] as ProofEvent[],
      securityEvents: [] as LocalSecurityEvent[],
    };
  }

  const normalizedAddress = walletAddress.toLowerCase();
  const walletEvents = getAllLocalWalletEvents().filter(
    (event) => event.walletAddress.toLowerCase() === normalizedAddress,
  );
  const networkEvents = walletEvents.filter((event) => event.network === network);

  return {
    activity: networkEvents
      .flatMap((event) => (event.activity ? [event.activity] : []))
      .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime()),
    proofs: walletEvents
      .flatMap((event) => event.proofs)
      .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime()),
    securityEvents: walletEvents
      .flatMap((event) => event.securityEvents)
      .sort((left, right) => right.time.getTime() - left.time.getTime()),
  };
}

function getAllLocalWalletEvents(): StoredLocalEvent[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    if (!window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.setItem(STORAGE_KEY, raw);
    }

    const parsed = JSON.parse(raw) as ReturnType<typeof serializeEvent>[];
    return parsed.map(deserializeEvent);
  } catch {
    return [];
  }
}

function getStoredEventKey(event: StoredLocalEvent) {
  if (event.activity?.hash) {
    return `activity:${event.activity.hash}`;
  }

  const proofId = event.proofs[0]?.id || event.proofs[0]?.proofStorageId;
  return `proof:${event.walletAddress.toLowerCase()}:${event.network}:${proofId || Date.now()}`;
}
