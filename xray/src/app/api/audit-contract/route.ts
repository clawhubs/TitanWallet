import { NextResponse } from 'next/server';
import { auditContractSource } from '@/lib/contractAudit';

const MAX_SOURCE_CHARS = 24000;

/** Convert a github.com blob URL to its raw.githubusercontent.com equivalent. */
function toRawGithub(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'raw.githubusercontent.com') return url;
    if (u.hostname === 'github.com') {
      // https://github.com/{owner}/{repo}/blob/{branch}/{path}
      const parts = u.pathname.split('/').filter(Boolean);
      const blobIdx = parts.indexOf('blob');
      if (blobIdx > 1 && parts.length > blobIdx + 1) {
        const owner = parts[0];
        const repo = parts[1];
        const rest = parts.slice(blobIdx + 1).join('/');
        return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  let source = typeof body.source === 'string' ? body.source : '';
  let sourceName = typeof body.sourceName === 'string' && body.sourceName.trim() ? body.sourceName.trim() : 'contract.sol';
  const githubUrl = typeof body.githubUrl === 'string' ? body.githubUrl.trim() : '';

  if (!source && githubUrl) {
    const raw = toRawGithub(githubUrl);
    if (!raw) {
      return NextResponse.json({ error: 'Provide a direct GitHub file URL (a .sol blob link), e.g. https://github.com/owner/repo/blob/main/Contract.sol' }, { status: 400 });
    }
    try {
      const res = await fetch(raw, { headers: { Accept: 'text/plain' } });
      if (!res.ok) {
        return NextResponse.json({ error: `Could not fetch source from GitHub (HTTP ${res.status}).` }, { status: 400 });
      }
      source = await res.text();
      sourceName = raw.split('/').pop() || 'contract.sol';
    } catch {
      return NextResponse.json({ error: 'Failed to fetch the GitHub file.' }, { status: 400 });
    }
  }

  source = (source || '').slice(0, MAX_SOURCE_CHARS);
  if (!source.trim()) {
    return NextResponse.json({ error: 'No contract source provided.' }, { status: 400 });
  }
  if (!/contract\s+\w+|pragma\s+solidity|function\s+/.test(source)) {
    return NextResponse.json({ error: 'This does not look like Solidity source. Upload a .sol file or a valid GitHub .sol link.' }, { status: 400 });
  }

  const result = await auditContractSource(source, sourceName);
  return NextResponse.json(result);
}
