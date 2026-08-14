'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { moodEmoji } from '@/lib/cities';
import { flagFromCountryCode as flagFor } from '@/lib/geo';
import { useLanguage } from '@/components/LanguageProvider';
import { localeTag } from '@/lib/i18n/languages';

type Hop = {
  id: string;
  city: string;
  country_code: string;
  received_at: number;
  reply_note: string | null;
  reveal_choice: 'pending' | 'revealed' | 'mystery';
  recipient_pseudo: string | null;
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
  const { t, lang } = useLanguage();
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

  const today = new Date().toLocaleDateString(localeTag(lang), { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <main className="px-5 pt-10">
      <h1 className="text-xl font-semibold">{t.mine.title}</h1>
      <p className="mt-1 text-sm capitalize text-white/40">{today}</p>
      <p className="mt-4 text-sm text-white/60">{t.mine.subtitle}</p>

      {groups === null && <p className="mt-6 text-sm text-white/40">{t.mine.loading}</p>}

      {groups?.length === 0 && (
        <div className="card mt-6 p-6 text-center">
          <div className="mb-3 text-3xl">🎵</div>
          <p className="text-sm text-white/60">{t.mine.emptyBody}</p>
          <Link href="/send" className="btn-primary mt-4 inline-block px-5 py-2 text-sm">
            {t.mine.sendFirst}
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
                {t.mine.journey}
              </Link>
            </div>
            <p className="mt-1 text-xs text-white/30">{t.mine.totalReached(totalRecipients)}</p>

            {hopsToday.length === 0 ? (
              <p className="mt-3 text-xs italic text-white/30">{t.mine.noneToday}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {hopsToday.map((hop) => (
                  <div key={hop.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      {hop.reveal_choice === 'revealed' ? (
                        <>
                          <span>👤</span>
                          <span>
                            {hop.recipient_pseudo ? `${hop.recipient_pseudo} · ` : ''}
                            {flagFor(hop.country_code)} {hop.city}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>🌑</span>
                          <span className="text-white/50">{t.mine.someoneSomewhere}</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-white/30">
                      {new Date(hop.received_at).toLocaleTimeString(localeTag(lang), { hour: '2-digit', minute: '2-digit' })}
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
