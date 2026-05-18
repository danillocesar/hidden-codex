import { ATTRIBUTES } from '@/domain/catalog/attributes';
import type { Attributes } from '@/domain/types';
import { cn } from '@/lib/utils/cn';

/**
 * Grid 7 colunas com os atributos — versao read-only da ficha view.
 *
 * Atributos "altos" (>= NC/2 round up) ganham destaque visual (`highlight`).
 * Em mobile colapsa pra 4 colunas, depois 2.
 *
 * Spec: 05-UI-SPEC.md §"Hero" + 08-VISUAL-REFERENCE §"Spacing" (grid 7 col).
 */
export function AttributesGrid({
  attributes,
  campaignLevel,
}: {
  attributes: Attributes;
  campaignLevel: number;
}) {
  const highlightThreshold = Math.ceil(campaignLevel / 2);

  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {ATTRIBUTES.map((attr) => {
        const value = attributes[attr.code];
        const isHighlight = value >= highlightThreshold && value > 1;
        return (
          <li
            key={attr.code}
            className={cn(
              'border bg-bg-card px-2 py-3 text-center transition-colors',
              isHighlight ? 'border-border-strong' : 'border-border',
            )}
            title={attr.description}
          >
            <p className="font-display text-[9px] uppercase tracking-[0.25em] text-ink-muted">
              {attr.abbreviation}
            </p>
            <p
              className={cn(
                'mt-1 font-serif text-3xl font-medium leading-none',
                isHighlight ? 'text-[#d4e4f0]' : 'text-ice-bright',
              )}
            >
              {value}
            </p>
            <p className="mt-1 font-jp text-[10px] text-ice-deep">{attr.kanji}</p>
          </li>
        );
      })}
    </ul>
  );
}
