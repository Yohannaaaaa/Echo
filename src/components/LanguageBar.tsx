'use client';

import { LANGUAGES } from '@/lib/i18n/languages';
import { useLanguage } from './LanguageProvider';

export default function LanguageBar() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed top-16 left-0 right-0 z-30 border-b border-white/5 bg-night-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-md gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            aria-label={l.name}
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm transition-all ${
              l.code === lang ? 'ring-2 ring-echo-500 scale-110' : 'opacity-50 hover:opacity-90'
            }`}
          >
            {l.flag}
          </button>
        ))}
      </div>
    </div>
  );
}
