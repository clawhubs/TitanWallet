export interface DeveloperProject {
  id: string;
  owner_wallet_address: string;
  name: string;
  created_at: string;
}

export interface DeveloperAgentWallet {
  id: string;
  project_id: string;
  owner_wallet_address: string;
  name: string;
  layers: string[];
  created_at: string;
}

export interface DeveloperCapability {
  id: string;
  token: string;
  agent_wallet_id: string;
  project_id: string;
  owner_wallet_address: string;
  status: 'active' | 'revoked';
  policy: {
    max_value_wei: string;
    daily_limit_wei: string;
    allowed_chain_ids: number[];
    allowed_destinations: string[];
    expires_at: string;
  };
  created_at: string;
  revoked_at?: string;
}

export interface DeveloperDashboard {
  success: boolean;
  owner_wallet_address: string;
  layers: string[];
  projects: DeveloperProject[];
  agent_wallets: DeveloperAgentWallet[];
  capabilities: DeveloperCapability[];
}

export interface OwnerSession {
  owner_wallet_address: string;
  owner_session_token: string;
  expires_at: string;
}
