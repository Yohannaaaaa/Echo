import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { propagateEchoes, deliverEchoesToUser, getInboxForUser } from '@/lib/echoes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await ensureIdentity();
  propagateEchoes();
  if (user.city && user.countryCode) {
    deliverEchoesToUser(user.id, user.city, user.countryCode);
  }
  const inbox = getInboxForUser(user.id);
  return NextResponse.json({ inbox, user });
}
