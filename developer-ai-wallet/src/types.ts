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
  allowedChainIds?: number[];
  allowedDestinations?: string[];
  expiresAt?: string;
  timelockSeconds?: number;
}

export interface AgentIntentContext {
  intent: string;
  toolSummary?: string;
  actor?: string;
  sessionId?: string;
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
}

export interface ApiResponse {
  success?: boolean;
  request_id?: string;
  [key: string]: unknown;
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
