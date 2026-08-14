'use client';

import { useState } from 'react';
import { useIdentity } from './IdentityProvider';

function formatCode(code: string) {
  return code.match(/.{1,4}/g)?.join('-') ?? code;
}

export default function IdentityModal() {
  const { user, identityModalOpen, closeIdentityModal, restore } = useIdentity();
  const [mode, setMode] = useState<'view' | 'restore'>('view');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!identityModalOpen || !user) return null;

  async function handleRestore() {
    if (!input.trim()) return;
    setBusy(true);
    setError(null);
    const ok = await restore(input);
    setBusy(false);
    if (!ok) {
      setError('Ce code ne correspond à aucune identité.');
      return;
    }
    setInput('');
    setMode('view');
    closeIdentityModal();
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(user!.recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — the code is still visible to copy by hand
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="text-3xl">🔑</div>
          <button
            onClick={closeIdentityModal}
            className="text-sm text-white/40 hover:text-white/70"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {mode === 'view' ? (
          <>
            <h2 className="text-xl font-semibold">Ton identité</h2>
            <p className="text-sm text-white/60">
              Pas d&apos;email, pas de mot de passe. Juste ce code, à garder pour retrouver tes échos si tu changes
              de téléphone ou vides ton navigateur.
            </p>
            <button
              onClick={copyCode}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center font-mono text-lg tracking-widest hover:border-echo-500"
            >
              {formatCode(user.recoveryCode)}
            </button>
            <p className="text-center text-xs text-white/30">{copied ? 'Copié !' : 'Touche pour copier'}</p>
            <button onClick={() => setMode('restore')} className="btn-ghost w-full py-3 text-sm">
              J&apos;ai déjà un code
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Restaurer une identité</h2>
            <p className="text-sm text-white/60">
              Colle le code que tu avais noté. Ça remplacera l&apos;identité actuelle de cet appareil.
            </p>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono tracking-widest outline-none placeholder:text-white/20 focus:border-echo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              disabled={!input.trim() || busy}
              onClick={handleRestore}
              className="btn-primary w-full py-3.5 disabled:opacity-50"
            >
              {busy ? 'Vérification…' : 'Restaurer'}
            </button>
            <button onClick={() => setMode('view')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              Retour
            </button>
          </>
        )}
      </div>
    </div>
  );
}
