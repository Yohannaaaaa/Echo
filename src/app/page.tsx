'use client';

import Link from 'next/link';
import { useIdentity } from '@/components/IdentityProvider';
import EchoMark from '@/components/EchoMark';

export default function HomePage() {
  const { user } = useIdentity();

  return (
    <main className="px-5 pt-14 pb-6">
      <div className="relative mb-10 flex flex-col items-center text-center">
        <div className="mb-6">
          <EchoMark size={112} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">ECHO</h1>
        <p className="mt-3 text-white/60 leading-relaxed">
          Tu ne publies jamais directement.
          <br />
          Tu vis un moment. L&apos;appli en fait un écho.
          <br />
          Il part dans le monde, sans profil, sans followers.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/send"
          className="btn-primary flex items-center justify-center gap-2 py-4 text-base shadow-lg shadow-echo-500/20"
        >
          🎵 SEND ECHO
        </Link>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href="/inbox" className="card flex flex-col gap-1 p-4">
            <span className="text-xl">📥</span>
            <span className="text-sm font-medium">Échos reçus</span>
            <span className="text-xs text-white/50">Des inconnus, quelque part</span>
          </Link>
          <Link href="/mine" className="card flex flex-col gap-1 p-4">
            <span className="text-xl">🌑</span>
            <span className="text-sm font-medium">Last Echo</span>
            <span className="text-xs text-white/50">Qui a reçu le tien aujourd&apos;hui</span>
          </Link>
          <Link href="/global" className="card col-span-2 flex flex-col gap-1 p-4">
            <span className="text-xl">🌍</span>
            <span className="text-sm font-medium">Global Echo du jour</span>
            <span className="text-xs text-white/50">Une question. 30 secondes. Le monde entier répond.</span>
          </Link>
        </div>
      </div>

      {user?.city && (
        <p className="mt-8 text-center text-xs text-white/30">
          Tu émets depuis {user.city}
        </p>
      )}
    </main>
  );
}
