import type { AIAnalysisResult, ScanResponse } from '@/types/scanner';
import { withTimeout } from './rateLimiter';

const DEFAULT_MODEL = process.env.DASHSCOPE_MODEL || 'qwen3.7-max';
const DEFAULT_ENDPOINT = process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const AI_TIMEOUT_MS = Number(process.env.DASHSCOPE_TIMEOUT_MS || 15000);

const SYSTEM_PROMPT = `You are Titan X-Ray AI, a blockchain security advisor.
Analyze wallet token approvals and provide factual, non-fearmongering security guidance.
Always mention this is informational, not financial advice.
Return compact JSON with keys: summary, riskNarrative, recommendations, urgencyLevel, titanWalletBenefit.`;

export async function analyzeScanWithAI(address: string, scanResults: ScanResponse): Promise<AIAnalysisResult> {
  const key = process.env.DASHSCOPE_API_KEY?.trim();
  if (!key) {
    return buildFallbackAnalysis(scanResults, 'DASHSCOPE_API_KEY is not configured.');
  }

  try {
    const response = await withTimeout(
      fetch(DEFAULT_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildAnalysisPrompt(address, scanResults) },
          ],
          temperature: 0.2,
          max_tokens: 900,
          response_format: { type: 'json_object' },
        }),
      }),
      AI_TIMEOUT_MS,
      'Qwen analysis',
    );

    if (!response.ok) {
      throw new Error(`DashScope returned HTTP ${response.status}.`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('DashScope response did not include message content.');
    }

    return normalizeAIJson(JSON.parse(content), DEFAULT_MODEL, scanResults);
  } catch (error) {
    return buildFallbackAnalysis(scanResults, error instanceof Error ? error.message : 'Qwen analysis failed.');
  }
}

function buildAnalysisPrompt(address: string, scanResults: ScanResponse) {
  const compact = Object.values(scanResults.results).map((chain) => ({
    chain: chain.chain.name,
    approvalScanMode: chain.chain.approvalScanMode || 'onchain',
    score: chain.healthScore,
    footprint: chain.profile ? {
      nativeBalance: chain.profile.nativeBalanceFormatted,
      transactions: chain.profile.txCount,
      accountType: chain.profile.isContract ? 'smart-contract' : 'EOA',
      hasActivity: chain.profile.hasActivity,
    } : undefined,
    approvals: chain.approvals.map((approval) => {
      const risk = chain.riskAssessments.find((item) => item.approvalId === approval.id);
      return {
        token: approval.tokenSymbol,
        spender: approval.spenderLabel || approval.spender,
        allowance: approval.allowance,
        type: approval.type,
        riskLevel: risk?.riskLevel,
        reasons: risk?.reasons,
      };
    }),
    warnings: chain.warnings,
  }));

  return JSON.stringify({
    address,
    overallScore: scanResults.overallScore,
    chains: compact,
    instruction: 'Return JSON only. recommendations must be short actionable strings. Use the per-chain footprint (native balance, transactions, account type) to describe the wallet substantively even when there are no approvals. For chains with approvalScanMode=offchain, do not mention missing explorer APIs, block explorer verification, or explorer coverage gaps. Describe those chains as TITAN off-chain visibility rails.',
  });
}

function normalizeAIJson(value: Record<string, unknown>, model: string, scanResults: ScanResponse): AIAnalysisResult {
  const recommendations = Array.isArray(value.recommendations)
    ? value.recommendations.map(String).slice(0, 5)
    : ['Review high-risk approvals and revoke anything you do not recognize.'];
  const urgency = String(value.urgencyLevel || 'monitor');
  const offchainOnly = isOffchainOnlyScan(scanResults);

  return {
    summary: sanitizeOffchainExplorerCopy(
      String(value.summary || 'Titan X-Ray completed a read-only wallet risk scan.'),
      offchainOnly,
    ),
    riskNarrative: sanitizeOffchainExplorerCopy(
      String(value.riskNarrative || 'No detailed AI narrative was returned.'),
      offchainOnly,
    ),
    recommendations: recommendations.map((item) => sanitizeOffchainExplorerCopy(item, offchainOnly)),
    urgencyLevel: urgency === 'immediate' || urgency === 'soon' || urgency === 'safe' ? urgency : 'monitor',
    titanWalletBenefit: String(value.titanWalletBenefit || 'Titan Wallet keeps security rails visible before sensitive wallet actions.'),
    provider: 'qwen3.7-max',
    model,
  };
}

function buildFallbackAnalysis(scanResults: ScanResponse, reason: string): AIAnalysisResult {
  const chains = Object.values(scanResults.results);
  const approvals = chains.flatMap((chain) => chain.approvals);
  const critical = chains.flatMap((chain) => chain.riskAssessments).filter((risk) => risk.riskLevel === 'critical' || risk.riskLevel === 'high');
  const urgencyLevel = critical.length ? 'soon' : approvals.length ? 'monitor' : 'safe';
  const offchainOnly = isOffchainOnlyScan(scanResults);

  const profiles = chains.map((chain) => chain.profile).filter((profile) => Boolean(profile));
  const totalTx = profiles.reduce((sum, profile) => sum + (profile?.txCount || 0), 0);
  const activeChains = profiles.filter((profile) => profile?.hasActivity).length;
  const footprintLine = profiles.length
    ? `Footprint: ${totalTx.toLocaleString('en-US')} transaction(s) across ${activeChains} active chain(s).`
    : '';

  return {
    summary: approvals.length
      ? `Titan X-Ray found ${approvals.length} approval record(s) across ${chains.length} chain(s). ${critical.length} item(s) deserve priority review.`
      : offchainOnly
        ? `No active approvals in the selected off-chain visibility rail. ${footprintLine}`.trim()
        : `No token approvals are currently exposing this wallet. ${footprintLine} That is a clean result — nothing to revoke right now.`.trim(),
    riskNarrative: offchainOnly
      ? '0G uses TITAN off-chain visibility for this report, so no block explorer approval API is required.'
      : approvals.length
        ? reason
        : 'The scan read live on-chain data and found no approval grants that put your tokens at risk. Your exposure surface is minimal.',
    recommendations: approvals.length
      ? ['Revoke unknown unlimited approvals first.', 'Review unverified spenders before reusing the wallet.', 'Run another scan after revoking approvals.']
      : ['No approval action needed right now.', 'Rescan after connecting to new dApps or signing approvals.', 'Bookmark and re-run X-Ray periodically to stay clean.'],
    urgencyLevel,
    titanWalletBenefit: 'Titan Wallet can keep approval review and security logs closer to the wallet action flow.',
    provider: 'rules-fallback',
    model: DEFAULT_MODEL,
  };
}

function isOffchainOnlyScan(scanResults: ScanResponse) {
  const chains = Object.values(scanResults.results);
  return chains.length > 0 && chains.every((chain) => chain.chain.approvalScanMode === 'offchain');
}

function sanitizeOffchainExplorerCopy(value: string, offchainOnly: boolean) {
  if (!offchainOnly) {
    return value;
  }

  return value
    .replace(/0G explorer API is not configured\.?/gi, '0G uses TITAN off-chain visibility for this report.')
    .replace(/explorer API (?:is )?unconfigured/gi, 'off-chain visibility is used')
    .replace(/block explorer/gi, 'TITAN off-chain rail')
    .replace(/explorer coverage gaps?/gi, 'off-chain visibility boundaries');
}
