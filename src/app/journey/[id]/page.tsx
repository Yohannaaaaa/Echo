'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { moodEmoji } from '@/lib/cities';
import { flagFromCountryCode as flagFor } from '@/lib/geo';
import { useLanguage } from '@/components/LanguageProvider';
import { localeTag } from '@/lib/i18n/languages';

type Hop = {
  id: string;
  parent_hop_id: string | null;
  is_origin: number;
  is_bot: number;
  chain_length: number;
  city: string;
  country_code: string;
  received_at: number;
  reply_note: string | null;
  reveal_choice: 'pending' | 'revealed' | 'mystery';
  recipient_pseudo: string | null;
  isMine: boolean;
};

type Echo = {
  id: string;
  song_title: string;
  song_artist: string | null;
  song_url: string | null;
  mood: string;
  note: string | null;
  sent_at: number;
  origin_city: string;
  origin_country_code: string;
};

function buildBranches(hops: Hop[]): Hop[][] {
  const byParent = new Map<string | null, Hop[]>();
  for (const h of hops) {
    const key = h.parent_hop_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(h);
  }
  const origin = hops.find((h) => h.is_origin);
  if (!origin) return [];

  const paths: Hop[][] = [];
  function walk(hop: Hop, trail: Hop[]) {
    const nextTrail = [...trail, hop];
    const children = byParent.get(hop.id) ?? [];
    if (children.length === 0) {
      paths.push(nextTrail);
      return;
    }
    for (const child of children) walk(child, nextTrail);
  }
  walk(origin, []);
  return paths;
}

export default function JourneyPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const [echo, setEcho] = useState<Echo | null>(null);
  const [hops, setHops] = useState<Hop[] | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/journey/${params.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setEcho(data.echo);
    setHops(data.hops);
  }, [params.id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 9000);
    return () => clearInterval(interval);
  }, [load]);

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

  if (!echo || !hops) {
    return (
      <main className="px-5 pt-10">
        <p className="text-sm text-white/40">{t.journey.loading}</p>
      </main>
    );
  }

  const paths = buildBranches(hops);
  const uniqueTravelers = hops.filter((h) => !h.is_origin).length;

  return (
    <main className="px-5 pt-10">
      <div className="mb-1 text-xs uppercase tracking-widest text-white/30">
        {t.journey.echoLabel(echo.id.slice(0, 6).toUpperCase())}
      </div>
      <h1 className="text-lg font-semibold">
        {echo.song_title}
        {echo.song_artist ? ` — ${echo.song_artist}` : ''}
      </h1>
      <p className="mt-1 text-sm text-white/50">
        {moodEmoji(echo.mood)} {t.journey.sentFrom} {flagFor(echo.origin_country_code)} {echo.origin_city}
      </p>
      {echo.song_url && (
        <a
          href={echo.song_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-echo-400 underline underline-offset-2"
        >
          {t.journey.listenLink}
        </a>
      )}
      <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-white/40">
        {uniqueTravelers === 0 ? t.journey.notDiscovered : t.journey.discoveredBy(uniqueTravelers)}
      </p>

      <div className="mt-8 space-y-8">
        {paths.map((path, pi) => (
          <div key={pi} className="relative pl-6">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-echo-500/60 to-glow-400/20" />
            {path.map((hop, hi) => (
              <div key={hop.id} className="relative mb-6 last:mb-0">
                <div
                  className={`absolute -left-[26px] top-0.5 h-3.5 w-3.5 rounded-full border-2 ${
                    hop.is_origin
                      ? 'border-glow-400 bg-glow-400'
                      : 'border-echo-500 bg-night-950'
                  }`}
                />
                <div className="text-sm">
                  <span className="font-medium">
                    {flagFor(hop.country_code)} {hop.city}
                  </span>
                  {hop.is_origin ? (
                    <span className="ml-2 text-xs text-glow-400">{t.journey.startingPoint}</span>
                  ) : (
                    <span className="ml-2 text-xs text-white/30">
                      {new Date(hop.received_at).toLocaleString(localeTag(lang))}
                    </span>
                  )}
                </div>
                {!hop.is_origin && (
                  <div className="mt-0.5 text-xs text-white/40">
                    {hop.reveal_choice === 'revealed'
                      ? `👤 ${hop.recipient_pseudo ?? t.journey.identityRevealed}`
                      : `🌑 ${t.journey.staysMystery}`}
                    {hop.is_bot ? '' : ` · ${t.journey.realPerson}`}
                  </div>
                )}
                {hop.reply_note && <p className="mt-1 text-xs text-white/60">💬 « {hop.reply_note } »</p>}
                {!hop.is_origin && hop.isMine && !hop.reply_note && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={replyDrafts[hop.id] ?? ''}
                      onChange={(e) =>
                        setReplyDrafts((d) => ({ ...d, [hop.id]: e.target.value.slice(0, 280) }))
                      }
                      placeholder={t.inbox.replyPlaceholder}
                      className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none placeholder:text-white/30 focus:border-echo-500"
                    />
                    <button
                      disabled={busy === hop.id || !(replyDrafts[hop.id] ?? '').trim()}
                      onClick={() => sendReply(hop.id)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      {t.inbox.send}
                    </button>
                  </div>
                )}
                {hi === path.length - 1 && !hop.is_origin && hop.chain_length < 6 && (
                  <p className="mt-1 text-xs italic text-white/25">{t.journey.stillTraveling}</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
