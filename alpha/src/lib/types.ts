export type RiskLevel = 'low' | 'medium' | 'high';
export type YieldPotential = 'low' | 'medium' | 'high';
export type OpportunityCategory = 'airdrop' | 'testnet' | 'ecosystem' | 'incentive' | 'points' | 'rewards';

export interface Opportunity {
  id: string;
  name: string;
  ecosystem: string;
  category: OpportunityCategory;
  logo?: string;
  url?: string;
  tvl?: number;
  aiScore: number;        // 0-100
  securityScore: number;  // 0-100
  riskLevel: RiskLevel;
  yieldPotential: YieldPotential;
  aiSummary: string;
  narrative: {
    whyItMatters: string;
    opportunity: string;
    risk: string;
    recommendedAction: string;
    confidence: number;   // 0-100
  };
  source: string;
  updatedAt: string;
}

export interface SubmissionResult {
  accepted: boolean;
  status: 'analyzing' | 'pending-review' | 'rejected';
  aiScore: number;
  securityScore: number;
  riskLevel: RiskLevel;
  summary: string;
  notes: string[];
}
