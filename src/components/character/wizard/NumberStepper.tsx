'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Stepper numerico controlado (input + botoes +/-) com clamp em [min, max].
 * Usado para atributos, bases de combate, pontos de pericia e niveis de poder
 * no wizard.
 *
 * Click no botao desabilitado e no-op (visualmente cinza); usuario digita um
 * valor invalido = clampa automaticamente onBlur.
 */
export function NumberStepper({
  value,
  onChange,
  min,
  max,
  disabled,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.trunc(n)));
  const canDec = !disabled && value > min;
  const canInc = !disabled && value < max;

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded border border-border bg-bg-card',
        disabled && 'opacity-60',
      )}
    >
      <button
        type="button"
        aria-label={`${ariaLabel} -1`}
        disabled={!canDec}
        onClick={() => onChange(clamp(value - 1))}
        className={cn(
          'h-9 w-9 text-base text-ink-muted transition-colors',
          canDec ? 'hover:bg-bg-card-2 hover:text-ice' : 'cursor-not-allowed text-ink-faint',
        )}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        aria-label={ariaLabel}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const raw = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(raw)) onChange(clamp(raw));
        }}
        onBlur={(e) => {
          const raw = Number.parseInt(e.target.value, 10);
          onChange(clamp(Number.isFinite(raw) ? raw : min));
        }}
        className="h-9 w-12 border-x border-border bg-transparent text-center font-mono text-sm text-ink outline-none [appearance:textfield] focus:bg-bg-card-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={`${ariaLabel} +1`}
        disabled={!canInc}
        onClick={() => onChange(clamp(value + 1))}
        className={cn(
          'h-9 w-9 text-base text-ink-muted transition-colors',
          canInc ? 'hover:bg-bg-card-2 hover:text-ice' : 'cursor-not-allowed text-ink-faint',
        )}
      >
        +
      </button>
    </div>
  );
}
