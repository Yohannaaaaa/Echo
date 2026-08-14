'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EchoMark from './EchoMark';
import { useLanguage } from './LanguageProvider';

export default function TopNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    { href: '/', label: t.nav.home, icon: null },
    { href: '/send', label: t.nav.send, icon: '🎵' },
    { href: '/inbox', label: t.nav.inbox, icon: '📥' },
    { href: '/mine', label: t.nav.mine, icon: '🌑' },
    { href: '/global', label: t.nav.global, icon: '🌍' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-night-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map((item) => {
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
