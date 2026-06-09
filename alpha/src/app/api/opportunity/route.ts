import { NextResponse } from 'next/server';
import { glmJson, hasCerebras } from '@/lib/cerebras';

interface Narrative {
  whyItMatters: string;
  opportunity: string;
  risk: string;
  recommendedAction: string;
  confidence: number;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').slice(0, 80);
  const ecosystem = String(body.ecosystem || '').slice(0, 60);
  const category = String(body.category || 'ecosystem').slice(0, 30);
  const summary = String(body.aiSummary || '').slice(0, 300);
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  if (!hasCerebras()) {
    return NextResponse.json({
      whyItMatters: `${name} is an active ${category} opportunity in the ${ecosystem} ecosystem.`,
      opportunity: summary || 'Early positioning may capture incentives, points, or a potential airdrop.',
      risk: 'Unverified upside. Smart-contract, team, and tokenomics risks remain until audited.',
      recommendedAction: 'Do light tasks with a fresh wallet, verify contracts in Titan X-Ray, and size small.',
      confidence: 55,
    } satisfies Narrative);
  }

  try {
    const system = `You are Titan Alpha's narrative engine. Produce a concise, realistic, non-hype analysis of a Web3 opportunity.
Return ONLY JSON: {whyItMatters, opportunity, risk, recommendedAction, confidence (0-100)}. Each text field <= 40 words. Always note it is not financial advice implicitly by being measured.`;
    const user = JSON.stringify({ name, ecosystem, category, context: summary });
    const out = await glmJson<Narrative>(system, user, 2000);
    return NextResponse.json({
      whyItMatters: String(out.whyItMatters || ''),
      opportunity: String(out.opportunity || ''),
      risk: String(out.risk || ''),
      recommendedAction: String(out.recommendedAction || ''),
      confidence: Math.max(0, Math.min(100, Math.round(Number(out.confidence) || 60))),
    } satisfies Narrative);
  } catch (e) {
    console.error('[narrative] GLM failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({
      whyItMatters: `${name} is gaining traction in ${ecosystem}.`,
      opportunity: summary || 'Potential early-access upside.',
      risk: 'AI narrative engine was busy. Treat this as preliminary and verify independently.',
      recommendedAction: 'Verify the contract in Titan X-Ray before interacting.',
      confidence: 50,
    } satisfies Narrative);
  }
}
