'use client';

import { cn } from '@/lib/utils/cn';

export type StepDef = {
  id: string;
  label: string;
  /** Kanji semantico do tema do step (ex: 名 pra identidade). */
  kanji?: string;
};

/**
 * Indicador de progresso aprovado em /components (variante "P12"):
 *   - "Passo X de N" CINZEL pequeno (topo esquerdo)
 *   - Barra horizontal fina com gradient ice-deep → ice marcando a fracao
 *     concluida (passo atual / total)
 *   - Labels embaixo, cada um com kanji semantico + nome. Clicaveis pra
 *     navegacao livre entre steps.
 *
 * Logica de navegacao (na ordem):
 *   1. Steps ANTERIORES ao atual: sempre clicaveis.
 *   2. `isReachable(target)` (se passado): caller decide caso a caso. Util
 *      pra steps que compartilham regras (ex: Poderes ↔ Aptidoes compartilham
 *      o mesmo budget e devem navegar mesmo inválidos).
 *   3. Senao: steps DEPOIS so se `canAdvance === true`.
 */
export function StepProgress({
  steps,
  currentIndex,
  canAdvance = true,
  isReachable,
  onStepClick,
}: {
  steps: ReadonlyArray<StepDef>;
  currentIndex: number;
  canAdvance?: boolean;
  /** Override fino: retorna true pra permitir click no step `target`. */
  isReachable?: (target: number) => boolean;
  onStepClick?: (index: number) => void;
}) {
  const pct = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="space-y-3">
      <p className="font-display text-[10px] uppercase tracking-[0.3em] text-ice-deep">
        Passo {currentIndex + 1} de {steps.length}
      </p>
      <div
        className="relative h-1 overflow-hidden rounded-full bg-bg-paper"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-ice-deep to-ice transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          const isFuture = i > currentIndex;
          // Caller pode liberar destinos especificos (ex: Powers ↔ Aptidoes).
          const reachableOverride = isReachable?.(i);
          const blockedByValidation =
            reachableOverride === false ||
            (reachableOverride === undefined && isFuture && !canAdvance);
          const interactive = !!onStepClick && !isCurrent && !blockedByValidation;
          const content = (
            <span className="inline-flex items-baseline gap-1.5">
              {step.kanji ? (
                <span
                  aria-hidden
                  className={cn(
                    'font-jp text-base font-bold leading-none transition-colors',
                    isCurrent && 'text-ice-bright',
                    isDone && 'text-ice-deep',
                    !isCurrent && !isDone && 'text-ink-faint',
                  )}
                >
                  {step.kanji}
                </span>
              ) : null}
              <span
                className={cn(
                  'font-display text-[10px] uppercase tracking-[0.3em] transition-colors',
                  isCurrent && 'text-ice-bright',
                  isDone && 'text-ink-muted',
                  !isCurrent && !isDone && 'text-ink-faint',
                )}
              >
                {step.label}
              </span>
            </span>
          );
          return (
            <li key={step.id} className="flex-1 text-center">
              {interactive ? (
                <button
                  type="button"
                  onClick={() => onStepClick(i)}
                  aria-label={`Ir para passo ${i + 1}: ${step.label}`}
                  className={cn(
                    'group rounded px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ice',
                    isDone && 'hover:[&_span:last-child]:text-ice',
                    !isCurrent && !isDone && 'hover:[&_span:last-child]:text-ice-deep',
                  )}
                >
                  {content}
                </button>
              ) : (
                <span aria-current={isCurrent ? 'step' : undefined}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
