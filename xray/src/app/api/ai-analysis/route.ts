import { NextResponse } from 'next/server';
import { isValidEvmAddress } from '@/lib/chainDetector';
import { analyzeScanWithAI } from '@/lib/aiAnalysis';
import type { ScanResponse } from '@/types/scanner';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const scanResults = body.scanResults as ScanResponse | undefined;

  if (!isValidEvmAddress(address)) {
    return NextResponse.json({ error: 'A valid EVM wallet address is required.' }, { status: 400 });
  }
  if (!scanResults || typeof scanResults !== 'object' || !scanResults.results) {
    return NextResponse.json({ error: 'scanResults is required.' }, { status: 400 });
  }

  const analysis = await analyzeScanWithAI(address, scanResults);
  return NextResponse.json(analysis);
}
