import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';

import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Deed Shield',
  description: 'Pre-recording verification simulator for RON bundles.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body>
        <main>
          <header>
            <div>
              <div className="badge">Deed Shield</div>
              <h1>Verification Studio</h1>
              <p className="muted">Simulate RON verification, receipts, and anchoring.</p>
            </div>
            <nav>
              <Link href="/verify">Verify</Link>
              <Link href="/receipts">Receipts</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
