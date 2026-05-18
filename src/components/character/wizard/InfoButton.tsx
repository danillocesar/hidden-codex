'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Botao circular "?" pequeno pra abrir o drawer de descricao completa.
 * Usado em cards (pericia/poder/aptidao) e ao lado de labels (cla/vila/KG).
 *
 * Como vive dentro de containers clicaveis (ex: SelectableCard), o onClick
 * para a propagacao pra evitar togglar o card.
 *
 * Quando `disabled`, fica visualmente apagado e nao dispara o handler.
 */
export function InfoButton({
  ariaLabel,
  onClick,
  className,
  disabled,
}: {
  ariaLabel: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        'inline-grid h-4 w-4 shrink-0 -translate-y-px place-items-center rounded-full transition-colors focus-visible:outline-none',
        disabled
          ? 'cursor-not-allowed bg-bg-card-2 text-ink-faint'
          : 'bg-ice/15 text-ice-bright hover:bg-ice/25 focus-visible:bg-ice/25',
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="h-3 w-3"
        aria-hidden
      >
        <path strokeLinecap="round" d="M8 11V7M8 5h.01" />
      </svg>
    </button>
  );
}
