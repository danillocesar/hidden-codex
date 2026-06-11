'use client';

import { useState } from 'react';
import { InfoButton } from '@/components/character/wizard/InfoButton';
import { InfoDrawer } from '@/components/character/wizard/InfoDrawer';
import { cn } from '@/lib/utils/cn';

/**
 * Gatilho de drawer de detalhes reutilizável (aptidão, poder, efeito).
 * - Sem `label`: renderiza o ícone "i" (`InfoButton`).
 * - Com `label`: renderiza um texto clicável (ex.: chip de efeito).
 *
 * Self-contained (gerencia o próprio drawer); pode viver em server components.
 */
export function DetailInfo({
  title,
  subtitle,
  description,
  label,
  className,
}: {
  title: string;
  subtitle?: string | null;
  description: string | null;
  /** Texto clicável; se ausente, mostra o ícone "i". */
  label?: string;
  /** Classe do gatilho `label`. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const content = description?.trim() || 'Sem descrição cadastrada.';

  return (
    <>
      {label ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className={cn(
            'text-left transition-colors hover:text-ice-bright focus-visible:outline-none',
            className,
          )}
        >
          {label}
        </button>
      ) : (
        <InfoButton ariaLabel={`Detalhes de ${title}`} onClick={() => setOpen(true)} />
      )}

      <InfoDrawer open={open} onClose={() => setOpen(false)} title={title} subtitle={subtitle ?? null}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{content}</p>
      </InfoDrawer>
    </>
  );
}
