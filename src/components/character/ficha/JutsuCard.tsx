'use client';

import type { FichaJutsu } from '@/lib/character/mapPrismaToCore';

const IMG_GRADIENT =
  'linear-gradient(180deg, rgba(10,11,14,0.15) 0%, rgba(10,11,14,0.2) 35%, rgba(10,11,14,0.75) 55%, rgba(10,11,14,0.92) 75%, rgba(10,11,14,0.96) 100%)';

/**
 * Card de jutsu seguindo a referência (`.jutsu`): imagem de fundo cobrindo o
 * card, glifo no topo, e corpo no rodapé com poder·efeito, nome, níveis
 * conjuráveis e descrição. Sem CD/Dano calculados (entram com a calculadora).
 */
export function JutsuCard({
  jutsu,
  canEdit,
  onRequestDelete,
}: {
  jutsu: FichaJutsu;
  canEdit: boolean;
  onRequestDelete: (jutsu: FichaJutsu) => void;
}) {
  const element = [jutsu.powerName, jutsu.effectName].filter(Boolean).join(' · ');

  return (
    <article className="group relative flex min-h-[360px] flex-col overflow-hidden rounded border border-border bg-bg-card transition-all duration-300 hover:-translate-y-1 hover:border-border-strong">
      <div className="absolute inset-0 z-0">
        {jutsu.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={jutsu.imageUrl}
            alt=""
            className="h-full w-full object-cover object-[center_25%]"
            style={{ filter: 'saturate(0.7) contrast(1.05) brightness(0.85)' }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-bg-card-2 to-bg-deep" />
        )}
        <div className="absolute inset-0" style={{ background: IMG_GRADIENT }} />
      </div>

      <span
        className="absolute left-3.5 top-2 z-10 font-jp text-4xl font-bold text-ice-bright"
        style={{ textShadow: '0 0 24px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.8)' }}
        aria-hidden
      >
        術
      </span>

      {canEdit ? (
        <button
          type="button"
          onClick={() => onRequestDelete(jutsu)}
          aria-label={`Apagar ${jutsu.name}`}
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
      ) : null}

      <div className="relative z-10 mt-auto p-4 pt-12">
        {element ? (
          <p className="mb-1.5 font-display text-[9px] uppercase tracking-[0.35em] text-ice">
            {element}
          </p>
        ) : null}
        <h3 className="font-serif text-xl font-medium leading-tight text-ink">{jutsu.name}</h3>

        <div className="mt-3 border-t border-ice/25 pt-2.5">
          <p className="font-display text-[8px] uppercase tracking-[0.25em] text-ink-muted">
            Níveis conjuráveis
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {jutsu.levels.map((lvl) => (
              <span
                key={lvl}
                className="min-w-7 rounded border border-ice-deep/50 bg-bg-deep/40 px-1.5 py-0.5 text-center font-serif text-sm font-medium text-ice-bright"
              >
                {lvl}
              </span>
            ))}
          </div>
        </div>

        {jutsu.description ? (
          <p className="mt-2.5 font-body text-[11.5px] leading-snug text-ink-muted">
            {jutsu.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
