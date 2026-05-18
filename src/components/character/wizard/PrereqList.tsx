import { cn } from '@/lib/utils/cn';
import type { PrerequisiteCheck, PrerequisiteResult } from '@/domain/rules/aptitudes';

/**
 * Renderiza o resultado de `checkAptitudePrerequisites` como uma lista
 * compacta. Cada check mostra status (ok/falha/manual) + descricao.
 *
 * Quando `humanize` e passado, usa o texto amigavel (ex: "Espirito 8",
 * "Medicina") no lugar do `detail` tecnico do motor. Sem `humanize`, fallback
 * pro `detail` cru.
 */
export function PrereqList({
  result,
  humanize,
}: {
  result: PrerequisiteResult;
  humanize?: (check: PrerequisiteCheck) => string;
}) {
  if (result.checks.length === 0) {
    return (
      <p className="font-display text-[10px] uppercase tracking-[0.3em] text-ice-deep">
        Sem pre-requisitos
      </p>
    );
  }
  return (
    <ul className="space-y-1 text-xs">
      {result.checks.map((c, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            className={cn(
              'mt-0.5 inline-block h-2 w-2 rounded-full',
              c.met ? 'bg-success' : c.manualReview ? 'bg-warning' : 'bg-danger',
            )}
            aria-hidden
          />
          <span
            className={cn(
              c.met ? 'text-ink-muted' : c.manualReview ? 'text-warning' : 'text-danger',
            )}
          >
            {humanize ? humanize(c) : c.detail}
            {c.manualReview ? ' (mestre)' : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
