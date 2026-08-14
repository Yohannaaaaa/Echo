'use client';

import { useState } from 'react';
import { useIdentity } from './IdentityProvider';
import { useLanguage } from './LanguageProvider';

type Mode = 'view' | 'login' | 'password' | 'pseudo' | 'forgot';

export default function IdentityModal() {
  const { user, identityModalOpen, closeIdentityModal, signup, login, setPseudo } = useIdentity();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('view');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudoInput, setPseudoInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  if (!identityModalOpen || !user) return null;

  function reset() {
    setMode('view');
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
    if (!pseudoInput.trim() || !email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const result = await signup(email, password);
    if (!result.ok) {
      setBusy(false);
      return setError(result.error);
    }
    const pseudoResult = await setPseudo(pseudoInput);
    if (!pseudoResult.ok) {
      setBusy(false);
      return setError(pseudoResult.error);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="text-3xl">🔑</div>
          <button onClick={close} className="text-sm text-white/40 hover:text-white/70" aria-label={t.about.close}>
            ✕
          </button>
        </div>

        {mode === 'view' && (
          <>
            <h2 className="text-xl font-semibold">{t.identity.yourIdentity}</h2>
            <p className="text-sm text-white/60">{t.identity.noPublicProfile}</p>

            {user.email ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">
                    {t.identity.pseudoLabel} {user.pseudo ? <span className="text-white">· {user.pseudo}</span> : ''}
                  </span>
                  <button onClick={() => setMode('pseudo')} className="text-xs underline underline-offset-2 text-white/50">
                    {user.pseudo ? t.identity.editPseudo : t.identity.choosePseudo}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">
                    {t.identity.account} <span className="text-white">· {user.email}</span>
                  </span>
                </div>
              </div>
            ) : (
              <button onClick={() => setMode('password')} className="btn-ghost w-full py-3 text-sm">
                {t.identity.createAccountButton}
              </button>
            )}

            <button onClick={() => setMode('login')} className="btn-ghost w-full py-3 text-sm">
              {t.identity.alreadyHaveAccount}
            </button>
          </>
        )}

        {mode === 'pseudo' && (
          <>
            <h2 className="text-xl font-semibold">{t.identity.choosePseudoTitle}</h2>
            <p className="text-sm text-white/60">{t.identity.pseudoExplain}</p>
            <input
              value={pseudoInput}
              onChange={(e) => setPseudoInput(e.target.value.slice(0, 24))}
              placeholder={t.identity.pseudoPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={!pseudoInput.trim() || busy} onClick={handleSetPseudo} className="btn-primary w-full py-3.5 disabled:opacity-50">
              {busy ? t.identity.saving : t.identity.save}
            </button>
            <button onClick={() => setMode('view')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              {t.identity.back}
            </button>
          </>
        )}

        {mode === 'password' && (
          <>
            <h2 className="text-xl font-semibold">{t.identity.createAccountTitle}</h2>
            <p className="text-sm text-white/60">{t.identity.createAccountExplain}</p>
            <input
              value={pseudoInput}
              onChange={(e) => setPseudoInput(e.target.value.slice(0, 24))}
              placeholder={t.identity.pseudoLabel}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.identity.emailPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.identity.passwordPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              disabled={!pseudoInput.trim() || !email.trim() || !password || busy}
              onClick={handleSignup}
              className="btn-primary w-full py-3.5 disabled:opacity-50"
            >
              {busy ? t.identity.creating : t.identity.createAccount}
            </button>
            <button onClick={() => setMode('view')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              {t.identity.back}
            </button>
          </>
        )}

        {mode === 'login' && (
          <>
            <h2 className="text-xl font-semibold">{t.identity.loginTitle}</h2>
            <p className="text-sm text-white/60">{t.identity.loginExplain}</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.identity.emailPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.identity.passwordPlaceholderShort}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              disabled={!email.trim() || !password || busy}
              onClick={handleLogin}
              className="btn-primary w-full py-3.5 disabled:opacity-50"
            >
              {busy ? t.identity.loggingIn : t.identity.login}
            </button>
            <button
              onClick={() => {
                setError(null);
                setMode('forgot');
              }}
              className="w-full text-center text-xs text-white/40 underline underline-offset-2"
            >
              {t.identity.forgotPassword}
            </button>
            <button onClick={() => setMode('view')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              {t.identity.back}
            </button>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h2 className="text-xl font-semibold">{t.identity.forgotTitle}</h2>
            {forgotSent ? (
              <p className="text-sm text-white/60">{t.identity.forgotSentMessage}</p>
            ) : (
              <>
                <p className="text-sm text-white/60">{t.identity.forgotExplain}</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.identity.emailPlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-echo-500"
                />
                <button
                  disabled={!email.trim() || busy}
                  onClick={handleForgot}
                  className="btn-primary w-full py-3.5 disabled:opacity-50"
                >
                  {busy ? t.identity.sendingLink : t.identity.sendLink}
                </button>
              </>
            )}
            <button onClick={() => setMode('login')} className="w-full text-center text-xs text-white/40 underline underline-offset-2">
              {t.identity.back}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
