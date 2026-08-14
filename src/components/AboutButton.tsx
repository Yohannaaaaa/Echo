'use client';

import { useState } from 'react';

export default function AboutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-xs text-white/40 underline underline-offset-2 hover:text-white/60"
      >
        ℹ️ Pourquoi cette appli, et pourquoi c&apos;est anonyme
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4 text-left">
            <div className="flex items-start justify-between">
              <div className="text-3xl">🌙</div>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-white/40 hover:text-white/70"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <h2 className="text-xl font-semibold">Le but d&apos;ECHO</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Tu ne publies jamais rien directement. Tu vis un moment — une chanson, une heure, une humeur — et
              l&apos;appli en fait un <span className="text-white">écho</span> : un fragment envoyé à un inconnu,
              quelque part dans le monde. Pas de fil d&apos;actualité, pas de likes, pas de mise en scène.
            </p>

            <h3 className="text-sm font-semibold text-white/90">C&apos;est anonyme, vraiment</h3>
            <ul className="space-y-2 text-sm text-white/60 leading-relaxed">
              <li>• Aucun profil, aucun pseudo, aucune photo. Personne ne voit qui a envoyé un écho.</li>
              <li>• Ton identité tient dans un cookie, sans profil visible par les autres. Un compte (email + mot de passe) reste optionnel, juste pour la retrouver ailleurs.</li>
              <li>• Quand quelqu&apos;un reçoit ton écho, c&apos;est <span className="text-white">lui</span> qui choisit de rester un mystère 🌑 ou de se révéler 👤 — jamais l&apos;inverse.</li>
              <li>• Ta ville est détectée pour situer le voyage de l&apos;écho sur la carte, jamais ton adresse précise — et tu peux la changer ou la masquer à tout moment.</li>
            </ul>

            <button onClick={() => setOpen(false)} className="btn-primary w-full py-3 mt-2">
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
