'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Checkbox customizado aprovado em /components (mix do "C1" com o nativo):
 *   - Nao marcado: quadrado com borda padrao + bg-bg-card (estilo C1)
 *   - Marcado: SOLIDO em ice (preenchido) + check escuro — visual nativo
 *
 * Acessivel via `<input type="checkbox" sr-only>` por baixo (peer) — clica no
 * label inteiro, foco visivel via ring.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  id,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'group inline-flex items-center gap-2 text-sm text-ink-muted',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          id={id}
        />
        <span
          aria-hidden
          className={cn(
            'grid h-4 w-4 place-items-center rounded border transition-colors',
            checked
              ? 'border-ice bg-ice'
              : 'border-border bg-bg-card group-hover:border-ice-deep',
            'peer-focus-visible:ring-1 peer-focus-visible:ring-ice peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-bg-deep',
          )}
        >
          {checked ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-2.5 w-2.5 text-bg-deep"
            >
              <path d="M3 8l3 3 7-7" />
            </svg>
          ) : null}
        </span>
      </span>
      <span className={cn('select-none', checked && 'text-ice-bright')}>{label}</span>
    </label>
  );
}
