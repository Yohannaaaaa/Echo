'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { moodEmoji } from '@/lib/cities';
import { useLanguage } from '@/components/LanguageProvider';
import { localeTag } from '@/lib/i18n/languages';

type InboxItem = {
  hopId: string;
  echoId: string;
  chainLength: number;
  receivedAt: number;
  replyNote: string | null;
  revealChoice: 'pending' | 'revealed' | 'mystery';
  city: string;
  countryCode: string;
  songTitle: string;
  songArtist: string | null;
  songUrl: string | null;
  mood: string;
  note: string | null;
  sentAt: number;
  originCity: string;
  originCountryCode: string;
  fromCity: string | null;
  fromCountryCode: string | null;
  fromNote: string | null;
};

export default function InboxPage() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  function timeOf(ts: number) {
    return new Date(ts).toLocaleTimeString(localeTag(lang), { hour: '2-digit', minute: '2-digit' });
  }

  const load = useCallback(async () => {
    const res = await fetch('/api/inbox');
    const data = await res.json();
    setItems(data.inbox ?? []);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 9000);
    return () => clearInterval(interval);
  }, [load]);

  async function reveal(hopId: string, choice: 'revealed' | 'mystery') {
    setBusy(hopId);
    await fetch('/api/hop/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hopId, choice }),
    });
    await load();
    setBusy(null);
  }

  async function sendReply(hopId: string) {
    const note = (replyDrafts[hopId] ?? '').trim();
    if (!note) return;
    setBusy(hopId);
    await fetch('/api/hop/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hopId, note }),
    });
    setReplyDrafts((d) => ({ ...d, [hopId]: '' }));
    await load();
    setBusy(null);
  }

  return (
    <main className="px-5 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.inbox.title}</h1>
        <button onClick={load} className="btn-ghost px-3 py-1.5 text-xs">
          {t.inbox.refresh}
        </button>
      </div>

      {items === null && <p className="text-sm text-white/40">{t.inbox.loading}</p>}

      {items?.length === 0 && (
        <div className="card p-6 text-center">
          <div className="mb-3 text-3xl">👂</div>
          <p className="text-sm text-white/60">{t.inbox.emptyBody}</p>
        </div>
      )}

      <div className="space-y-4">
        {items?.map((item) => (
          <div key={item.hopId} className="card p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/40">
              <span>{moodEmoji(item.mood)}</span>
              <span>{t.inbox.receivedAt(timeOf(item.receivedAt))}</span>
              <span>·</span>
              <span>{t.inbox.steps(item.chainLength - 1)}</span>
            </div>

            <p className="text-sm leading-relaxed text-white/90">
              {t.inbox.someoneListening}{' '}
              <span className="font-medium">
                « {item.songTitle}
                {item.songArtist ? ` — ${item.songArtist}` : ''} »
              </span>{' '}
              {t.inbox.at(timeOf(item.sentAt))}
            </p>

            {item.songUrl && (
              <a
                href={item.songUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-echo-400 underline underline-offset-2"
              >
                {t.inbox.listenLink}
              </a>
            )}

            {item.note && <p className="mt-2 text-sm text-white/60">💬 « {item.note} »</p>}

            {item.fromNote && (
              <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50">
                {t.inbox.onTheWay} « {item.fromNote} »
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <input
                value={replyDrafts[item.hopId] ?? ''}
                onChange={(e) => setReplyDrafts((d) => ({ ...d, [item.hopId]: e.target.value.slice(0, 280) }))}
                placeholder={t.inbox.replyPlaceholder}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-white/30 focus:border-echo-500"
              />
              <button
                disabled={busy === item.hopId || !(replyDrafts[item.hopId] ?? '').trim()}
                onClick={() => sendReply(item.hopId)}
                className="btn-primary px-4 py-2 text-sm"
              >
                {t.inbox.send}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex gap-2 text-xs">
                <button
                  disabled={busy === item.hopId}
                  onClick={() => reveal(item.hopId, 'revealed')}
                  className={`rounded-full px-3 py-1 ${
                    item.revealChoice === 'revealed' ? 'bg-echo-500/20 text-echo-400' : 'bg-white/5 text-white/40'
                  }`}
                >
                  {t.inbox.revealMe}
                </button>
                <button
                  disabled={busy === item.hopId}
                  onClick={() => reveal(item.hopId, 'mystery')}
                  className={`rounded-full px-3 py-1 ${
                    item.revealChoice === 'mystery' || item.revealChoice === 'pending'
                      ? 'bg-echo-500/20 text-echo-400'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  {t.inbox.stayMystery}
                </button>
              </div>
              <Link href={`/journey/${item.echoId}`} className="text-xs text-white/40 underline underline-offset-2">
                {t.inbox.seeJourney}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
