'use client';

import { useEffect, useRef, useState } from 'react';
import { flagFor } from '@/lib/cities';

type Question = { id: string; question_date: string; text: string };
type FeedItem = { city: string; countryCode: string; text: string; createdAt: number; isBot: number };

const TIMER_SECONDS = 30;

export default function GlobalPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [responded, setResponded] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [text, setText] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerStarted = useRef(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/global');
      const data = await res.json();
      setQuestion(data.question);
      setResponded(data.responded);
      setFeed(data.feed ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!question || responded || timerStarted.current) return;
    timerStarted.current = true;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [question, responded]);

  async function submit() {
    if (!text.trim() || expired) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? 'Erreur.');
      return;
    }
    setResponded(true);
    setFeed(data.feed ?? []);
  }

  if (!question) {
    return (
      <main className="px-5 pt-10">
        <p className="text-sm text-white/40">Chargement de la question du jour…</p>
      </main>
    );
  }

  return (
    <main className="px-5 pt-10">
      <div className="mb-1 text-xs uppercase tracking-widest text-white/30">Global Echo · aujourd&apos;hui</div>
      <h1 className="text-xl font-semibold leading-snug">{question.text}</h1>

      {!responded && !expired && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-white/40">Tu as 30 secondes.</span>
            <span className={`text-sm font-mono ${secondsLeft <= 10 ? 'text-red-400' : 'text-white/60'}`}>
              0:{secondsLeft.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-echo-500 to-glow-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsLeft / TIMER_SECONDS) * 100}%` }}
            />
          </div>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 240))}
            placeholder="Réponds honnêtement, personne ne saura que c'est toi…"
            rows={4}
            className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            disabled={!text.trim() || submitting}
            onClick={submit}
            className="btn-primary mt-3 w-full py-3.5"
          >
            {submitting ? 'Envoi…' : 'Envoyer dans le monde'}
          </button>
        </div>
      )}

      {expired && !responded && (
        <div className="card mt-6 p-6 text-center">
          <div className="mb-2 text-3xl">⏳</div>
          <p className="text-sm text-white/60">Temps écoulé pour aujourd&apos;hui. Reviens demain.</p>
        </div>
      )}

      {responded && (
        <>
          <p className="mt-6 mb-3 text-sm text-white/40">
            Ta réponse est mêlée à celles du monde entier. Fragments, sans followers, sans influenceurs :
          </p>
          <div className="space-y-3">
            {feed.map((item, i) => (
              <div key={i} className="card p-4">
                <p className="text-sm leading-relaxed">
                  {flagFor(item.countryCode)} « {item.text} »
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
