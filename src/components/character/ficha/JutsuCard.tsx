'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateJutsuImage } from '@/server/actions/characters/jutsus';
import type { FichaJutsu } from '@/lib/character/mapPrismaToCore';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

const IMG_GRADIENT =
  'linear-gradient(180deg, rgba(10,11,14,0.15) 0%, rgba(10,11,14,0.2) 35%, rgba(10,11,14,0.75) 55%, rgba(10,11,14,0.92) 75%, rgba(10,11,14,0.96) 100%)';

export type AcertoValues = { cc: number; cd: number; lm: number };

/**
 * Card de jutsu (ref. `.jutsu`): imagem de fundo, glifo do elemento do poder,
 * e corpo com poder·efeito, nome e um grid de stats em 2 linhas — Acerto /
 * Alcance / Duração em cima; Dano / Chakra (mais texto) embaixo — além dos
 * níveis conjuráveis. Stats ausentes aparecem com "—".
 */
export function JutsuCard({
  jutsu,
  characterId,
  acertoValues,
  canEdit,
  onRequestDelete,
}: {
  jutsu: FichaJutsu;
  characterId: string;
  acertoValues: AcertoValues;
  canEdit: boolean;
  onRequestDelete: (jutsu: FichaJutsu) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const element = [jutsu.powerName, jutsu.effectName].filter(Boolean).join(' · ');
  const acerto = jutsu.acerto ? `${jutsu.acerto.toUpperCase()} ${acertoValues[jutsu.acerto]}` : '—';

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || file.size > MAX_BYTES) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('characterId', characterId);
      fd.append('file', file);
      fd.append('label', jutsu.name.slice(0, 80) || 'Jutsu');
      const res = await fetch('/api/upload/character-image', { method: 'POST', body: fd });
      const body = (await res.json().catch(() => null)) as { image?: { url: string } } | null;
      if (res.ok && body?.image) {
        const result = await updateJutsuImage(jutsu.id, body.image.url);
        if (result.ok) router.refresh();
      }
    } finally {
      setUploading(false);
    }
  };

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
        {jutsu.powerKanji}
      </span>

      {canEdit ? (
        <div className="absolute right-2 top-2 z-20 flex gap-1.5 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label={`Trocar imagem de ${jutsu.name}`}
            className="grid h-8 w-8 place-items-center rounded border border-border bg-bg-deep/70 text-ink-muted backdrop-blur transition hover:border-ice hover:text-ice-bright disabled:opacity-60"
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
                d="M2 12V5a1 1 0 0 1 1-1h2l1-1.5h4L11 4h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z"
              />
              <circle cx="8" cy="8.5" r="2.2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(jutsu)}
            aria-label={`Apagar ${jutsu.name}`}
            className="grid h-8 w-8 place-items-center rounded border border-border bg-bg-deep/70 text-ink-muted backdrop-blur transition hover:border-danger/60 hover:text-danger"
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
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={handleFile}
            className="hidden"
            aria-hidden
            tabIndex={-1}
          />
        </div>
      ) : null}

      <div className="relative z-10 mt-auto p-4 pt-12">
        {element ? (
          <p className="mb-1.5 font-display text-[9px] uppercase tracking-[0.35em] text-ice">
            {element}
          </p>
        ) : null}
        <h3 className="font-serif text-xl font-medium leading-tight text-ink">{jutsu.name}</h3>

        <div className="mt-3 space-y-2.5 border-t border-ice/25 pt-2.5">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Acerto" value={acerto} />
            <Stat label="Alcance" value={jutsu.range ?? '—'} />
            <Stat label="Duração" value={jutsu.duration ?? '—'} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Dano" value={jutsu.damage ?? '—'} />
            <Stat label="Chakra" value={jutsu.chakraCost ?? '—'} />
          </div>
          <div>
            <p className="font-display text-[8px] uppercase tracking-[0.25em] text-ink-muted">
              Níveis
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {jutsu.levels.length > 0 ? (
                jutsu.levels.map((lvl) => (
                  <span
                    key={lvl}
                    className="min-w-6 rounded border border-ice-deep/50 bg-bg-deep/40 px-1.5 py-0.5 text-center font-serif text-sm font-medium text-ice-bright"
                  >
                    {lvl}
                  </span>
                ))
              ) : (
                <span className="font-body text-xs text-ink-muted">—</span>
              )}
            </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-display text-[8px] uppercase tracking-[0.25em] text-ink-muted">{label}</p>
      <p className="mt-0.5 break-words font-body text-xs text-ice-bright">{value}</p>
    </div>
  );
}
