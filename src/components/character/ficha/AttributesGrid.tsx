import { ATTRIBUTES } from '@/domain/catalog/attributes';
import type { Attributes } from '@/domain/types';
import { cn } from '@/lib/utils/cn';

/**
 * Grid de 7 atributos (linha cheia), igual a referencia. O(s) atributo(s) de
 * MAIOR valor ganham destaque (`highlight`) — so Des/Agi em Satsuki NC6.
 *
 * Spec: 05-UI-SPEC.md §"Hero" + reference HTML linhas 936-944.
 */
export function AttributesGrid({ attributes }: { attributes: Attributes }) {
  const maxValue = Math.max(...ATTRIBUTES.map((attr) => attributes[attr.code]));

  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {ATTRIBUTES.map((attr) => {
        const value = attributes[attr.code];
        const isHighlight = value === maxValue && value > 1;
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
