import {
  TITAN_API_BASE_URL,
  getTitanApiKey,
  type YieldBoostEnvironment,
} from '../config/api';

export type YieldBoostSignatureKind = 'eip191' | 'eip712';
export type YieldBoostOperation = 'seal' | 'unseal' | 'delete';

export interface YieldBoostChallengeRequest {
  operation: YieldBoostOperation;
  walletAddress: string;
  network?: YieldBoostEnvironment;
  storageId?: string;
}

export interface YieldBoostChallengeResponse {
  success: boolean;
  request_id: string;
  challenge_id: string;
  operation: YieldBoostOperation;
  network: YieldBoostEnvironment;
  wallet_address: string;
  storage_id: string | null;
  message: string;
  issued_at: string;
  expires_at: string;
}

export interface YieldBoostSealRequest {
  walletAddress: string;
  signature: string;
  message: string;
  plaintext?: string;
  fileName?: string;
  fileContentBase64?: string;
  mimeType?: string;
  network?: YieldBoostEnvironment;
  challengeId?: string;
  signatureKind?: YieldBoostSignatureKind;
  transactionHash?: string;
  metadata?: Record<string, unknown>;
  typedData?: Record<string, unknown>;
}

export interface YieldBoostSealResponse {
  success: boolean;
  request_id: string;
  network: YieldBoostEnvironment;
  storage_id: string;
  storage_root_hash: string | null;
  storage_tx_hash: string | null;
  storage_explorer_url: string | null;
  integrity_hash: string;
  judge_url: string;
  anchor_tx_hash: string | null;
  anchor_explorer_url: string | null;
  transaction_hash?: string | null;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostUnsealRequest {
  walletAddress: string;
  storageId: string;
  signature: string;
  message: string;
  network?: YieldBoostEnvironment;
  challengeId?: string;
  signatureKind?: YieldBoostSignatureKind;
  typedData?: Record<string, unknown>;
}

export interface YieldBoostUnsealResponse {
  success: boolean;
  request_id: string;
  network: YieldBoostEnvironment;
  storage_id: string;
  integrity_hash: string;
  plaintext: string | null;
  file_name: string | null;
  file_content_base64: string | null;
  mime_type: string;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostVaultMetadataResponse {
  success: boolean;
  request_id: string;
  network: YieldBoostEnvironment;
  storage_id: string;
  storage_root_hash: string | null;
  storage_tx_hash: string | null;
  storage_explorer_url: string | null;
  wallet_address: string;
  integrity_hash: string;
  payload_sha256: string;
  mime_type: string;
  file_name: string | null;
  storage_uri: string | null;
  storage_mode: string | null;
  anchor_tx_hash: string | null;
  anchor_explorer_url: string | null;
  anchor_mode: string | null;
  transaction_hash?: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  last_unsealed_at: string | null;
}

export interface YieldBoostVaultListItem {
  storage_id: string;
  network: YieldBoostEnvironment;
  wallet_address: string;
  integrity_hash: string;
  payload_sha256: string;
  mime_type: string;
  file_name: string | null;
  storage_root_hash: string | null;
  storage_tx_hash: string | null;
  storage_explorer_url: string | null;
  anchor_tx_hash: string | null;
  anchor_explorer_url: string | null;
  transaction_hash?: string | null;
  created_at: string;
  last_unsealed_at: string | null;
  layer_statuses: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface YieldBoostVaultListResponse {
  success: boolean;
  request_id: string;
  network: YieldBoostEnvironment | null;
  wallet_address: string;
  items: YieldBoostVaultListItem[];
  total: number;
}

export interface ComponentHealth {
  status: 'ok' | 'degraded' | 'down';
  detail: string;
}

export interface YieldBoostHealthResponse {
  success: boolean;
  status: 'ok' | 'degraded' | 'down';
  request_id?: string | null;
  active_network: YieldBoostEnvironment;
  infrastructure: Record<string, ComponentHealth>;
  layers: Record<string, ComponentHealth>;
}

export interface YieldBoostBlacklistResponse {
  success: boolean;
  request_id: string;
  allowed: boolean;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostAuditResponse {
  success: boolean;
  request_id: string;
  payload_sha256: string;
  payload_size_bytes: number;
  mime_type: string;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostProofResponse {
  success: boolean;
  request_id: string;
  integrity_hash: string;
  verified: boolean;
  proof_type: string;
  envelope: Record<string, unknown>;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostGovernanceResponse {
  success: boolean;
  request_id: string;
  allowed: boolean;
  risk_score: number;
  status: string;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostHandshakeResponse {
  success: boolean;
  request_id: string;
  subject_id: string;
  operation: string;
  status: string;
  timestamp: string;
  layer_statuses: Record<string, string>;
}

export interface YieldBoostLayerStatusResponse {
  success: boolean;
  request_id: string;
  active_network: YieldBoostEnvironment;
  infrastructure: Record<string, ComponentHealth>;
  layers: Record<string, ComponentHealth>;
}

export interface ApiRequestOptions extends RequestInit {
  apiKey?: string;
  skipAuth?: boolean;
  baseUrl?: string;
}

export class TitanApiError extends Error {
  status: number;
  requestId?: string;
  detail?: unknown;

  constructor(message: string, options: { status: number; requestId?: string; detail?: unknown }) {
    super(message);
    this.name = 'TitanApiError';
    this.status = options.status;
    this.requestId = options.requestId;
    this.detail = options.detail;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { apiKey, skipAuth = false, baseUrl = TITAN_API_BASE_URL, headers, ...init } = options;
  const resolvedApiKey = apiKey ?? getTitanApiKey();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(!skipAuth && resolvedApiKey ? { 'X-API-Key': resolvedApiKey } : {}),
      ...(headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? safeParseJson(text) : null;

  if (!response.ok) {
    const message =
      isObject(payload) && typeof payload.error === 'string'
        ? payload.error
        : `YieldBoost API request failed with status ${response.status}.`;

    throw new TitanApiError(message, {
      status: response.status,
      requestId:
        isObject(payload) && typeof payload.request_id === 'string'
          ? payload.request_id
          : undefined,
      detail: payload,
    });
  }

  return payload as T;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
