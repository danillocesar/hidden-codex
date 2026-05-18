'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

/**
 * Card clicavel que funciona como toggle de selecao. O card inteiro e a area
 * de toque; estado por borda + check icon discreto no canto direito.
 *
 * Usado em:
 *   - Step 4 (Powers) pra escolher poderes
 *   - Step 5 (Aptidoes) pra escolher aptidoes
 *
 * `controls` permite renderizar elementos interativos dentro (ex: stepper de
 * nivel) — clicks neles devem ter `stopPropagation` pra nao toggar o card.
 *
 * `locked` desabilita o toggle (ex: aptidao gratuita de origem) — selecionado
 * fixo, sem poder remover.
 *
 * `disabled` impede a selecao (ex: pre-req nao cumprido). Card fica opaco,
 * sem hover, cursor not-allowed. Click no-op.
 */
export function SelectableCard({
  selected,
  locked,
  disabled,
  onToggle,
  lockedLabel,
  tagLabel,
  children,
  controls,
  className,
}: {
  selected: boolean;
  locked?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  /** Texto mostrado no canto quando `locked` for true. Ex: "origem". */
  lockedLabel?: string;
  /**
   * Badge alternativo mostrado no canto quando NAO esta `locked` (card
   * permanece removivel). Ex: "gratis" pras 3 primeiras aptidoes compradas
   * na criacao do personagem.
   */
  tagLabel?: string;
  /** Conteudo principal do card. */
  children: React.ReactNode;
  /** Controles inline (steppers, botoes). Cliques aqui nao togglam. */
  controls?: React.ReactNode;
  className?: string;
}) {
  const interactive = !locked && !disabled;
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : -1}
      aria-pressed={interactive ? selected : undefined}
      aria-disabled={!interactive || undefined}
      onClick={interactive ? onToggle : undefined}
      onKeyDown={handleKey}
      className={cn(
        'group relative flex items-start gap-3 rounded border bg-bg-card-2 p-3 transition-colors',
        locked && 'cursor-default opacity-90',
        disabled && 'cursor-not-allowed opacity-50',
        interactive &&
          'cursor-pointer hover:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ice',
        selected && interactive && 'border-ice-deep bg-bg-card',
        locked && 'border-ice-deep/40 bg-bg-card',
        disabled && !selected && 'border-border bg-bg-card-2',
        !selected && interactive && 'border-border',
        className,
      )}
    >
      {/* Check indicator no canto */}
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          locked && 'border-success/60 bg-success/15 text-success',
          interactive && selected && 'border-ice bg-ice/20 text-ice-bright',
          interactive && !selected && 'border-ink-faint group-hover:border-ice-deep',
          disabled && 'border-ink-faint',
        )}
      >
        {(selected || locked) && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="none"
            className="h-3 w-3"
          >
            <path
              d="M3 8.5l3 3 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">{children}</div>

      {controls ? (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center gap-2"
        >
          {controls}
        </div>
      ) : null}

      {(locked && lockedLabel) || tagLabel ? (
        <Badge tone="success" size="xs" className="absolute right-3 top-2">
          {locked && lockedLabel ? lockedLabel : tagLabel}
        </Badge>
      ) : null}
    </div>
  );
}
