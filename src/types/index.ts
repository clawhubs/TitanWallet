// Token / Asset types
export interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUSD: number;
  price: number;
  change24h: number;
  icon: string;
  logoUrl?: string;
  network: string;
  source: 'default' | 'detected' | 'custom';
  contractAddress?: string;
}

// Activity / Transaction types
export type ActivityType = 'send' | 'receive' | 'swap' | 'approve' | 'stake';
export type ActivityStatus = 'confirmed' | 'pending' | 'failed';

export interface Activity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  amount: string;
  symbol: string;
  amountUSD: number;
  from: string;
  to: string;
  hash: string;
  explorerUrl?: string;
  timestamp: Date;
  network: string;
  fee: string;
}

// Proof types
export interface ProofEvent {
  id: string;
  layer: TitanLayer;
  type: string;
  description: string;
  timestamp: Date;
  status: 'verified' | 'pending' | 'active';
  txHash?: string;
  explorerUrl?: string;
  proofStorageId?: string;
  integrityHash?: string;
}

// TITAN Security Layers
export type TitanLayer =
  | 'Hallucination Blacklist'
  | 'Integrity Auditor'
  | 'Secure Compute / TEE'
  | 'Sovereign Memory'
  | '0G Storage Proof Layer'
  | 'Zero-Knowledge Proof Layer'
  | 'ProofRegistry Anchor'
  | 'Programmable Governance'
  | 'Cross-Agent Neural Handshake'
  | 'AWS Nitro Enclaves';

export interface SecurityLayer {
  id: string;
  name: TitanLayer;
  shortDesc: string;
  description: string;
  status: 'active' | 'standby' | 'alert';
  icon: string;
  lastCheck: Date;
  eventsCount: number;
}

// Trusted App types
export interface TrustedApp {
  id: string;
  name: string;
  url: string;
  icon: string;
  connectedAt: Date;
  permissions: string[];
  lastUsed: Date;
  risk: 'low' | 'medium' | 'high';
}

// Network types
export interface Network {
  id: string;
  name: string;
  chainId: number;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  isActive: boolean;
  isDefault?: boolean;
}

// Wallet state
export interface WalletState {
  address: string;
  ensName?: string;
  balanceETH: string;
  balanceUSD: number;
  network: Network;
  isConnected: boolean;
}

// Modal types
export type ModalType =
  | 'connect-app'
  | 'sign-message'
  | 'send-transaction'
  | 'receive'
  | 'send'
  | null;

export interface ApprovalRequest {
  type: 'connect' | 'sign' | 'transaction';
  app: string;
  appIcon?: string;
  url?: string;
  message?: string;
  transaction?: {
    to: string;
    value: string;
    data?: string;
    gasEstimate: string;
  };
  riskLevel: 'safe' | 'caution' | 'danger';
  activeLayers: TitanLayer[];
}
