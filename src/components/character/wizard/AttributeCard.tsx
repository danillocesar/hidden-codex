'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Card vertical "cinematografico" pra valores numericos do wizard (atributos,
 * bases de combate, etc).
 *
 * Layout: label CINZEL no topo · valor GIGANTE (Cormorant 48px) no centro
 * cercado por `−` `+` discretos · kanji opcional embaixo.
 *
 * Aprovado em /components (variante "B1 — Vertical cinematografico").
 */
export function AttributeCard({
  label,
  name,
  kanji,
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: {
  /** Sigla curta (CINZEL, ex: "FOR"). */
  label: string;
  /** Nome completo (usado como tooltip + aria, nao renderizado). */
  name?: string;
  /** Kanji decorativo embaixo do valor. Omitido = nao renderiza. */
  kanji?: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      title={name}
      className="flex flex-col items-center gap-2 rounded border border-border bg-bg-card-2 px-3 py-4"
    >
      <p className="font-display text-[10px] uppercase tracking-[0.3em] text-ice-deep">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <StepperButton
          symbol="−"
          ariaLabel={`${ariaLabel ?? label} diminuir`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        />
        <p
          aria-label={ariaLabel ?? name ?? label}
          className="font-serif text-5xl font-medium leading-none text-ice-bright tabular-nums"
        >
          {value}
        </p>
        <StepperButton
          symbol="+"
          ariaLabel={`${ariaLabel ?? label} aumentar`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        />
      </div>
      {kanji ? <p className="font-jp text-xs text-ice-deep">{kanji}</p> : null}
    </div>
  );
}

function StepperButton({
  symbol,
  ariaLabel,
  disabled,
  onClick,
}: {
  symbol: '+' | '−';
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-grid h-7 w-7 place-items-center text-base transition-colors',
        disabled
          ? 'cursor-not-allowed text-ink-faint'
          : 'text-ink-muted hover:text-ice focus-visible:text-ice focus-visible:outline-none',
      )}
    >
      {symbol}
    </button>
  );
}
