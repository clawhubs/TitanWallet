import type { ChainInfo } from '@/data/chains';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type UrgencyLevel = 'immediate' | 'soon' | 'monitor' | 'safe';

export interface DetectedChain {
  chainId: number;
  chainName: string;
  chainShortName: string;
  nativeSymbol: string;
  nativeBalance: string;
  nativeBalanceFormatted: string;
  hasActivity: boolean;
  explorerUrl: string;
}

export interface TokenApproval {
  id: string;
  chainId: number;
  chainName: string;
  token: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  spender: string;
  spenderLabel: string;
  allowance: string;
  rawAllowance?: string;
  type: 'ERC-20' | 'ERC-721' | 'ERC-1155';
  txHash: string;
  blockNumber: number;
  timestamp: number;
  isVerified: boolean;
  explorerUrl: string;
}

export interface RiskAssessment {
  approvalId: string;
  riskLevel: RiskLevel;
  score: number;
  reasons: string[];
  flags: string[];
}

export interface WalletChainProfile {
  chainId: number;
  nativeSymbol: string;
  nativeBalanceRaw: string;
  nativeBalanceFormatted: string;
  hasNativeBalance: boolean;
  txCount: number;
  isContract: boolean;
  hasActivity: boolean;
}

export interface ChainScanResult {
  chain: ChainInfo;
  approvals: TokenApproval[];
  riskAssessments: RiskAssessment[];
  healthScore: number;
  totalExposureUsd: number;
  warnings: string[];
  profile?: WalletChainProfile;
}

export interface ScanResponse {
  address: string;
  results: Record<string, ChainScanResult>;
  overallScore: number;
  scanDurationMs: number;
}

export interface AIAnalysisResult {
  summary: string;
  riskNarrative: string;
  recommendations: string[];
  urgencyLevel: UrgencyLevel;
  titanWalletBenefit: string;
  provider: 'qwen3.7-max' | 'rules-fallback';
  model: string;
}

export interface XRaySessionResult {
  address: string;
  detectedChains: DetectedChain[];
  scan: ScanResponse;
  ai: AIAnalysisResult | null;
}
