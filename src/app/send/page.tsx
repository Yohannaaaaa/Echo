'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOODS } from '@/lib/cities';
import { useIdentity } from '@/components/IdentityProvider';

export default function SendPage() {
  const router = useRouter();
  const { user } = useIdentity();
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const now = new Date();
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  async function handleSend() {
    if (!songTitle.trim() || !mood) return;
    setSending(true);
    setError(null);
    const res = await fetch('/api/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songTitle, songArtist, mood, note }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.');
      return;
    }
    setSentId(data.echoId);
  }

  if (sentId) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 text-5xl animate-pulseSlow">🌙</div>
        <h1 className="text-xl font-semibold">Ton écho est parti.</h1>
        <p className="mt-3 text-white/60">
          Quelqu&apos;un, quelque part, va découvrir qu&apos;à {time} tu écoutais &laquo; {songTitle} &raquo;.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button className="btn-primary py-3" onClick={() => router.push(`/journey/${sentId}`)}>
            Suivre son voyage
          </button>
          <button
            className="btn-ghost py-3"
            onClick={() => {
              setSentId(null);
              setSongTitle('');
              setSongArtist('');
              setMood(null);
              setNote('');
            }}
          >
            Envoyer un autre écho
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nouvel écho</h1>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
          {time} {user?.city ? `· ${user.city}` : ''}
        </span>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-white/60">Qu&apos;écoutes-tu là, maintenant ?</label>
          <input
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Titre de la chanson"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
          />
          <input
            value={songArtist}
            onChange={(e) => setSongArtist(e.target.value)}
            placeholder="Artiste (optionnel)"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-white/60">Ton humeur, là, maintenant</label>
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
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-white/60">Pourquoi ? (optionnel)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder="Parce que je n'arrivais pas à dormir…"
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
          {sending ? 'Envoi…' : '🎵 SEND ECHO'}
        </button>
        <p className="text-center text-xs text-white/30">
          Personne ne verra ton profil. Juste ce moment, envoyé à quelqu&apos;un, quelque part.
        </p>
      </div>
    </main>
  );
}
