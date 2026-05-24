import {
  apiRequest,
  type YieldBoostChallengeRequest,
  type YieldBoostChallengeResponse,
  type YieldBoostSealRequest,
  type YieldBoostSealResponse,
  type YieldBoostUnsealRequest,
  type YieldBoostUnsealResponse,
  type YieldBoostVaultListResponse,
  type YieldBoostVaultMetadataResponse,
} from './api';

export async function createChallenge(input: YieldBoostChallengeRequest) {
  return apiRequest<YieldBoostChallengeResponse>('/v1/auth/challenge', {
    method: 'POST',
    body: JSON.stringify({
      operation: input.operation,
      network: input.network,
      wallet_address: input.walletAddress,
      storage_id: input.storageId,
    }),
  });
}

export async function seal(input: YieldBoostSealRequest) {
  return apiRequest<YieldBoostSealResponse>('/v1/integrity/seal', {
    method: 'POST',
    body: JSON.stringify({
      network: input.network,
      challenge_id: input.challengeId,
      wallet_address: input.walletAddress,
      signature: input.signature,
      signature_kind: input.signatureKind || 'eip191',
      message: input.message,
      typed_data: input.typedData,
      plaintext: input.plaintext,
      file_name: input.fileName,
      file_content_base64: input.fileContentBase64,
      mime_type: input.mimeType || 'text/plain',
      transaction_hash: input.transactionHash,
      metadata: input.metadata || {},
    }),
  });
}

export async function unseal(input: YieldBoostUnsealRequest) {
  return apiRequest<YieldBoostUnsealResponse>('/v1/integrity/unseal', {
    method: 'POST',
    body: JSON.stringify({
      network: input.network,
      challenge_id: input.challengeId,
      wallet_address: input.walletAddress,
      signature: input.signature,
      signature_kind: input.signatureKind || 'eip191',
      message: input.message,
      typed_data: input.typedData,
      storage_id: input.storageId,
    }),
  });
}

export async function listRecords(input: {
  walletAddress: string;
  network?: 'testnet' | 'mainnet';
}) {
  const search = new URLSearchParams({
    wallet_address: input.walletAddress,
  });

  if (input.network) {
    search.set('network', input.network);
  }

  return apiRequest<YieldBoostVaultListResponse>(`/v1/integrity/records?${search.toString()}`, {
    method: 'GET',
  });
}

export async function getMetadata(storageId: string) {
  return apiRequest<YieldBoostVaultMetadataResponse>(
    `/v1/integrity/${encodeURIComponent(storageId)}/metadata`,
    { method: 'GET' },
  );
}
