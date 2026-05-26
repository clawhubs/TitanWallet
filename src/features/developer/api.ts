import type { DeveloperDashboard, OwnerSession } from './types';

const CONTROL_ENDPOINT = '/api/agent-wallet/control';

export async function createOwnerChallenge(ownerWalletAddress: string) {
  return post<{
    success: boolean;
    challenge_id: string;
    owner_wallet_address: string;
    message: string;
    expires_at: string;
  }>({
    action: 'auth_challenge',
    owner_wallet_address: ownerWalletAddress,
  });
}

export async function verifyOwnerChallenge(input: {
  challengeId: string;
  signature: string;
}) {
  return post<OwnerSession>({
    action: 'auth_verify',
    challenge_id: input.challengeId,
    signature: input.signature,
  });
}

export async function getDeveloperDashboard(ownerSessionToken: string) {
  return post<DeveloperDashboard>({ action: 'dashboard' }, ownerSessionToken);
}

export async function createDeveloperProject(input: {
  ownerSessionToken: string;
  name: string;
}) {
  return post<DeveloperDashboard & { project: unknown }>({
    action: 'create_project',
    name: input.name,
  }, input.ownerSessionToken);
}

export async function createDeveloperAgentWallet(input: {
  ownerSessionToken: string;
  projectId: string;
  name: string;
}) {
  return post<DeveloperDashboard & { agent_wallet: unknown }>({
    action: 'create_agent_wallet',
    project_id: input.projectId,
    name: input.name,
  }, input.ownerSessionToken);
}

export async function issueDeveloperCapability(input: {
  ownerSessionToken: string;
  agentWalletId: string;
  maxValueWei: string;
  dailyLimitWei: string;
  allowedChainIds: number[];
  allowedDestinations: string[];
  expiresAt: string;
}) {
  return post<DeveloperDashboard & { capability: unknown }>({
    action: 'issue_capability',
    agent_wallet_id: input.agentWalletId,
    max_value_wei: input.maxValueWei,
    daily_limit_wei: input.dailyLimitWei,
    allowed_chain_ids: input.allowedChainIds,
    allowed_destinations: input.allowedDestinations,
    expires_at: input.expiresAt,
  }, input.ownerSessionToken);
}

export async function revokeDeveloperCapability(input: {
  ownerSessionToken: string;
  capabilityId: string;
}) {
  return post<DeveloperDashboard & { capability: unknown }>({
    action: 'revoke_capability',
    capability_id: input.capabilityId,
  }, input.ownerSessionToken);
}

async function post<T>(body: Record<string, unknown>, ownerSessionToken?: string): Promise<T> {
  const response = await fetch(CONTROL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ownerSessionToken ? { 'X-TITAN-OWNER-TOKEN': ownerSessionToken } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : `Developer API failed with ${response.status}.`);
  }
  return payload as T;
}
