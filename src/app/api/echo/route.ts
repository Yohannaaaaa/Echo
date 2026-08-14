import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { createEcho } from '@/lib/echoes';
import { MOODS } from '@/lib/cities';

function normalizeSongUrl(raw: unknown): { ok: true; url: string | undefined } | { ok: false; error: string } {
  const value = String(raw ?? '').trim();
  if (!value) return { ok: true, url: undefined };
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, error: 'Le lien doit commencer par http:// ou https://.' };
    }
    return { ok: true, url: parsed.toString().slice(0, 500) };
  } catch {
    return { ok: false, error: 'Lien invalide.' };
  }
}

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
  const songUrlResult = normalizeSongUrl(body.songUrl);
  if (!songUrlResult.ok) {
    return NextResponse.json({ error: songUrlResult.error }, { status: 400 });
  }

  const echoId = await createEcho(
    user.id,
    user.city,
    user.countryCode,
    songTitle.slice(0, 120),
    songArtist?.slice(0, 120),
    songUrlResult.url,
    mood,
    note,
  );
  return NextResponse.json({ echoId });
}
