import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { replyToHop } from '@/lib/echoes';

export async function POST(req: Request) {
  const user = await ensureIdentity();
  const body = await req.json().catch(() => ({}));
  const hopId = String(body.hopId ?? '');
  const note = String(body.note ?? '').trim().slice(0, 280);
  if (!hopId || !note) {
    return NextResponse.json({ error: 'Message requis.' }, { status: 400 });
  }
  const ok = await replyToHop(hopId, user.id, note);
  if (!ok) return NextResponse.json({ error: 'Écho introuvable.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
