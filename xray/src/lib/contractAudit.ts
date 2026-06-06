import { withTimeout } from './rateLimiter';
import type { ContractAuditResult, ContractFinding, ContractFindingSeverity } from '@/types/scanner';

const DEFAULT_MODEL = process.env.DASHSCOPE_MODEL || 'qwen3.7-max';
const DEFAULT_ENDPOINT = process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const AI_TIMEOUT_MS = Number(process.env.DASHSCOPE_TIMEOUT_MS || 25000);
const MAX_SOURCE_CHARS = 24000;

const SYSTEM_PROMPT = `You are Titan X-Ray AI, a senior smart-contract security auditor.
Audit the provided Solidity source for real vulnerabilities and risky patterns
(reentrancy, unchecked external calls, delegatecall, tx.origin auth, integer issues,
unlimited mint, owner backdoors, hidden fees, blacklist/pause traps, upgradeable proxies,
honeypot patterns). Be factual and non-fearmongering. This is informational, not financial advice.
Return ONLY compact JSON with keys:
"summary" (string), "overallRisk" (one of: critical, high, medium, low, safe),
"score" (integer 0-100, higher = safer),
"findings" (array of objects with keys: severity [critical|high|medium|low|info], title, detail, recommendation).`;

const SEVERITIES: ContractFindingSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

function clampSeverity(value: unknown): ContractFindingSeverity {
  const v = String(value || 'info').toLowerCase();
  return (SEVERITIES as string[]).includes(v) ? (v as ContractFindingSeverity) : 'info';
}

export async function auditContractSource(source: string, sourceName: string): Promise<ContractAuditResult> {
  const trimmed = source.slice(0, MAX_SOURCE_CHARS);
  const key = process.env.DASHSCOPE_API_KEY?.trim();
  if (!key) {
    return heuristicAudit(trimmed, sourceName, 'AI auditor is not configured; showing pattern-based static checks.');
  }

  try {
    const response = await withTimeout(
      fetch(DEFAULT_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `File: ${sourceName}\n\nSolidity source:\n\`\`\`solidity\n${trimmed}\n\`\`\`` },
          ],
          temperature: 0.2,
          max_tokens: 1600,
          response_format: { type: 'json_object' },
          enable_thinking: false,
        }),
      }),
      AI_TIMEOUT_MS,
      'Contract audit',
    );

    if (!response.ok) throw new Error(`DashScope HTTP ${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('No audit content returned.');
    return normalizeAudit(JSON.parse(content), sourceName);
  } catch {
    return heuristicAudit(trimmed, sourceName, 'AI auditor was unavailable; showing pattern-based static checks.');
  }
}

function normalizeAudit(value: Record<string, unknown>, sourceName: string): ContractAuditResult {
  const findingsRaw = Array.isArray(value.findings) ? value.findings : [];
  const findings: ContractFinding[] = findingsRaw.slice(0, 20).map((f) => {
    const obj = (f && typeof f === 'object') ? (f as Record<string, unknown>) : {};
    return {
      severity: clampSeverity(obj.severity),
      title: String(obj.title || 'Finding'),
      detail: String(obj.detail || ''),
      recommendation: obj.recommendation ? String(obj.recommendation) : undefined,
    };
  });
  const risk = String(value.overallRisk || '').toLowerCase();
  const overallRisk = ['critical', 'high', 'medium', 'low', 'safe'].includes(risk)
    ? (risk as ContractAuditResult['overallRisk'])
    : deriveRisk(findings);
  const score = typeof value.score === 'number' ? Math.max(0, Math.min(100, Math.round(value.score))) : scoreFromFindings(findings);

  return {
    sourceName,
    summary: String(value.summary || 'Static + AI review completed.'),
    overallRisk,
    score,
    findings: findings.length ? findings : [{ severity: 'info', title: 'No specific issues flagged', detail: 'The auditor did not return individual findings. Always review manually before trusting a contract.' }],
    provider: 'qwen3.7-max',
    model: DEFAULT_MODEL,
  };
}

interface Pattern { re: RegExp; severity: ContractFindingSeverity; title: string; detail: string; recommendation: string; }

const PATTERNS: Pattern[] = [
  { re: /selfdestruct\s*\(|suicide\s*\(/, severity: 'high', title: 'Self-destruct present', detail: 'The contract can be destroyed, which can rug liquidity or brick functionality.', recommendation: 'Confirm who can trigger it and whether it is gated.' },
  { re: /delegatecall\s*\(/, severity: 'high', title: 'delegatecall usage', detail: 'delegatecall executes external code in this contract context and can be abused if the target is controllable.', recommendation: 'Verify the target is immutable and trusted.' },
  { re: /tx\.origin/, severity: 'high', title: 'tx.origin used for authorization', detail: 'tx.origin auth is phishing-prone and should not gate sensitive actions.', recommendation: 'Use msg.sender instead.' },
  { re: /function\s+_?mint\s*\(|function\s+mint\s*\(/, severity: 'medium', title: 'Mint function present', detail: 'Owner/minter may be able to inflate supply, diluting holders.', recommendation: 'Check mint access control and supply caps.' },
  { re: /onlyOwner|Ownable/, severity: 'medium', title: 'Owner-controlled functions', detail: 'Privileged owner functions can change behavior; centralization risk.', recommendation: 'Review owner powers and whether ownership is renounced or multisig.' },
  { re: /blacklist|blocklist|_isBlacklisted|isBot/i, severity: 'high', title: 'Blacklist / anti-bot logic', detail: 'Addresses can be blocked from transferring — a common honeypot pattern.', recommendation: 'Confirm it cannot be used to trap buyers.' },
  { re: /whenNotPaused|Pausable|_pause\s*\(/, severity: 'medium', title: 'Pausable transfers', detail: 'Transfers can be paused by a privileged role, freezing funds.', recommendation: 'Check who can pause and unpause.' },
  { re: /upgradeTo|UUPS|TransparentUpgradeable|initializer/i, severity: 'medium', title: 'Upgradeable / proxy pattern', detail: 'Contract logic can be replaced after deployment, changing rules.', recommendation: 'Verify upgrade admin and timelock.' },
  { re: /block\.(timestamp|number)\s*[%*]|blockhash\s*\(/, severity: 'low', title: 'Weak on-chain randomness', detail: 'Using block values for randomness is manipulable by miners/validators.', recommendation: 'Use a VRF or commit-reveal scheme.' },
  { re: /\.call\{?\s*value/, severity: 'low', title: 'Low-level call with value', detail: 'Raw value transfers via .call can reenter if state is updated after the call.', recommendation: 'Apply checks-effects-interactions and reentrancy guards.' },
];

function heuristicAudit(source: string, sourceName: string, note: string): ContractAuditResult {
  const findings: ContractFinding[] = [];
  for (const p of PATTERNS) {
    if (p.re.test(source)) {
      findings.push({ severity: p.severity, title: p.title, detail: p.detail, recommendation: p.recommendation });
    }
  }
  const hasReentrancyGuard = /nonReentrant|ReentrancyGuard/.test(source);
  if (!hasReentrancyGuard && /\.call\{?\s*value|transfer\(|send\(/.test(source)) {
    findings.push({ severity: 'low', title: 'No explicit reentrancy guard', detail: 'Value-moving code without a visible nonReentrant guard.', recommendation: 'Consider OpenZeppelin ReentrancyGuard.' });
  }
  if (!findings.length) {
    findings.push({ severity: 'info', title: 'No high-risk patterns detected', detail: 'Static checks found no known dangerous patterns. This is not a guarantee of safety — manual review is still recommended.' });
  }
  return {
    sourceName,
    summary: `${note} Found ${findings.filter((f) => f.severity !== 'info').length} pattern-based item(s) to review.`,
    overallRisk: deriveRisk(findings),
    score: scoreFromFindings(findings),
    findings,
    provider: 'rules-fallback',
    model: 'static-pattern-scan',
  };
}

function deriveRisk(findings: ContractFinding[]): ContractAuditResult['overallRisk'] {
  if (findings.some((f) => f.severity === 'critical')) return 'critical';
  if (findings.some((f) => f.severity === 'high')) return 'high';
  if (findings.some((f) => f.severity === 'medium')) return 'medium';
  if (findings.some((f) => f.severity === 'low')) return 'low';
  return 'safe';
}

function scoreFromFindings(findings: ContractFinding[]): number {
  let score = 100;
  for (const f of findings) {
    if (f.severity === 'critical') score -= 35;
    else if (f.severity === 'high') score -= 20;
    else if (f.severity === 'medium') score -= 10;
    else if (f.severity === 'low') score -= 4;
  }
  return Math.max(0, Math.min(100, score));
}
