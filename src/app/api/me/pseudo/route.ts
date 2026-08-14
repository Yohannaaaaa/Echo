import { NextResponse } from 'next/server';
import { ensureIdentity, setPseudo } from '@/lib/identity';

export async function POST(req: Request) {
  const user = await ensureIdentity();
  const body = await req.json().catch(() => ({}));
  const pseudo = String(body.pseudo ?? '').trim().slice(0, 24);
  if (!pseudo) {
    return NextResponse.json({ error: 'Pseudonyme requis.' }, { status: 400 });
  }
  await setPseudo(user.id, pseudo);
  return NextResponse.json({ user: { ...user, pseudo } });
}
