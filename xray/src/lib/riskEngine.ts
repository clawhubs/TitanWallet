import { findKnownDrainer } from '@/data/drainers';
import type { RiskAssessment, TokenApproval } from '@/types/scanner';

export function assessApprovalRisk(approval: TokenApproval): RiskAssessment {
  let score = 100;
  const reasons: string[] = [];
  const flags: string[] = [];
  const drainer = findKnownDrainer(approval.spender, approval.chainId);
  const allowance = approval.allowance.toLowerCase();
  const unlimited = allowance.includes('unlimited') || allowance.includes('approvalforall');

  if (drainer) {
    score -= 50;
    flags.push('known_drainer');
    reasons.push(`Spender matches known ${drainer.type} report: ${drainer.name}.`);
  }

  if (!approval.isVerified && approval.type !== 'ERC-20') {
    score -= 35;
    flags.push('unverified_nft_operator');
    reasons.push('NFT approval is granted to an unverified operator.');
  } else if (!approval.isVerified && unlimited) {
    score -= 30;
    flags.push('unverified_unlimited');
    reasons.push('Unlimited approval is granted to an unverified contract.');
  } else if (unlimited) {
    score -= 10;
    flags.push('unlimited_allowance');
    reasons.push('Approval is unlimited, so the spender can transfer the token until revoked.');
  }

  if (!approval.isVerified) {
    score -= 10;
    flags.push('unverified_contract');
    reasons.push('Spender contract verification could not be confirmed from the explorer.');
  }

  score = Math.max(0, Math.min(100, score));
  const riskLevel = score < 35 ? 'critical' : score < 55 ? 'high' : score < 80 ? 'medium' : 'low';

  if (!reasons.length) {
    reasons.push('Limited approval to a contract with no known drainer match.');
    flags.push('limited_or_low_risk');
  }

  return {
    approvalId: approval.id,
    riskLevel,
    score,
    reasons,
    flags,
  };
}

export function computeHealthScore(risks: RiskAssessment[]) {
  if (!risks.length) return 100;
  const average = risks.reduce((sum, risk) => sum + risk.score, 0) / risks.length;
  return Math.max(0, Math.round(average));
}
