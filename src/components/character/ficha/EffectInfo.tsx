'use client';

import { useState } from 'react';
import { InfoDrawer } from '@/components/character/wizard/InfoDrawer';

/**
 * Abre um drawer lateral com a descrição completa do efeito de um jutsu.
 * Dois gatilhos: `icon` (botão no topo do card) ou `link` (texto "ver
 * descrição" clicável, no card e no combate rápido). Reaproveita o `InfoDrawer`
 * do wizard.
 */
export function EffectInfo({
  variant,
  title,
  subtitle,
  description,
  label = 'ver descrição',
}: {
  variant: 'icon' | 'link';
  title: string;
  subtitle?: string | null;
  description: string | null;
  /** Texto do gatilho `link`. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const content = description?.trim() || 'Sem descrição cadastrada para este efeito.';

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Detalhes de ${title}`}
          className="grid h-8 w-8 place-items-center rounded border border-border bg-bg-deep/70 text-ink-muted backdrop-blur transition hover:border-ice hover:text-ice-bright"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-3.5 w-3.5"
          >
            <circle cx="8" cy="8" r="6.25" />
            <path strokeLinecap="round" d="M8 11V7.3M8 5.2h.01" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-left text-ice underline decoration-dotted underline-offset-2 transition-colors hover:text-ice-bright"
        >
          {label}
        </button>
      )}

      <InfoDrawer open={open} onClose={() => setOpen(false)} title={title} subtitle={subtitle}>
        <p className="whitespace-pre-wrap">{content}</p>
      </InfoDrawer>
    </>
  );
}
