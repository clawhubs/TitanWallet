import { NextResponse } from 'next/server';
import { getChainByChainId } from '@/data/chains';
import { isValidEvmAddress } from '@/lib/chainDetector';
import { scanChainApprovals } from '@/lib/explorerApi';
import type { ChainScanResult, ScanResponse } from '@/types/scanner';

export async function POST(request: Request) {
  const started = Date.now();
  const body = await request.json().catch(() => ({}));
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const chains: number[] = Array.isArray(body.chains) ? body.chains.map(Number).filter(Number.isFinite) : [];

  if (!isValidEvmAddress(address)) {
    return NextResponse.json({ error: 'A valid EVM wallet address is required.' }, { status: 400 });
  }
  if (!chains.length) {
    return NextResponse.json({ error: 'At least one chain must be selected.' }, { status: 400 });
  }

  const uniqueChains = [...new Set(chains)].filter((chainId) => Boolean(getChainByChainId(chainId))).slice(0, 10);
  const scanned = await Promise.all(uniqueChains.map((chainId) => scanChainApprovals(address, chainId)));
  const validResults = scanned.filter((result): result is ChainScanResult => Boolean(result));
  const results = Object.fromEntries(validResults.map((result) => [String(result.chain.chainId), result]));
  const resultValues = Object.values(results);
  const overallScore = resultValues.length
    ? Math.round(resultValues.reduce((sum, result) => sum + result.healthScore, 0) / resultValues.length)
    : 100;

  const response: ScanResponse = {
    address,
    results,
    overallScore,
    scanDurationMs: Date.now() - started,
  };

  return NextResponse.json(response);
}
