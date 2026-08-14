'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIdentity } from '@/components/IdentityProvider';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const { refresh } = useIdentity();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (password.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setBusy(true);
    setError(null);
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? 'Erreur inconnue.');
    await refresh();
    setDone(true);
  }

  if (!token) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-4xl">🔗</div>
        <p className="text-white/60">Lien invalide. Refais une demande de réinitialisation depuis l&apos;app.</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="text-xl font-semibold">Mot de passe changé</h1>
        <p className="mt-2 text-white/60">Tu es connecté(e) sur cet appareil.</p>
        <button onClick={() => router.push('/')} className="btn-primary mt-6 px-6 py-3">
          Retour à l&apos;accueil
        </button>
      </main>
    );
  }

  return (
    <main className="px-5 pt-14">
      <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-white/60">Choisis un nouveau mot de passe pour ton identité ECHO.</p>

      <div className="mt-6 space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe (8 caractères min.)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirme le mot de passe"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          disabled={!password || !confirm || busy}
          onClick={submit}
          className="btn-primary w-full py-3.5 disabled:opacity-50"
        >
          {busy ? 'Enregistrement…' : 'Changer le mot de passe'}
        </button>
      </div>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
