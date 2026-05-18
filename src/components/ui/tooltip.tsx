'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Tooltip dark+ice puro CSS (sem dependencia de libs). Aparece em
 * hover/focus-within do trigger. Conteudo posicionado acima por padrao.
 *
 * Uso:
 *
 *   <Tooltip content="10 + 3·Vig + 5·NC">
 *     <div className="...">card content</div>
 *   </Tooltip>
 *
 * O wrapper externo vira `group` + `relative`. Triggers focusable (tab)
 * tambem disparam o tooltip via `focus-within`.
 *
 * Limitacoes: nao tem auto-positioning (nao foge da viewport) nem suporte a
 * touch. Pra MVP serve; quando precisarmos de mais (mobile, side variants)
 * trocamos por @radix-ui/react-tooltip.
 */
export function Tooltip({
  content,
  side = 'top',
  children,
  className,
}: {
  content: React.ReactNode;
  side?: 'top' | 'bottom';
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const isTop = side === 'top';

  return (
    <span
      className={cn('group relative inline-flex', className)}
      aria-describedby={id}
    >
      {children}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded border border-border-strong bg-bg-paper px-3 py-1.5 font-body text-xs text-ink shadow-hero opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 group-focus-within:opacity-100',
          isTop ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {content}
        {/* Seta CSS triangle apontando pro trigger */}
        <span
          aria-hidden
          className={cn(
            'absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-x-transparent',
            isTop
              ? 'top-full border-t-4 border-t-[var(--border-strong)]'
              : 'bottom-full border-b-4 border-b-[var(--border-strong)]',
          )}
        />
      </span>
    </span>
  );
}
