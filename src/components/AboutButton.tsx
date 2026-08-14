'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';

export default function AboutButton() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-xs text-white/40 underline underline-offset-2 hover:text-white/60"
      >
        {t.about.trigger}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4 text-left">
            <div className="flex items-start justify-between">
              <div className="text-3xl">🌙</div>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-white/40 hover:text-white/70"
                aria-label={t.about.close}
              >
                ✕
              </button>
            </div>

            <h2 className="text-xl font-semibold">{t.about.title}</h2>
            <p className="text-sm text-white/70 leading-relaxed">{t.about.body}</p>

            <h3 className="text-sm font-semibold text-white/90">{t.about.anonymousTitle}</h3>
            <ul className="space-y-2 text-sm text-white/60 leading-relaxed">
              <li>• {t.about.point1}</li>
              <li>• {t.about.point2}</li>
              <li>• {t.about.point3}</li>
              <li>• {t.about.point4}</li>
            </ul>

            <button onClick={() => setOpen(false)} className="btn-primary w-full py-3 mt-2">
              {t.about.gotIt}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
