import type { Metadata, Viewport } from 'next';
import { Cinzel, Cormorant_Garamond, EB_Garamond, Shippori_Mincho } from 'next/font/google';
import './globals.css';

/**
 * Quatro fontes específicas, cada uma com papel definido na spec visual.
 * Ver `arcana-forge-spec/08-VISUAL-REFERENCE.md` §"Tipografia".
 *
 * Expostas como CSS vars (--font-*) consumidas pelo tailwind.config.ts.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-eb-garamond',
  display: 'swap',
});

const shippori = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-shippori',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cinzel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hidden Codex',
  description: 'Fichas de personagem para o RPG Shinobi no Sho 4.1b',
  applicationName: 'Hidden Codex',
  authors: [{ name: 'Hidden Codex contributors' }],
};

export const viewport: Viewport = {
  themeColor: '#0a0b0e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${ebGaramond.variable} ${shippori.variable} ${cinzel.variable}`}
    >
      <body className="min-h-screen bg-bg-deep text-ink">{children}</body>
    </html>
  );
}
