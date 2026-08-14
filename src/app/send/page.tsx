'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOODS } from '@/lib/cities';
import { useIdentity } from '@/components/IdentityProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { localeTag } from '@/lib/i18n/languages';
import type { MoodKey } from '@/lib/i18n/translations';

export default function SendPage() {
  const router = useRouter();
  const { user } = useIdentity();
  const { t, lang } = useLanguage();
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const now = new Date();
  const time = now.toLocaleTimeString(localeTag(lang), { hour: '2-digit', minute: '2-digit' });

  async function handleSend() {
    if (!songTitle.trim() || !mood) return;
    setSending(true);
    setError(null);
    const res = await fetch('/api/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songTitle, songArtist, songUrl, mood, note }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? t.send.genericError);
      return;
    }
    setSentId(data.echoId);
  }

  if (sentId) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 text-5xl animate-pulseSlow">🌙</div>
        <h1 className="text-xl font-semibold">{t.send.sentTitle}</h1>
        <p className="mt-3 text-white/60">{t.send.sentBody(time, songTitle)}</p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button className="btn-primary py-3" onClick={() => router.push(`/journey/${sentId}`)}>
            {t.send.followJourney}
          </button>
          <button
            className="btn-ghost py-3"
            onClick={() => {
              setSentId(null);
              setSongTitle('');
              setSongArtist('');
              setSongUrl('');
              setMood(null);
              setNote('');
            }}
          >
            {t.send.sendAnother}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.send.newEcho}</h1>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
          {time} {user?.city ? `· ${user.city}` : ''}
        </span>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-white/60">{t.send.listeningPrompt}</label>
          <input
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder={t.send.titlePlaceholder}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
          />
          <input
            value={songArtist}
            onChange={(e) => setSongArtist(e.target.value)}
            placeholder={t.send.artistPlaceholder}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
          />
          <input
            type="url"
            value={songUrl}
            onChange={(e) => setSongUrl(e.target.value)}
            placeholder={t.send.urlPlaceholder}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-white/60">{t.send.moodPrompt}</label>
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMood(m.key)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs transition-colors ${
                  mood === m.key
                    ? 'border-echo-500 bg-echo-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/50'
                }`}
              >
                <span className="text-lg">{m.emoji}</span>
                {t.moods[m.key as MoodKey]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-white/60">{t.send.whyPrompt}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder={t.send.whyPlaceholder}
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
          />
          <div className="mt-1 text-right text-xs text-white/30">{note.length}/280</div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          disabled={!songTitle.trim() || !mood || sending}
          onClick={handleSend}
          className="btn-primary flex w-full items-center justify-center gap-2 py-4"
        >
          {sending ? t.send.sending : t.send.sendButton}
        </button>
        <p className="text-center text-xs text-white/30">{t.send.privacyNote}</p>
      </div>
    </main>
  );
}
