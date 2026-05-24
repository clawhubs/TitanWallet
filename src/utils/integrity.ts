import { mockSecurityLayers } from '../data/mockProofs';
import { TITAN_LAYER_ALIASES } from '../data/titanLayers';
import type { Activity, ActivityType, ProofEvent, SecurityLayer, TitanLayer } from '../types';
import type {
  ComponentHealth,
  YieldBoostHealthResponse,
  YieldBoostLayerStatusResponse,
  YieldBoostVaultListItem,
} from '../services/api';

function toLayerStatus(status?: ComponentHealth['status']): SecurityLayer['status'] {
  if (status === 'down') {
    return 'alert';
  }
  if (status === 'degraded') {
    return 'standby';
  }
  return 'active';
}

export function buildTitanSecurityLayersFromApi(
  source?: YieldBoostHealthResponse | YieldBoostLayerStatusResponse | null,
  nitroDetail?: ComponentHealth | null,
): SecurityLayer[] {
  if (!source) {
    return mockSecurityLayers;
  }

  const statusByLayer: Record<TitanLayer, ComponentHealth | undefined> = {
    'Hallucination Blacklist': source.layers.L1,
    'Integrity Auditor': source.layers.L2,
    'Secure Compute / TEE': source.layers.L3,
    'Sovereign Memory': source.layers.L4,
    '0G Storage Proof Layer': source.layers.L5,
    'Zero-Knowledge Proof Layer': source.layers.L6,
    'ProofRegistry Anchor': source.layers.L7,
    'Programmable Governance': source.layers.L8,
    'Cross-Agent Neural Handshake': source.layers.L9,
    'AWS Nitro Enclaves': nitroDetail || detectNitroHealth(source),
  };

  return mockSecurityLayers.map((layer) => {
    const live = statusByLayer[layer.name];
    if (!live) {
      return layer;
    }

    return {
      ...layer,
      status: toLayerStatus(live.status),
      shortDesc: live.detail || layer.shortDesc,
      description: live.detail || layer.description,
      lastCheck: new Date(),
    };
  });
}

export function countActiveTitanLayers(layers: SecurityLayer[]) {
  return layers.filter((layer) => layer.status === 'active').length;
}

export function mapIntegrityRecordsToProofs(items?: YieldBoostVaultListItem[] | null): ProofEvent[] {
  if (!items?.length) {
    return [];
  }

  return items.map((item) => {
    const metadata = item.metadata || {};
    const metadataLayer = typeof metadata.layer_name === 'string' ? metadata.layer_name : null;
    const layer = normalizeTitanLayer(metadataLayer) || 'ProofRegistry Anchor';
    const type =
      typeof metadata.event_type === 'string'
        ? metadata.event_type
        : item.file_name || 'Integrity record';
    const description =
      typeof metadata.description === 'string'
        ? metadata.description
        : `Record ${item.storage_id.slice(0, 10)} sealed for ${item.wallet_address.slice(0, 6)}...${item.wallet_address.slice(-4)}.`;

    return {
      id: item.storage_id,
      layer,
      type,
      description,
      timestamp: new Date(item.created_at),
      status: item.last_unsealed_at ? 'active' : 'verified',
      txHash: item.anchor_tx_hash || item.storage_tx_hash || item.transaction_hash || undefined,
      explorerUrl: item.anchor_explorer_url || item.storage_explorer_url || undefined,
      proofStorageId: item.storage_id,
      integrityHash: item.integrity_hash,
    };
  });
}

export function mapIntegrityRecordsToActivity(items?: YieldBoostVaultListItem[] | null): Activity[] {
  if (!items?.length) {
    return [];
  }

  return items.map((item) => {
    const metadata = item.metadata || {};
    const eventLabel =
      typeof metadata.event_type === 'string'
        ? metadata.event_type
        : item.file_name || 'Integrity event';
    const type = inferActivityType(eventLabel, metadata);
    const symbol =
      typeof metadata.asset_symbol === 'string'
        ? metadata.asset_symbol
        : item.network === 'mainnet'
          ? '0G'
          : 'TEST';
    const amount =
      typeof metadata.amount === 'string'
        ? metadata.amount
        : typeof metadata.value === 'string'
          ? metadata.value
          : eventLabel;
    const amountUSD =
      typeof metadata.amount_usd === 'number'
        ? metadata.amount_usd
        : typeof metadata.value_usd === 'number'
          ? metadata.value_usd
          : 0;
    const counterparty =
      typeof metadata.to === 'string'
        ? metadata.to
        : typeof metadata.target_address === 'string'
          ? metadata.target_address
          : item.wallet_address;

    return {
      id: item.storage_id,
      type,
      status: item.anchor_tx_hash || item.storage_tx_hash || item.transaction_hash ? 'confirmed' : 'pending',
      amount,
      symbol,
      amountUSD,
      from: item.wallet_address,
      to: counterparty,
      hash: item.transaction_hash || item.anchor_tx_hash || item.storage_tx_hash || item.integrity_hash,
      explorerUrl: item.anchor_explorer_url || item.storage_explorer_url || undefined,
      timestamp: new Date(item.created_at),
      network: item.network,
      fee: typeof metadata.fee === 'string' ? metadata.fee : '0',
    };
  });
}

function normalizeTitanLayer(value: string | null): TitanLayer | null {
  if (!value) {
    return null;
  }

  if (value in TITAN_LAYER_ALIASES) {
    return TITAN_LAYER_ALIASES[value];
  }

  return mockSecurityLayers.some((layer) => layer.name === value) ? (value as TitanLayer) : null;
}

function detectNitroHealth(source: YieldBoostHealthResponse | YieldBoostLayerStatusResponse) {
  const candidates = [
    ...Object.values(source.infrastructure || {}),
    ...Object.values(source.layers || {}),
  ];
  const nitroMatch = candidates.find((component) => /nitro/i.test(component.detail));
  if (nitroMatch) {
    return nitroMatch;
  }

  return {
    status: 'degraded' as const,
    detail: 'AWS Nitro Enclaves are not exposed by the current wallet API lane.',
  };
}

function inferActivityType(eventLabel: string, metadata: Record<string, unknown>): ActivityType {
  const typeHint =
    typeof metadata.activity_type === 'string'
      ? metadata.activity_type.toLowerCase()
      : eventLabel.toLowerCase();

  if (typeHint.includes('swap')) {
    return 'swap';
  }
  if (typeHint.includes('receive') || typeHint.includes('deposit')) {
    return 'receive';
  }
  if (typeHint.includes('approve')) {
    return 'approve';
  }
  if (typeHint.includes('stake')) {
    return 'stake';
  }
  return 'send';
}
