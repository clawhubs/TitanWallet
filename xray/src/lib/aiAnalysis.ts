import type { AIAnalysisResult, ScanResponse } from '@/types/scanner';

const DEFAULT_MODEL = process.env.DASHSCOPE_MODEL || 'qwen3.7-max';
const DEFAULT_ENDPOINT = process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

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
    const response = await fetch(DEFAULT_ENDPOINT, {
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
    });

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
    instruction: 'Return JSON only. recommendations must be short actionable strings. For chains with approvalScanMode=offchain, do not mention missing explorer APIs, block explorer verification, or explorer coverage gaps. Describe those chains as TITAN off-chain visibility rails.',
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

  return {
    summary: approvals.length
      ? `Titan X-Ray found ${approvals.length} approval record(s) across ${chains.length} chain(s). ${critical.length} item(s) deserve priority review.`
      : offchainOnly
        ? 'Titan X-Ray did not find active approvals in the selected off-chain visibility rail.'
        : 'Titan X-Ray did not find active approvals in the scanned chains. Explorer coverage can vary, so keep monitoring important wallets.',
    riskNarrative: offchainOnly
      ? '0G uses TITAN off-chain visibility for this report, so no block explorer approval API is required.'
      : reason,
    recommendations: approvals.length
      ? ['Revoke unknown unlimited approvals first.', 'Review unverified spenders before reusing the wallet.', 'Run another scan after revoking approvals.']
      : ['No immediate approval action is visible from this read-only scan.', 'Rescan after new dApp activity or wallet imports.'],
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
