import { NextResponse } from 'next/server';
import { detectChains, isValidEvmAddress } from '@/lib/chainDetector';

export async function POST(request: Request) {
  const started = Date.now();
  const body = await request.json().catch(() => ({}));
  const address = typeof body.address === 'string' ? body.address.trim() : '';

  if (!isValidEvmAddress(address)) {
    return NextResponse.json({ error: 'A valid EVM wallet address is required.' }, { status: 400 });
  }

  const detectedChains = await detectChains(address);
  return NextResponse.json({
    address,
    detectedChains,
    scanDurationMs: Date.now() - started,
  });
}
