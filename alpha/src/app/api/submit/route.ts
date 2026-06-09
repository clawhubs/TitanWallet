import { NextResponse } from 'next/server';
import { glmJson, hasCerebras } from '@/lib/cerebras';
import { checkTokenSecurity } from '@/lib/goplus';
import type { RiskLevel, SubmissionResult } from '@/lib/types';

function clampScore(v: unknown, f = 60): number { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : f; }
function clampRisk(v: unknown): RiskLevel { const s = String(v).toLowerCase(); return s === 'high' || s === 'medium' || s === 'low' ? (s as RiskLevel) : 'medium'; }

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 100);
  const website = String(body.website || '').trim().slice(0, 200);
  const x = String(body.x || '').trim().slice(0, 100);
  const github = String(body.github || '').trim().slice(0, 200);
  const description = String(body.description || '').trim().slice(0, 1000);
  const tokenAddress = String(body.tokenAddress || '').trim();
  const chainId = Number(body.chainId || 1);

  if (!name || !description) {
    return NextResponse.json({ error: 'Project name and description are required.' }, { status: 400 });
  }

  const notes: string[] = [];

  // GoPlus security layer (only if a token address is provided)
  let securityScore = 70;
  if (/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    const gp = await checkTokenSecurity(chainId, tokenAddress);
    if (gp) {
      securityScore = gp.securityScore;
      notes.push(...gp.flags.map((f) => `GoPlus: ${f}`));
    } else {
      notes.push('GoPlus: no security data available for this token yet.');
    }
  } else {
    notes.push('No token address provided — GoPlus security check skipped.');
  }

  // AI analysis
  let aiScore = 60;
  let riskLevel: RiskLevel = 'medium';
  let summary = 'Submission received and queued for review.';
  if (hasCerebras()) {
    try {
      const system = `You are Titan Alpha's submission analyst. Assess a community-submitted Web3 opportunity for legitimacy and alpha potential.
Return ONLY JSON: {aiScore (0-100), riskLevel (low|medium|high), summary (<=40 words), redFlags (array of short strings)}.`;
      const user = JSON.stringify({ name, website, x, github, description, securityScore });
      const out = await glmJson<{ aiScore: number; riskLevel: string; summary: string; redFlags?: string[] }>(system, user, 600);
      aiScore = clampScore(out.aiScore);
      riskLevel = clampRisk(out.riskLevel);
      summary = String(out.summary || summary);
      if (Array.isArray(out.redFlags)) notes.push(...out.redFlags.slice(0, 5).map((r) => `AI: ${r}`));
    } catch {
      notes.push('AI analysis was busy; submission queued for manual review.');
    }
  } else {
    notes.push('AI engine not configured; submission queued for manual review.');
  }

  const accepted = aiScore >= 35 && securityScore >= 30;
  const result: SubmissionResult = {
    accepted,
    status: accepted ? 'pending-review' : 'rejected',
    aiScore,
    securityScore,
    riskLevel,
    summary,
    notes,
  };
  return NextResponse.json(result);
}
