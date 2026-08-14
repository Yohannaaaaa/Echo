'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EchoMark from './EchoMark';

const ITEMS = [
  { href: '/', label: 'Accueil', icon: null },
  { href: '/send', label: 'Envoyer', icon: '🎵' },
  { href: '/inbox', label: 'Reçus', icon: '📥' },
  { href: '/mine', label: 'Last Echo', icon: '🌑' },
  { href: '/global', label: 'Global', icon: '🌍' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-night-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                active ? 'text-echo-400' : 'text-white/50'
              }`}
            >
              {item.icon ? (
                <span className="text-lg">{item.icon}</span>
              ) : (
                <EchoMark size={20} animated={false} />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
