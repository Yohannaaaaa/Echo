import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { setHopReveal } from '@/lib/echoes';

export async function POST(req: Request) {
  const user = await ensureIdentity();
  const body = await req.json().catch(() => ({}));
  const hopId = String(body.hopId ?? '');
  const choice = body.choice === 'revealed' ? 'revealed' : body.choice === 'mystery' ? 'mystery' : null;
  if (!hopId || !choice) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const ok = await setHopReveal(hopId, user.id, choice);
  if (!ok) return NextResponse.json({ error: 'Écho introuvable.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
