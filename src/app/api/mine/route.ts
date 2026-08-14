import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { propagateEchoes, getMyEchoesToday } from '@/lib/echoes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await ensureIdentity();
  propagateEchoes();
  const mine = getMyEchoesToday(user.id);
  return NextResponse.json({ mine });
}
