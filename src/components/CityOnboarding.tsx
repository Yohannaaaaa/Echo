'use client';

import { useState } from 'react';
import { CITIES } from '@/lib/cities';
import { useIdentity } from './IdentityProvider';

export default function CityOnboarding() {
  const { user, loading, setCity } = useIdentity();
  const [saving, setSaving] = useState(false);

  if (loading || !user || user.city) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="text-3xl">🌍</div>
        <h2 className="text-xl font-semibold">D&apos;où pars ton premier écho ?</h2>
        <p className="text-sm text-white/60">
          Pas de profil, pas de pseudo. Juste une ville, pour savoir où tes échos commencent leur voyage.
        </p>
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {CITIES.map((c) => (
            <button
              key={c.name}
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await setCity(c.name);
                setSaving(false);
              }}
              className="btn-ghost px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
