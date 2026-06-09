import { NextResponse } from 'next/server';
import { getOpportunities } from '@/lib/opportunities';

export const revalidate = 0;

export async function GET() {
  try {
    const data = await getOpportunities();
    return NextResponse.json({ opportunities: data, count: data.length, updatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ opportunities: [], count: 0, error: 'Failed to load opportunities.' }, { status: 200 });
  }
}
