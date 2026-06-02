import { cn } from '@/lib/utils/cn';

/**
 * Header fixo do topo da ficha — grid 3 colunas: cla (esq) · titulo (centro)
 * · vila (dir). Imagem de fundo cobre toda a area com opacidade baixa.
 *
 * Spec: 05-UI-SPEC.md §"Ficha" + reference HTML linhas 904-911.
 */
export function FichaHeader({
  clanName,
  clanKanji,
  villageName,
  villageKanji,
  backgroundImageUrl,
}: {
  clanName: string | null;
  clanKanji?: string;
  villageName: string | null;
  villageKanji?: string;
  backgroundImageUrl?: string | null;
}) {
  return (
    <header
      className={cn(
        'relative mb-8 overflow-hidden border-b border-border px-6 pb-7 pt-10 md:px-12',
        'before:absolute before:inset-0 before:bg-cover before:bg-[center_40%] before:bg-no-repeat before:opacity-25',
        'after:absolute after:inset-0 after:bg-gradient-to-b after:from-[rgba(10,11,14,0.4)] after:to-bg-deep',
      )}
      style={
        backgroundImageUrl
          ? {
              ['--ficha-header-bg' as string]: `url(${backgroundImageUrl})`,
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
            }
          : undefined
      }
    >
      <div className="relative z-10 grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="font-jp text-[11px] tracking-[0.1em] text-ink-muted md:text-right">
          Clã{' '}
          <span className="ml-1.5 text-ice">
            {clanKanji ? <span className="mr-1">{clanKanji}</span> : null}
            {clanName ?? '—'}
          </span>
        </div>
        <div className="justify-self-center border-y border-border px-4 py-1.5 font-display text-[11px] uppercase tracking-[0.5em] text-ice">
          Ficha de Personagem
        </div>
        <div className="font-jp text-[11px] tracking-[0.1em] text-ink-muted">
          Vila{' '}
          <span className="ml-1.5 text-ice">
            {villageKanji ? <span className="mr-1">{villageKanji}</span> : null}
            {villageName ?? '—'}
          </span>
        </div>
      </div>
    </header>
  );
}
