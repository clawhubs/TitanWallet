import {
  apiRequest,
  type YieldBoostAuditResponse,
  type YieldBoostBlacklistResponse,
  type YieldBoostGovernanceResponse,
  type YieldBoostHandshakeResponse,
  type YieldBoostHealthResponse,
  type YieldBoostLayerStatusResponse,
  type YieldBoostProofResponse,
} from './api';

export async function getHealth() {
  return apiRequest<YieldBoostHealthResponse>('/v1/health', {
    method: 'GET',
    skipAuth: true,
  });
}

export async function getLayerStatus() {
  return apiRequest<YieldBoostLayerStatusResponse>('/v1/status/layers', {
    method: 'GET',
  });
}

export async function checkBlacklist(text: string) {
  return apiRequest<YieldBoostBlacklistResponse>('/v1/blacklist/check', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function auditEvaluate(input: {
  plaintext?: string;
  fileContentBase64?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}) {
  return apiRequest<YieldBoostAuditResponse>('/v1/audit/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      plaintext: input.plaintext,
      file_content_base64: input.fileContentBase64,
      mime_type: input.mimeType || 'text/plain',
      metadata: input.metadata || {},
    }),
  });
}

export async function proofRun(input: {
  commitment: Record<string, unknown>;
  integrityHash?: string;
}) {
  return apiRequest<YieldBoostProofResponse>('/v1/proof/run', {
    method: 'POST',
    body: JSON.stringify({
      commitment: input.commitment,
      integrity_hash: input.integrityHash,
    }),
  });
}

export async function governanceEvaluate(input: {
  walletAddress?: string;
  recentRequestCount?: number;
}) {
  return apiRequest<YieldBoostGovernanceResponse>('/v1/governance/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      wallet_address: input.walletAddress,
      recent_request_count: input.recentRequestCount || 0,
    }),
  });
}

export async function handshakeLog(input: {
  subjectId: string;
  operation: string;
  walletAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  return apiRequest<YieldBoostHandshakeResponse>('/v1/handshake/log', {
    method: 'POST',
    body: JSON.stringify({
      subject_id: input.subjectId,
      operation: input.operation,
      wallet_address: input.walletAddress,
      metadata: input.metadata || {},
    }),
  });
}
