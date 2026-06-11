'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Stepper de nivel pra cards de poder do wizard (Step 4). Layout aprovado
 * em /components (variante "P1"): valor GIGANTE em Cormorant entre dois
 * botoes discretos `−` `+`. Reusa o mesmo padrao visual do `AttributeCard`.
 */
export function PowerLevelStepper({
  value,
  min,
  max,
  ariaLabel,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <SideButton
        symbol="−"
        ariaLabel={`${ariaLabel} diminuir`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      />
      <p className="font-serif text-4xl font-medium leading-none tabular-nums text-ice-bright">
        {value}
      </p>
      <SideButton
        symbol="+"
        ariaLabel={`${ariaLabel} aumentar`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      />
    </div>
  );
}

function SideButton({
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
