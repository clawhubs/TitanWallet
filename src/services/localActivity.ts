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
  activity: Activity;
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
    activity: {
      ...event.activity,
      timestamp: event.activity.timestamp.toISOString(),
    },
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
    activity: {
      ...event.activity,
      timestamp: new Date(event.activity.timestamp),
    },
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
  const withoutDuplicate = existing.filter((item) => item.activity.hash !== event.activity.hash);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([serializeEvent(event), ...withoutDuplicate.map(serializeEvent)].slice(0, 100)),
  );
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
  const events = getAllLocalWalletEvents().filter(
    (event) =>
      event.walletAddress.toLowerCase() === normalizedAddress &&
      event.network === network,
  );

  return {
    activity: events.map((event) => event.activity),
    proofs: events.flatMap((event) => event.proofs),
    securityEvents: events.flatMap((event) => event.securityEvents),
  };
}

function getAllLocalWalletEvents(): StoredLocalEvent[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ReturnType<typeof serializeEvent>[];
    return parsed.map(deserializeEvent);
  } catch {
    return [];
  }
}
