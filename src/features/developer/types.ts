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
