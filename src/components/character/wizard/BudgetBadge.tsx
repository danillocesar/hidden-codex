import { cn } from '@/lib/utils/cn';

/**
 * Badge "X / Y pts" usado nos steps de atributos / pericias / poderes.
 *
 * Cor depende da relacao entre spent e budget:
 *   - spent <= budget: ice (saudavel)
 *   - spent == budget: ice-bright (exato)
 *   - spent > budget: danger (estourado)
 */
export function BudgetBadge({
  label,
  spent,
  budget,
}: {
  label: string;
  spent: number;
  budget: number;
}) {
  const overspent = spent > budget;
  const exact = spent === budget;
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-2 rounded-full border px-3 py-1 font-display text-[10px] uppercase tracking-[0.3em]',
        overspent
          ? 'border-danger/60 bg-danger/15 text-danger'
          : exact
            ? 'border-ice bg-ice/15 text-ice-bright'
            : 'border-ice-deep/60 bg-bg-card text-ice',
      )}
    >
      <span>{label}</span>
      <span className="font-mono text-xs not-italic tracking-normal text-ink">
        {spent} / {budget}
      </span>
    </span>
  );
}
