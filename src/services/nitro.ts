import { TITAN_DEV_PORTAL_URL, getTitanApiKey } from '../config/api';
import { TitanApiError } from './api';

interface NitroStatusResponse {
  status: string;
  product: string;
  endpoint: string;
  fortress?: {
    host?: string;
    ip?: string;
  };
}

export interface NitroExecutionResponse {
  status: string;
  request_id: string;
  security?: string;
  fortress?: {
    host?: string;
    ip?: string;
    sdk_mode?: string;
    operation?: string;
    survives_destruct?: boolean;
    recovery_mode?: string;
  };
  nitro_enclave?: {
    enclave_id?: string;
    attestation_doc_id?: string;
    attestation_summary?: string;
  };
  tee_badge?: {
    provider?: string;
    status?: string;
    badge_id?: string;
  };
  incident_journal?: {
    event_type?: string;
    latest_event_digest?: string;
    storage_url?: string;
  };
  zk_proof?: string;
  '0g_storage_url'?: string;
}

interface NitroOperationInput {
  operation: string;
  secret: string;
  operator: string;
  network?: 'mainnet';
  sdkMode?: string;
  requestId?: string;
  attackVector?: string | null;
}

const NITRO_ENDPOINT = '/api/dev/store/aws-nitro-fortress';

export async function getNitroFortressStatus() {
  return nitroRequest<NitroStatusResponse>(NITRO_ENDPOINT, {
    method: 'GET',
    skipAuth: true,
  });
}

export async function runNitroFortressOperation(input: NitroOperationInput) {
  return nitroRequest<NitroExecutionResponse>(NITRO_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      requestId: input.requestId,
      network: input.network || 'mainnet',
      operation: input.operation,
      secret: input.secret,
      operator: input.operator,
      attackVector: input.attackVector || null,
      sdkMode: input.sdkMode || 'titan-wallet',
    }),
  });
}

async function nitroRequest<T>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth = false, headers, ...init } = options;
  const apiKey = getTitanApiKey();

  const response = await fetch(`${TITAN_DEV_PORTAL_URL}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(!skipAuth && apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(!skipAuth && apiKey ? { 'X-YieldBoost-API-Key': apiKey } : {}),
      ...(headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    const detail = typeof payload === 'object' && payload ? payload : undefined;
    const message =
      detail && typeof (detail as Record<string, unknown>).error === 'string'
        ? ((detail as Record<string, unknown>).error as string)
        : `Nitro request failed with status ${response.status}.`;
    throw new TitanApiError(message, {
      status: response.status,
      detail,
    });
  }

  return payload as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
