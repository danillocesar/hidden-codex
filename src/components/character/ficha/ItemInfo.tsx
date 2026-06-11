'use client';

import { useState } from 'react';
import { InfoDrawer } from '@/components/character/wizard/InfoDrawer';
import { InfoButton } from '@/components/character/wizard/InfoButton';
import { compartmentCostForItem } from '@/domain/rules/inventory';
import type { FichaInventoryItem } from '@/lib/character/mapPrismaToCore';

const KIND_LABEL: Record<string, string> = {
  WEAPON: 'Armamento',
  ARMOR: 'Armadura',
  CONSUMABLE: 'Consumível',
  GENERAL: 'Item geral',
};

/**
 * Botão de info (ícone "i") + drawer com os detalhes de um item do inventário:
 * tipo, dano, alcance, compartimentos e descrição. O clique não propaga (pra
 * não iniciar arraste nem togglar o card).
 */
export function ItemInfo({ item }: { item: FichaInventoryItem }) {
  const [open, setOpen] = useState(false);

  const subtitle =
    [KIND_LABEL[item.kind ?? ''] ?? item.kind, item.subtype?.replace(/_/g, ' ')]
      .filter(Boolean)
      .join(' · ') || null;

  const rows: Array<[string, string]> = [];
  if (item.damage) rows.push(['Dano', [item.damage, item.damageType].filter(Boolean).join(' · ')]);
  if (item.range) rows.push(['Alcance', item.range]);
  rows.push(['Compartimentos', compartmentLabel(item)]);
  rows.push(['Quantidade', String(item.quantity)]);

  const description = item.description ?? item.shortDescription;

  return (
    <>
      <InfoButton ariaLabel={`Detalhes de ${item.name}`} onClick={() => setOpen(true)} />

      <InfoDrawer open={open} onClose={() => setOpen(false)} title={item.name} subtitle={subtitle}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-display text-[9px] uppercase tracking-[0.25em] text-ink-muted">
                {label}
              </dt>
              <dd className="font-body text-sm text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {description ? (
          <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4 font-body text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </InfoDrawer>
    </>
  );
}

/** Rótulo legível dos compartimentos do item (fornece / ocupa / desprezível). */
function compartmentLabel(item: FichaInventoryItem): string {
  if (item.compartmentBonus > 0) {
    return `Fornece ${item.compartmentBonus} compartimento(s)`;
  }
  if (item.negligible) return 'Desprezível (não conta)';
  const cost = compartmentCostForItem({
    itemsPerCompartment: item.itemsPerCompartment,
    compartmentsPerStack: item.compartmentsPerStack,
    quantity: item.quantity,
    compartmentBonus: item.compartmentBonus,
    negligible: item.negligible,
  });
  const perComp = item.itemsPerCompartment > 1 ? ` · ${item.itemsPerCompartment}/compartimento` : '';
  return `Ocupa ${cost} compartimento(s)${perComp}`;
}
