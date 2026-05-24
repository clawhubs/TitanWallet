import { mockSecurityLayers } from '../data/mockProofs';
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

function combineHealth(components: Array<ComponentHealth | undefined>): ComponentHealth | undefined {
  const values = components.filter(Boolean) as ComponentHealth[];
  if (!values.length) {
    return undefined;
  }
  if (values.some((item) => item.status === 'down')) {
    return {
      status: 'down',
      detail: values.map((item) => item.detail).join(' • '),
    };
  }
  if (values.some((item) => item.status === 'degraded')) {
    return {
      status: 'degraded',
      detail: values.map((item) => item.detail).join(' • '),
    };
  }
  return {
    status: 'ok',
    detail: values.map((item) => item.detail).join(' • '),
  };
}

export function buildTitanSecurityLayersFromApi(
  source?: YieldBoostHealthResponse | YieldBoostLayerStatusResponse | null,
): SecurityLayer[] {
  if (!source) {
    return mockSecurityLayers;
  }

  const statusByLayer: Record<TitanLayer, ComponentHealth | undefined> = {
    'Integrity Auditor': combineHealth([source.layers.L1, source.layers.L2]),
    'Programmable Governance': source.layers.L8,
    'ZK Layer': source.layers.L6,
    'Secure Compute': source.layers.L3,
    'Proof Anchor': combineHealth([source.layers.L5, source.layers.L7]),
    'Sovereign Memory': source.layers.L4,
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
    const layer = isTitanLayer(metadataLayer) ? metadataLayer : 'Proof Anchor';
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
      timestamp: new Date(item.created_at),
      network: item.network,
      fee: typeof metadata.fee === 'string' ? metadata.fee : '0',
    };
  });
}

function isTitanLayer(value: string | null): value is TitanLayer {
  return (
    value === 'Integrity Auditor' ||
    value === 'Programmable Governance' ||
    value === 'ZK Layer' ||
    value === 'Secure Compute' ||
    value === 'Proof Anchor' ||
    value === 'Sovereign Memory'
  );
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
