import { NextResponse } from 'next/server';
import { restoreIdentity } from '@/lib/identity';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? '');
  if (!code.trim()) {
    return NextResponse.json({ error: 'Code requis.' }, { status: 400 });
  }
  const user = await restoreIdentity(code);
  if (!user) {
    return NextResponse.json({ error: 'Code introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ user });
}
