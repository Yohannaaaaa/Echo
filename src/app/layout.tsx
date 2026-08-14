import type { Metadata } from 'next';
import './globals.css';
import { IdentityProvider } from '@/components/IdentityProvider';
import CityOnboarding from '@/components/CityOnboarding';
import IdentityModal from '@/components/IdentityModal';
import TopNav from '@/components/TopNav';

export const metadata: Metadata = {
  title: 'ECHO — un moment réel, envoyé dans le monde',
  description:
    "Tu n'publies jamais directement. Tu vis un moment, il devient un écho, et il voyage vers un inconnu quelque part dans le monde.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-night-950 text-white antialiased">
        <IdentityProvider>
          <TopNav />
          <div className="mx-auto min-h-screen max-w-md pt-16">{children}</div>
          <CityOnboarding />
          <IdentityModal />
        </IdentityProvider>
      </body>
    </html>
  );
}
