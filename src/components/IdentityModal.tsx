'use client';

import { useState } from 'react';
import { useIdentity } from './IdentityProvider';

function formatCode(code: string) {
  return code.match(/.{1,4}/g)?.join('-') ?? code;
}

type Mode = 'view' | 'restoreCode' | 'login' | 'password' | 'pseudo' | 'forgot';

export default function IdentityModal() {
  const { user, identityModalOpen, closeIdentityModal, restore, signup, login, setPseudo } = useIdentity();
  const [mode, setMode] = useState<Mode>('view');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudoInput, setPseudoInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  if (!identityModalOpen || !user) return null;

  function reset() {
    setMode('view');
    setCode('');
    setEmail('');
    setPassword('');
    setPseudoInput('');
    setError(null);
    setForgotSent(false);
  }

  function close() {
    reset();
    closeIdentityModal();
  }

  async function handleRestoreCode() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const ok = await restore(code);
    setBusy(false);
    if (!ok) return setError('Ce code ne correspond à aucune identité.');
    close();
  }

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    close();
  }

  async function handleSignup() {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const result = await signup(email, password);
    if (!result.ok) {
      setBusy(false);
      return setError(result.error);
    }
    if (pseudoInput.trim()) {
      const pseudoResult = await setPseudo(pseudoInput);
      if (!pseudoResult.ok) {
        setBusy(false);
        return setError(pseudoResult.error);
      }
    }
    setBusy(false);
    reset();
  }

  async function handleForgot() {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    setForgotSent(true);
  }

  async function handleSetPseudo() {
    if (!pseudoInput.trim()) return;
    setBusy(true);
    setError(null);
    const result = await setPseudo(pseudoInput);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    reset();
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
          <button onClick={close} className="text-sm text-white/40 hover:text-white/70" aria-label="Fermer">
            ✕
          </button>
        </div>

        {mode === 'view' && (
          <>
            <h2 className="text-xl font-semibold">Ton identité</h2>
            <p className="text-sm text-white/60">
              Pas de profil public. Ce code (ou un email + mot de passe si tu préfères) permet juste de retrouver
              tes échos ailleurs.
            </p>
            <button
              onClick={copyCode}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center font-mono text-lg tracking-widest hover:border-echo-500"
            >
              {formatCode(user.recoveryCode)}
            </button>
            <p className="text-center text-xs text-white/30">{copied ? 'Copié !' : 'Touche pour copier'}</p>

            {user.email ? (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-white/60">
                    Pseudo {user.pseudo ? <span className="text-white">· {user.pseudo}</span> : ''}
                  </span>
                  <button onClick={() => setMode('pseudo')} className="text-xs underline underline-offset-2 text-white/50">
                    {user.pseudo ? 'modifier' : 'en choisir un'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">
                    Compte <span className="text-white">· {user.email}</span>
                  </span>
                </div>
              </div>
            ) : (
              <button onClick={() => setMode('password')} className="btn-ghost w-full py-3 text-sm">
                Créer un compte (pseudo + email + mot de passe)
              </button>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => setMode('restoreCode')} className="btn-ghost w-full py-3 text-sm">
                J&apos;ai un code de récupération
              </button>
              <button onClick={() => setMode('login')} className="btn-ghost w-full py-3 text-sm">
                J&apos;ai un compte (email + mot de passe)
              </button>
            </div>
          </>
        )}

        {mode === 'pseudo' && (
          <>
            <h2 className="text-xl font-semibold">Choisir un pseudonyme</h2>
            <p className="text-sm text-white/60">
              Visible uniquement par toi, sauf si tu choisis de te révéler à quelqu&apos;un — dans ce cas, il
              remplace l&apos;affichage générique.
            </p>
            <input
              value={pseudoInput}
              onChange={(e) => setPseudoInput(e.target.value.slice(0, 24))}
              placeholder="Ton pseudo"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={!pseudoInput.trim() || busy} onClick={handleSetPseudo} className="btn-primary w-full py-3.5 disabled:opacity-50">
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={() => setMode('view')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              Retour
            </button>
          </>
        )}

        {mode === 'password' && (
          <>
            <h2 className="text-xl font-semibold">Créer un compte</h2>
            <p className="text-sm text-white/60">
              Toujours pas de profil public — juste un second moyen de retrouver tes échos, en plus du code. Le
              pseudo ne s&apos;affiche que si tu choisis de te révéler à quelqu&apos;un.
            </p>
            <input
              value={pseudoInput}
              onChange={(e) => setPseudoInput(e.target.value.slice(0, 24))}
              placeholder="Pseudo (optionnel)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe (8 caractères min.)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              disabled={!email.trim() || !password || busy}
              onClick={handleSignup}
              className="btn-primary w-full py-3.5 disabled:opacity-50"
            >
              {busy ? 'Création…' : 'Créer le compte'}
            </button>
            <button onClick={() => setMode('view')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              Retour
            </button>
          </>
        )}

        {mode === 'login' && (
          <>
            <h2 className="text-xl font-semibold">Se connecter</h2>
            <p className="text-sm text-white/60">Avec l&apos;email et le mot de passe que tu avais configurés.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              disabled={!email.trim() || !password || busy}
              onClick={handleLogin}
              className="btn-primary w-full py-3.5 disabled:opacity-50"
            >
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
            <button
              onClick={() => {
                setError(null);
                setMode('forgot');
              }}
              className="w-full text-center text-xs text-white/40 underline underline-offset-2"
            >
              Mot de passe oublié ?
            </button>
            <button onClick={() => setMode('view')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              Retour
            </button>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h2 className="text-xl font-semibold">Mot de passe oublié</h2>
            {forgotSent ? (
              <p className="text-sm text-white/60">
                Si un compte existe avec cet email, un lien de réinitialisation vient d&apos;être envoyé — valable
                60 minutes.
              </p>
            ) : (
              <>
                <p className="text-sm text-white/60">On t&apos;envoie un lien pour en choisir un nouveau.</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
                />
                <button
                  disabled={!email.trim() || busy}
                  onClick={handleForgot}
                  className="btn-primary w-full py-3.5 disabled:opacity-50"
                >
                  {busy ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </>
            )}
            <button onClick={() => setMode('login')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              Retour
            </button>
          </>
        )}

        {mode === 'restoreCode' && (
          <>
            <h2 className="text-xl font-semibold">Restaurer avec un code</h2>
            <p className="text-sm text-white/60">
              Colle le code que tu avais noté. Ça remplacera l&apos;identité actuelle de cet appareil.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono tracking-widest outline-none placeholder:text-white/20 focus:border-echo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={!code.trim() || busy} onClick={handleRestoreCode} className="btn-primary w-full py-3.5 disabled:opacity-50">
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
