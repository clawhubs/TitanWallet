import { TITAN_MILITARY_GRADE_BASE_URL, getTitanApiKey } from '../config/api';
import { TitanApiError } from './api';

export interface MilitaryGradeLayerReceipt {
  id: string;
  slug: string;
  label: string;
  proof: string;
  status: string;
  endpoint?: string;
  proof_digest?: string;
}

export interface MilitaryGradeExecutionResponse {
  status: string;
  request_id: string;
  security?: string;
  selected_layers?: MilitaryGradeLayerReceipt[];
  data?: {
    accepted?: boolean;
    payload?: Record<string, unknown>;
  };
  zk_proof?: string;
  '0g_storage_url'?: string;
}

interface MilitaryGradeExecutionInput {
  action: string;
  walletAddress?: string | null;
  network: string;
  chainId?: number;
  intent: string;
  metadata?: Record<string, unknown>;
}

export async function runMilitaryGradeOperation(
  input: MilitaryGradeExecutionInput,
) {
  return militaryGradeRequest<MilitaryGradeExecutionResponse>({
    method: 'POST',
    body: JSON.stringify({
      payload: {
        source: 'titan-wallet',
        action: input.action,
        intent: input.intent,
        walletAddress: input.walletAddress || undefined,
        network: input.network,
        chainId: input.chainId,
        requested_at: new Date().toISOString(),
        metadata: input.metadata || {},
      },
    }),
  });
}

async function militaryGradeRequest<T>(
  options: RequestInit,
): Promise<T> {
  const apiKey = getTitanApiKey();
  if (!apiKey) {
    throw new Error('A YieldBoost developer API key is required for the TITAN military-grade rail.');
  }

  const response = await fetch(
    `${TITAN_MILITARY_GRADE_BASE_URL.replace(/\/$/, '')}/api/dev/store/military-grade`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(options.headers || {}),
      },
    },
  );

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    const detail = typeof payload === 'object' && payload ? payload : undefined;
    const message =
      detail && typeof (detail as Record<string, unknown>).error === 'string'
        ? ((detail as Record<string, unknown>).error as string)
        : `Military-grade request failed with status ${response.status}.`;

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
