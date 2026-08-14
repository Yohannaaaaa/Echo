import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await ensureIdentity();
  return NextResponse.json({ user });
}
