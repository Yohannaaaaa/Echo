import { NextResponse } from 'next/server';
import { loginWithCredentials } from '@/lib/identity';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '');
  const password = String(body.password ?? '');
  if (!email.trim() || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
  }

  const user = await loginWithCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
  }
  return NextResponse.json({ user });
}
