'use client';

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eyebrow } from '@/components/ui/eyebrow';
import { setInventoryItemEquipped } from '@/server/actions/characters/inventory';
import type { FichaInventoryItem } from '@/lib/character/mapPrismaToCore';
import { cn } from '@/lib/utils/cn';

type Group = { key: string; label: string; items: FichaInventoryItem[] };

/**
 * Secao Inventario da ficha (rodape). Lista itens agrupados por tipo. Em armas,
 * mostra um checkbox "Equipada" (owner-only) que alterna o flag via server
 * action e reflete no card "Combate Rapido" do topo.
 *
 * Spec: reference HTML linhas 1188-1203 (Inventario / Armamento).
 */
export function InventoryPanel({
  items,
  canEdit,
}: {
  items: ReadonlyArray<FichaInventoryItem>;
  canEdit: boolean;
}) {
  if (items.length === 0) {
    return <p className="font-body text-sm text-ink-muted">Nenhum item no inventário.</p>;
  }

  const groups: Group[] = [
    { key: 'WEAPON', label: 'Armamento', items: items.filter((i) => i.kind === 'WEAPON') },
    { key: 'ARMOR', label: 'Armaduras', items: items.filter((i) => i.kind === 'ARMOR') },
    {
      key: 'OTHER',
      label: 'Itens & Consumíveis',
      items: items.filter((i) => i.kind !== 'WEAPON' && i.kind !== 'ARMOR'),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {groups.map((group) => (
        <div key={group.key}>
          <Eyebrow
            tone="accent"
            size="xs"
            as="div"
            className="border-b border-dashed border-border pb-1.5 tracking-[0.35em]"
          >
            {group.label}
          </Eyebrow>
          <ul className="mt-2">
            {group.items.map((item) => (
              <InventoryRow key={item.id} item={item} canEdit={canEdit} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function InventoryRow({ item, canEdit }: { item: FichaInventoryItem; canEdit: boolean }) {
  const [equipped, setEquipped] = useState(item.equipped);
  const [isPending, startTransition] = useTransition();

  const toggle = (next: boolean) => {
    const prev = equipped;
    setEquipped(next);
    startTransition(async () => {
      const result = await setInventoryItemEquipped(item.id, next);
      if (!result.ok) setEquipped(prev);
    });
  };

  return (
    <li className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-serif text-[15px] text-ink">{item.name}</span>
          {item.subtype ? (
            <Badge tone="neutral" variant="soft">
              {item.subtype.replace(/_/g, ' ')}
            </Badge>
          ) : null}
        </div>
        {item.damage || item.damageType ? (
          <p className="mt-0.5 font-body text-[11px] italic text-ink-faint">
            {[item.damage && `dano ${item.damage}`, item.damageType].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {item.isWeapon ? (
          canEdit ? (
            <Checkbox checked={equipped} onChange={toggle} disabled={isPending} label="Equipada" />
          ) : equipped ? (
            <Eyebrow tone="deep" size="xs" className="tracking-[0.25em]">
              equipada
            </Eyebrow>
          ) : null
        ) : null}
        <span
          className={cn('font-serif text-sm text-ink-muted', item.quantity <= 1 && 'opacity-0')}
        >
          ×{item.quantity}
        </span>
      </div>
    </li>
  );
}
