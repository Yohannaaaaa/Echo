import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { getOrCreateTodayQuestion, hasResponded, submitResponse, getFeed } from '@/lib/global';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await ensureIdentity();
  const question = getOrCreateTodayQuestion();
  const responded = hasResponded(question.id, user.id);
  return NextResponse.json({
    question,
    responded,
    feed: responded ? getFeed(question.id) : [],
  });
}

export async function POST(req: Request) {
  const user = await ensureIdentity();
  if (!user.city || !user.countryCode) {
    return NextResponse.json({ error: 'Choisis d’abord ta ville.' }, { status: 400 });
  }
  const question = getOrCreateTodayQuestion();
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? '').trim().slice(0, 240);
  if (!text) return NextResponse.json({ error: 'Réponse vide.' }, { status: 400 });

  const ok = submitResponse(question.id, user.id, user.city, user.countryCode, text);
  if (!ok) return NextResponse.json({ error: 'Tu as déjà répondu aujourd’hui.' }, { status: 409 });
  return NextResponse.json({ ok: true, feed: getFeed(question.id) });
}
