import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadCharacterByShareToken } from '@/server/queries/characterById';
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
  const viewModel = await loadCharacterByShareToken(params.token);
  if (!viewModel) notFound();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg-deep text-ink">
        <div className="border-b border-border bg-bg-paper/70 backdrop-blur">
          <div className="mx-auto flex max-w-[1340px] items-center justify-between px-6 py-3">
            <span className="font-serif text-lg font-light">
              Arcana <span className="italic text-ice-bright">Forge</span>
            </span>
            <Eyebrow tone="deep" size="sm">
              Ficha compartilhada · somente leitura
            </Eyebrow>
          </div>
        </div>
        <FichaView viewModel={viewModel} />
      </div>
    </ToastProvider>
  );
}
