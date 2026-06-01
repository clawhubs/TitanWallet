export type TitanNetwork = 'mainnet' | 'testnet';

export type AgentWalletAction =
  | 'agent-intent-check'
  | 'agent-memory-seal'
  | 'agent-send'
  | 'agent-sign'
  | 'agent-simulate'
  | 'agent-tool-result';

export interface AgentWalletIdentity {
  projectId: string;
  agentWalletId: string;
  capabilityToken: string;
  ownerWalletAddress?: string;
}

export interface AgentWalletPolicy {
  maxValueWei?: string;
  dailyLimitWei?: string;
  allowedActions?: string[];
  allowedChainIds?: number[];
  allowedContracts?: string[];
  allowedDestinations?: string[];
  expiresAt?: string;
  timelockSeconds?: number;
}

export interface AgentIntentContext {
  intent: string;
  action?: AgentWalletAction;
  toolSummary?: string;
  actor?: string;
  sessionId?: string;
  chainId?: number;
  destinationAddress?: string;
  contractAddress?: string;
  amountWei?: string;
  metadata?: Record<string, unknown>;
}

export interface NativeSendInput {
  privateKey: string;
  rpcUrl: string;
  chainId: number;
  networkName: string;
  to: string;
  valueEth: string;
  policy?: AgentWalletPolicy;
  context: AgentIntentContext;
  waitForReceipt?: boolean;
  anchorSecurityLog?: boolean;
}

export interface NativeSendResult {
  txHash: string;
  receiptBlockNumber: number | null;
  sealStorageId: string | null;
  proofRequestId: string | null;
  handshakeRequestId: string | null;
  securityLogTxHash: string | null;
  securityLogId: string | null;
}

export interface TitanAgentWalletConfig extends Partial<AgentWalletIdentity> {
  baseUrl?: string;
  militaryBaseUrl?: string;
  ownerSessionToken?: string;
  demoApiKey?: string;
}

export interface ApiResponse {
  success?: boolean;
  request_id?: string;
  [key: string]: unknown;
}

export interface CapabilitySnapshot {
  id: string;
  token: string;
  agent_wallet_id: string;
  project_id: string;
  owner_wallet_address: string;
  status: 'active' | 'revoked' | 'expired';
  policy: {
    max_value_wei: string;
    daily_limit_wei: string;
    allowed_actions: string[];
    allowed_chain_ids: number[];
    allowed_contracts: string[];
    allowed_destinations: string[];
    expires_at: string;
  };
  created_at: string;
  revoked_at?: string | null;
  rotated_from?: string | null;
  last_checked_at?: string | null;
  proof_log_id?: string | null;
}

export interface CapabilityIntentCheckResult {
  success: boolean;
  allowed: boolean;
  reason: string;
  matched_policy: CapabilitySnapshot['policy'];
  capability_id: string;
  project_id: string;
  agent_wallet_id: string;
  proof_log_id: string;
  timestamp: string;
  blacklist: {
    allowed: boolean;
    status: string;
    request_id: string | null;
    reason: string | null;
  };
}

export interface CapabilityProofLogItem {
  id: string;
  owner_wallet_address: string;
  project_id: string | null;
  agent_wallet_id: string | null;
  capability_id: string | null;
  category: string;
  type: string;
  status: string;
  reason: string;
  intent: string | null;
  requested_action: string | null;
  requested_chain_id: number | null;
  requested_contract_address: string | null;
  requested_destination: string | null;
  requested_amount_wei: string | null;
  blacklist_allowed: boolean | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface DemoApiKeySnapshot {
  id: string;
  prefix: string;
  label: string;
  status: 'active' | 'expired' | 'revoked';
  scopes: string[];
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
}

export interface DemoConfigSnapshot {
  name: string;
  mode: 'simulation';
  owner_wallet: string;
  agent_wallet_id: string;
  capability_id: string;
  capability_name: string;
  action: string;
  max_amount: string;
  max_amount_wei: string;
  token: string;
  approved_recipient: string;
  policy_window: string;
  chain_id: number;
  network: string;
  live_anchor_registry: string;
  layers: string[];
}

export interface DemoEvidenceLayer {
  id: string;
  name: string;
  status: string;
}

export interface DemoSecurityLogItem {
  id: string;
  owner_wallet_address: string;
  demo_api_key_id: string;
  proof_log_id: string | null;
  category: string;
  type: string;
  status: string;
  reason: string;
  chain_id: number;
  network: string;
  registry_address: string | null;
  tx_hash: string | null;
  log_id: string | null;
  mode: 'simulation' | 'live';
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface DemoIntentResult {
  success: boolean;
  allowed: boolean;
  reason: string;
  policyResult: 'allowed' | 'blocked';
  proofId: string;
  proofHash: string;
  anchorStatus: string;
  railStatus: string;
  mode: 'simulation';
  ownerWallet: string;
  agentWalletId: string;
  capabilityId: string;
  securityLogId: string;
  proofLog: CapabilityProofLogItem;
  securityLog: DemoSecurityLogItem;
  evidence: DemoEvidenceLayer[];
}

export interface DemoLogsResult {
  success: boolean;
  proof_logs: CapabilityProofLogItem[];
  security_logs: DemoSecurityLogItem[];
}

export const TITAN_AI_WALLET_LAYERS = [
  'Hallucination Blacklist',
  'Integrity Auditor',
  'Secure Compute / TEE',
  'Sovereign Memory',
  '0G Storage Proof Layer',
  'Zero-Knowledge Proof Layer',
  'ProofRegistry Anchor',
  'Programmable Governance',
  'Cross-Agent Neural Handshake',
  'AWS Nitro Enclaves',
] as const;
