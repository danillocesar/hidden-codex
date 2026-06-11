import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { loadCharacterByShareToken } from '@/server/queries/characterById';
import { countSharedDiaryEntries } from '@/server/queries/diaryEntries';
import { FichaView } from '@/components/character/ficha/FichaView';
import { ToastProvider } from '@/components/ui/toast';
import { Eyebrow } from '@/components/ui/eyebrow';

/** Links de compartilhamento sao segredos — nao indexar. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Ficha publica via link de compartilhamento — `/share/[token]`.
 *
 * Rota fora do grupo `(app)` (sem auth, sem header do app). O token autoriza
 * acesso read-only: `loadCharacterByShareToken` valida o link ativo, incrementa
 * o contador e devolve o view model com `isOwner=false`, entao o `FichaView`
 * esconde todo controle de edicao.
 *
 * `ToastProvider` envolve a view por seguranca (componentes da ficha podem usar
 * `useToast` mesmo nos caminhos read-only).
 */
export default async function SharedFichaPage({ params }: { params: { token: string } }) {
  const [viewModel, diaryCount] = await Promise.all([
    loadCharacterByShareToken(params.token),
    countSharedDiaryEntries(params.token),
  ]);
  if (!viewModel) notFound();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg-deep text-ink">
        <div className="border-b border-border bg-bg-paper/70 backdrop-blur">
          <div className="mx-auto flex max-w-[1340px] items-center justify-between gap-3 px-6 py-3">
            <Image
              src="brand/hidden-codex-wordmark-transparent-no-brush.svg"
              alt="Hidden Codex"
              width={200}
              height={48}
              className="h-7 w-auto"
              unoptimized
            />
            <div className="flex items-center gap-4">
              {diaryCount > 0 ? (
                <Link
                  href={`/share/${params.token}/diary`}
                  className="inline-flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted transition-colors hover:text-ice"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  Diário
                </Link>
              ) : null}
              <Eyebrow tone="deep" size="sm">
                Ficha compartilhada · somente leitura
              </Eyebrow>
            </div>
          </div>
        </div>
        <FichaView viewModel={viewModel} />
      </div>
    </ToastProvider>
  );
}
