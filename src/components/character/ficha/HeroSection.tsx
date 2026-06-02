import type { ReactNode } from 'react';
import { FichaPortrait } from './FichaPortrait';

/**
 * Hero section da ficha — retrato (left) + titulo/quickfacts (right). O miolo
 * abaixo do titulo (atributos, energias, combate, etc.) e composto pela page e
 * passado via `lowerContent` — assim o layout fica flexivel sem mexer aqui.
 *
 * O retrato (`FichaPortrait`) e clicavel pro dono trocar a imagem.
 *
 * Spec: reference HTML linhas 915-1011 + 05-UI-SPEC.md §"Hero".
 */
export function HeroSection({
  characterId,
  name,
  subtitle,
  overline,
  age,
  rank,
  campaignLevel,
  tendency,
  imageUrl,
  placeholderKanji,
  canEdit,
  lowerContent,
}: {
  characterId: string;
  name: string;
  /** "A Lâmina do Gelo" ou similar — usa biography se null. */
  subtitle?: string | null;
  /** "Kekkei Genkai · Hyouton" ou similar. */
  overline?: string | null;
  age: number | null;
  rank: string;
  campaignLevel: number;
  tendency: string | null;
  imageUrl: string | null;
  /** Kanji exibido no placeholder quando `imageUrl` for null. */
  placeholderKanji?: string;
  /** Dono pode trocar o retrato clicando na caixa. */
  canEdit: boolean;
  /** Miolo da ficha abaixo do titulo (atributos, energias, combate, etc.). */
  lowerContent?: ReactNode;
}) {
  // Quebra "Nome Sobrenome" em "Nome" + "Sobrenome" pra estilizar o segundo
  // em italico (padrao da spec: "Satsuki *Yuki*").
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;

  return (
    <section className="grid gap-8 px-6 pb-10 md:grid-cols-[380px_1fr] md:gap-9 md:px-12">
      <div className="relative aspect-[2/3] self-start overflow-hidden shadow-hero">
        <FichaPortrait
          characterId={characterId}
          imageUrl={imageUrl}
          canEdit={canEdit}
          placeholderKanji={placeholderKanji}
        />
        {/* Selo 忍 — pointer-events-none pra não bloquear o clique no retrato */}
        <div className="pointer-events-none absolute right-4 top-4 z-20 flex h-14 w-14 -rotate-6 items-center justify-center border-2 border-seal bg-seal/40 backdrop-blur-sm">
          <span
            className="absolute inset-[3px] border border-[rgba(244,235,217,0.4)]"
            aria-hidden
          />
          <span className="font-jp text-[22px] font-bold text-[#f4ebd9]">忍</span>
        </div>
      </div>

      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-border pb-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            {overline ? (
              <div className="mb-2 flex items-center gap-3">
                <span className="font-display text-[10px] uppercase tracking-[0.45em] text-ice">
                  {overline}
                </span>
                <span className="h-px max-w-20 flex-1 bg-ice-deep/50" aria-hidden />
              </div>
            ) : null}
            <h1 className="font-serif text-5xl font-normal leading-[0.92] tracking-tight text-ink md:text-[68px]">
              {firstName}
              {lastName ? (
                <>
                  {' '}
                  <span className="font-light italic text-ice-bright">{lastName}</span>
                </>
              ) : null}
            </h1>
            {subtitle ? (
              <p className="mt-1.5 font-body text-[17px] italic text-ink-muted">{subtitle}</p>
            ) : null}
          </div>

          <div className="grid shrink-0 grid-cols-4 gap-5 text-right sm:grid-cols-[repeat(4,auto)]">
            {[
              ['Idade', age?.toString() ?? '—'],
              ['Posto', formatRank(rank)],
              ['NC', String(campaignLevel)],
              ['Tendencia', tendency ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="font-display text-[9px] uppercase tracking-[0.3em] text-ink-muted">
                  {label}
                </p>
                <p className="mt-0.5 font-serif text-[22px] font-medium leading-none text-ice-bright">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {lowerContent}
      </div>
    </section>
  );
}

function formatRank(rank: string): string {
  switch (rank) {
    case 'ACADEMICO':
      return 'Academico';
    case 'GENIN':
      return 'Genin';
    case 'CHUUNIN':
      return 'Chuunin';
    case 'JOUNIN':
      return 'Jounin';
    case 'ANBU':
      return 'ANBU';
    case 'KAGE':
      return 'Kage';
    default:
      return rank;
  }
}
