'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { flagFor, moodEmoji } from '@/lib/cities';

type Hop = {
  id: string;
  city: string;
  country_code: string;
  received_at: number;
  reply_note: string | null;
  reveal_choice: 'pending' | 'revealed' | 'mystery';
};

type Echo = {
  id: string;
  song_title: string;
  song_artist: string | null;
  mood: string;
  sent_at: number;
};

type Group = { echo: Echo; hopsToday: Hop[]; totalRecipients: number };

export default function MinePage() {
  const [groups, setGroups] = useState<Group[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/mine');
    const data = await res.json();
    setGroups(data.mine ?? []);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, [load]);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <main className="px-5 pt-10">
      <h1 className="text-xl font-semibold">Last Echo</h1>
      <p className="mt-1 text-sm capitalize text-white/40">{today}</p>
      <p className="mt-4 text-sm text-white/60">
        Voici qui a reçu tes échos aujourd&apos;hui. Chacun a choisi : se révéler, ou rester un mystère.
      </p>

      {groups === null && <p className="mt-6 text-sm text-white/40">Chargement…</p>}

      {groups?.length === 0 && (
        <div className="card mt-6 p-6 text-center">
          <div className="mb-3 text-3xl">🎵</div>
          <p className="text-sm text-white/60">Tu n&apos;as pas encore envoyé d&apos;écho.</p>
          <Link href="/send" className="btn-primary mt-4 inline-block px-5 py-2 text-sm">
            Envoyer ton premier écho
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {groups?.map(({ echo, hopsToday, totalRecipients }) => (
          <div key={echo.id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {moodEmoji(echo.mood)} {echo.song_title}
                {echo.song_artist ? ` — ${echo.song_artist}` : ''}
              </p>
              <Link href={`/journey/${echo.id}`} className="text-xs text-white/40 underline underline-offset-2">
                Voyage →
              </Link>
            </div>
            <p className="mt-1 text-xs text-white/30">{totalRecipients} personne{totalRecipients > 1 ? 's' : ''} touchée{totalRecipients > 1 ? 's' : ''} au total</p>

            {hopsToday.length === 0 ? (
              <p className="mt-3 text-xs italic text-white/30">Personne ne l&apos;a encore reçu aujourd&apos;hui.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {hopsToday.map((hop) => (
                  <div key={hop.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      {hop.reveal_choice === 'revealed' ? (
                        <>
                          <span>👤</span>
                          <span>
                            {flagFor(hop.country_code)} {hop.city}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>🌑</span>
                          <span className="text-white/50">Quelqu&apos;un, quelque part</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-white/30">
                      {new Date(hop.received_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
