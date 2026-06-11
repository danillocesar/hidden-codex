import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { loadDiaryEntriesByShareToken } from '@/server/queries/diaryEntries';
import { DiaryReader } from '@/components/character/diary/DiaryReader';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';

/** Links de compartilhamento sao segredos — nao indexar. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Diario publico via link de compartilhamento — `/share/[token]/diary`.
 *
 * Mesma credencial da ficha compartilhada (o token). Acesso de LEITURA: carrega
 * todas as entradas nao-deletadas e renderiza em modo read-only. Rota fora do
 * grupo `(app)` (sem auth). 404 se o token for invalido/revogado/expirado.
 */
export default async function SharedDiaryPage({ params }: { params: { token: string } }) {
  const data = await loadDiaryEntriesByShareToken(params.token);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-bg-deep text-ink">
      <div className="border-b border-border bg-bg-paper/70 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3 px-6 py-3">
          <Link
            href={`/share/${params.token}`}
            className="inline-flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted transition-colors hover:text-ice"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Voltar à ficha
          </Link>
          <Eyebrow tone="deep" size="sm">
            Diário · somente leitura
          </Eyebrow>
        </div>
      </div>

      <main className="mx-auto max-w-[900px] px-6 py-10">
        <header className="mb-8">
          <Eyebrow tone="deep" size="sm" as="p" className="tracking-[0.4em]">
            Diário de campanha
          </Eyebrow>
          <Heading level={1} className="mt-1">
            {data.characterName}
          </Heading>
        </header>

        <DiaryReader entries={data.entries} />
      </main>
    </div>
  );
}
