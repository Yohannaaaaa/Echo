import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/identity';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? '');
  const password = String(body.password ?? '');
  if (!token || !password) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const result = await resetPassword(token, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ user: result.user });
}
