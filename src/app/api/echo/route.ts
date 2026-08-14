import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { createEcho } from '@/lib/echoes';
import { MOODS } from '@/lib/cities';

export async function POST(req: Request) {
  const user = await ensureIdentity();
  if (!user.city || !user.countryCode) {
    return NextResponse.json({ error: 'Choisis d’abord ta ville.' }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const songTitle = String(body.songTitle ?? '').trim();
  const songArtist = body.songArtist ? String(body.songArtist).trim() : undefined;
  const mood = String(body.mood ?? '');
  const note = body.note ? String(body.note).trim().slice(0, 280) : undefined;

  if (!songTitle) {
    return NextResponse.json({ error: 'Le titre de la chanson est requis.' }, { status: 400 });
  }
  if (!MOODS.some((m) => m.key === mood)) {
    return NextResponse.json({ error: 'Humeur invalide.' }, { status: 400 });
  }

  const echoId = createEcho(user.id, user.city, user.countryCode, songTitle.slice(0, 120), songArtist?.slice(0, 120), mood, note);
  return NextResponse.json({ echoId });
}
