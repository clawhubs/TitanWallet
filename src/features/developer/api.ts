import type {
  DeveloperDashboard,
  DeveloperDemoApiKey,
  DeveloperDemoConfig,
  DeveloperDemoIntentResult,
  DeveloperDemoLatestAnchor,
  DeveloperDemoLogs,
  DeveloperSecurityLog,
  DeveloperX402DemoConfig,
  DeveloperX402PaymentResult,
  OwnerSession,
} from './types';

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
  allowedActions: string[];
  allowedChainIds: number[];
  allowedContracts: string[];
  allowedDestinations: string[];
  expiresAt: string;
}) {
  return post<DeveloperDashboard & { capability: unknown }>({
    action: 'issue_capability',
    agent_wallet_id: input.agentWalletId,
    max_value_wei: input.maxValueWei,
    daily_limit_wei: input.dailyLimitWei,
    allowed_actions: input.allowedActions,
    allowed_chain_ids: input.allowedChainIds,
    allowed_contracts: input.allowedContracts,
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

export async function rotateDeveloperCapability(input: {
  ownerSessionToken: string;
  capabilityId: string;
}) {
  return post<DeveloperDashboard & { capability: unknown }>({
    action: 'rotate_capability',
    capability_id: input.capabilityId,
  }, input.ownerSessionToken);
}

export async function setDeveloperProjectStatus(input: {
  ownerSessionToken: string;
  projectId: string;
  status: 'active' | 'disabled';
}) {
  return post<DeveloperDashboard & { project: unknown }>({
    action: 'set_project_status',
    project_id: input.projectId,
    status: input.status,
  }, input.ownerSessionToken);
}

export async function setDeveloperAgentWalletStatus(input: {
  ownerSessionToken: string;
  agentWalletId: string;
  status: 'active' | 'paused';
}) {
  return post<DeveloperDashboard & { agent_wallet: unknown }>({
    action: 'set_agent_wallet_status',
    agent_wallet_id: input.agentWalletId,
    status: input.status,
  }, input.ownerSessionToken);
}

export async function getDeveloperDemoStatus() {
  return post<{
    success: boolean;
    demo: DeveloperDemoConfig;
    x402_demo: DeveloperX402DemoConfig;
    live_anchor_ready: boolean;
    latest_live_anchor: DeveloperDemoLatestAnchor | null;
  }>({
    action: 'demo_status',
  });
}

export async function createDeveloperDemoApiKey(input: {
  label?: string;
} = {}) {
  return post<{
    success: boolean;
    api_key: string;
    key: DeveloperDemoApiKey;
    demo: DeveloperDemoConfig;
    x402_demo: DeveloperX402DemoConfig;
  }>({
    action: 'demo_create_api_key',
    label: input.label || 'Developer API Demo Key',
  });
}

export async function runDeveloperDemoIntent(input: {
  demoApiKey: string;
  scenario: 'allowed' | 'blocked';
  intent: string;
  action: string;
  amount: string;
  recipient: string;
}) {
  return post<DeveloperDemoIntentResult>({
    action: 'demo_check_intent',
    demo_api_key: input.demoApiKey,
    scenario: input.scenario,
    intent: input.intent,
    requested_action: input.action,
    amount: input.amount,
    recipient: input.recipient,
  });
}

export async function runDeveloperDemoX402Payment(input: {
  demoApiKey: string;
  scenario: 'allowed' | 'blocked';
  intent: string;
  action: string;
  domain: string;
  endpoint: string;
  method?: string;
  amount: string;
  token: string;
  chainId: string;
  recipient: string;
  paymentReference: string;
}) {
  return post<DeveloperX402PaymentResult>({
    action: 'demo_check_x402_payment',
    demo_api_key: input.demoApiKey,
    mode: 'simulation',
    scenario: input.scenario,
    intent: input.intent,
    requested_action: input.action,
    domain: input.domain,
    endpoint: input.endpoint,
    method: input.method || 'POST',
    amount: input.amount,
    token: input.token,
    chainId: input.chainId,
    recipient: input.recipient,
    paymentReference: input.paymentReference,
  });
}

export async function getDeveloperDemoLogs(input: {
  demoApiKey: string;
  limit?: number;
}) {
  return post<DeveloperDemoLogs>({
    action: 'demo_get_logs',
    demo_api_key: input.demoApiKey,
    limit: input.limit || 30,
  });
}

export async function anchorDeveloperDemoSecurityLog(input: {
  demoApiKey: string;
  ownerRunToken: string;
}) {
  return post<{
    success: boolean;
    proof_log: unknown;
    security_log: DeveloperSecurityLog;
    anchor: {
      txHash: string;
      logId: string | null;
      explorerUrl: string;
    };
  }>({
    action: 'demo_anchor_security_log',
    demo_api_key: input.demoApiKey,
    owner_run_token: input.ownerRunToken,
  });
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
