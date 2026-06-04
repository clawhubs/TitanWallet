export interface DeveloperProject {
  id: string;
  owner_wallet_address: string;
  name: string;
  status: 'active' | 'disabled';
  created_at: string;
  disabled_at?: string | null;
}

export interface DeveloperAgentWallet {
  id: string;
  project_id: string;
  owner_wallet_address: string;
  name: string;
  status: 'active' | 'paused';
  layers: string[];
  created_at: string;
  paused_at?: string | null;
}

export interface DeveloperCapability {
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

export interface DeveloperProofLog {
  id: string;
  owner_wallet_address: string;
  project_id: string | null;
  agent_wallet_id: string | null;
  capability_id: string | null;
  category: 'project' | 'agent_wallet' | 'capability' | 'intent' | 'runtime' | 'admin';
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

export interface DeveloperSecurityLog {
  id: string;
  owner_wallet_address: string;
  demo_api_key_id: string;
  proof_log_id: string | null;
  category: 'security';
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

export interface DeveloperDemoApiKey {
  id: string;
  prefix: string;
  label: string;
  status: 'active' | 'expired' | 'revoked';
  scopes: string[];
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
}

export interface DeveloperDemoConfig {
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

export interface DeveloperX402DemoConfig {
  name: string;
  mode: 'simulation';
  type: 'x402_payment';
  owner_wallet: string;
  project_id: string;
  agent_wallet_id: string;
  capability_id: string;
  capability_name: string;
  status: 'active';
  allowed_actions: string[];
  allowed_domains: string[];
  allowed_recipients: string[];
  allowed_chains: string[];
  allowed_tokens: string[];
  max_amount_per_request: string;
  daily_spend_limit: string;
  policy_window: string;
  proof_log_enabled: boolean;
  layers: string[];
}

export interface DeveloperDemoLatestAnchor {
  id: string;
  owner_wallet_address: string;
  demo_api_key_id: string;
  proof_log_id: string | null;
  category: 'security';
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

export interface DeveloperDemoEvidenceLayer {
  id: string;
  name: string;
  status: string;
}

export interface DeveloperDemoIntentResult {
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
  proofLog: DeveloperProofLog;
  securityLog: DeveloperSecurityLog;
  evidence: DeveloperDemoEvidenceLayer[];
}

export interface DeveloperX402PaymentResult extends DeveloperDemoIntentResult {
  projectId: string;
  payment: {
    intent: string;
    action: string;
    domain: string;
    endpoint: string;
    method: string;
    amount: string;
    token: string;
    chainId: string;
    recipient: string;
    paymentReference: string;
  };
}

export interface DeveloperDemoLogs {
  success: boolean;
  proof_logs: DeveloperProofLog[];
  security_logs: DeveloperSecurityLog[];
}

export interface DeveloperDashboard {
  success: boolean;
  owner_wallet_address: string;
  layers: string[];
  projects: DeveloperProject[];
  agent_wallets: DeveloperAgentWallet[];
  capabilities: DeveloperCapability[];
  proof_logs: DeveloperProofLog[];
}

export interface OwnerSession {
  owner_wallet_address: string;
  owner_session_token: string;
  expires_at: string;
}
