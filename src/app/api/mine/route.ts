import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { propagateEchoes, getMyEchoesToday } from '@/lib/echoes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await ensureIdentity();
  await propagateEchoes();
  const mine = await getMyEchoesToday(user.id);
  return NextResponse.json({ mine });
}
