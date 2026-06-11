'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { DashboardCharacter } from '@/server/queries/userCharacters';

/**
 * Card de personagem no dashboard. O card inteiro e um link pra ficha (overlay
 * absoluto); o botao de apagar fica acima do overlay (z maior) e dispara o
 * fluxo de confirmacao no client pai.
 */
export function CharacterCard({
  character,
  onRequestDelete,
}: {
  character: DashboardCharacter;
  onRequestDelete: (character: DashboardCharacter) => void;
}) {
  const origin = [character.villageName, character.clanName].filter(Boolean).join(' · ');

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-bg-card transition-colors hover:border-border-strong">
      <Link
        href={`/characters/${character.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Abrir ${character.name}`}
      />

      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-bg-card-2 to-bg-deep">
        {character.portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={character.portraitUrl}
            alt={`Retrato de ${character.name}`}
            className="h-full w-full object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-jp text-6xl text-ice-deep/40" aria-hidden>
              忍
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-deep via-bg-deep/80 to-transparent p-4 pt-12">
          {character.kekkeiGenkaiName ? (
            <p className="mb-1 font-display text-[9px] uppercase tracking-[0.3em] text-ice">
              {character.kekkeiGenkaiName}
            </p>
          ) : null}
          <h3 className="font-serif text-xl font-medium leading-tight text-ink">
            {character.name}
          </h3>
          {origin ? <p className="mt-0.5 font-body text-xs text-ink-muted">{origin}</p> : null}
        </div>

        <button
          type="button"
          onClick={() => onRequestDelete(character)}
          aria-label={`Apagar ${character.name}`}
          className="absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded border border-border bg-bg-deep/70 text-ink-muted opacity-0 backdrop-blur transition hover:border-danger/60 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.5 4h11M6 4V2.5h4V4m-5 0 .5 9h5l.5-9"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge tone="accent" variant="soft" size="sm">
            NC {character.campaignLevel}
          </Badge>
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-ink-muted">
            {formatRank(character.rank)}
          </span>
        </div>
        <span className="font-body text-[10px] italic text-ink-faint">
          {character.updatedAtLabel}
        </span>
      </div>
    </article>
  );
}

function formatRank(rank: string): string {
  const map: Record<string, string> = {
    ACADEMICO: 'Acadêmico',
    GENIN: 'Genin',
    CHUUNIN: 'Chuunin',
    JOUNIN: 'Jounin',
    ANBU: 'ANBU',
    KAGE: 'Kage',
  };
  return map[rank] ?? rank;
}
