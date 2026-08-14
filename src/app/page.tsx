'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIdentity } from '@/components/IdentityProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { localeTag } from '@/lib/i18n/languages';
import EchoMark from '@/components/EchoMark';
import AboutButton from '@/components/AboutButton';

export default function HomePage() {
  const { user, openCityPicker, openIdentityModal } = useIdentity();
  const { t, lang } = useLanguage();
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString(localeTag(lang), { hour: '2-digit', minute: '2-digit' }));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <main className="px-5 pt-14 pb-6">
      <div className="relative mb-10 flex flex-col items-center text-center">
        <div className="mb-6">
          <EchoMark size={176} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">ECHO</h1>
        <p className="mt-3 text-white/60 leading-relaxed">
          {t.home.tagline1}
          <br />
          {t.home.tagline2}
          <br />
          {t.home.tagline3}
        </p>
        <AboutButton />
      </div>

      <div className="space-y-3">
        <Link
          href="/send"
          className="btn-primary flex items-center justify-center gap-2 py-4 text-base shadow-lg shadow-echo-500/20"
        >
          {t.send.sendButton}
        </Link>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href="/inbox" className="card flex flex-col gap-1 p-4">
            <span className="text-xl">📥</span>
            <span className="text-sm font-medium">{t.home.inboxTitle}</span>
            <span className="text-xs text-white/50">{t.home.inboxSubtitle}</span>
          </Link>
          <Link href="/mine" className="card flex flex-col gap-1 p-4">
            <span className="text-xl">🌑</span>
            <span className="text-sm font-medium">{t.nav.mine}</span>
            <span className="text-xs text-white/50">{t.home.lastEchoSubtitle}</span>
          </Link>
          <Link href="/global" className="card col-span-2 flex flex-col gap-1 p-4">
            <span className="text-xl">🌍</span>
            <span className="text-sm font-medium">{t.home.globalTitle}</span>
            <span className="text-xs text-white/50">{t.home.globalSubtitle}</span>
          </Link>
        </div>
      </div>

      {user?.city && (
        <p className="mt-8 text-center text-xs text-white/30">
          {t.home.emittingFrom(user.city, time)} ·{' '}
          <button onClick={openCityPicker} className="underline underline-offset-2 hover:text-white/50">
            {t.home.change}
          </button>
        </p>
      )}
      {user && (
        <p className="mt-2 text-center text-xs text-white/30">
          <button onClick={openIdentityModal} className="underline underline-offset-2 hover:text-white/50">
            {t.home.identityLink}
          </button>
        </p>
      )}
    </main>
  );
}
