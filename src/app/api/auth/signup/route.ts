import { NextResponse } from 'next/server';
import { ensureIdentity, setCredentials } from '@/lib/identity';

export async function POST(req: Request) {
  const user = await ensureIdentity();
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '');
  const password = String(body.password ?? '');

  const result = await setCredentials(user.id, email, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ user: result.user });
}
