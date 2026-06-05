'use client';

import { useMemo } from 'react';
import { EquipmentPicker } from '@/components/character/wizard/EquipmentPicker';
import type { WizardCatalogs } from '@/server/queries/wizardCatalogs';
import type { CreateCharacterInput } from '@/schemas/character/create';
import type { WizardAction, WizardState } from '../wizardState';

type InventoryItem = CreateCharacterInput['inventory'][number];

/**
 * Step Inventario (penultimo) — cadastra equipamentos do catalogo via picker
 * (busca + cards clicaveis + contador de quantidade).
 *
 * Opcional: o personagem pode ser criado sem nenhum item. Equipar (o que
 * aparece no Combate Rapido) e feito depois na ficha, via drag-drop.
 */
export function StepInventory({
  state,
  dispatch,
  catalogs,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  catalogs: WizardCatalogs;
}) {
  const items = state.inventory;
  const setItems = (next: InventoryItem[]) => dispatch({ type: 'setInventory', inventory: next });

  const quantityByCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) map.set(i.equipmentCode, i.quantity);
    return map;
  }, [items]);

  const addItem = (code: string) => {
    if (items.some((i) => i.equipmentCode === code)) return;
    setItems([...items, { equipmentCode: code, quantity: 1, equipped: false }]);
  };
  const removeItem = (code: string) => setItems(items.filter((i) => i.equipmentCode !== code));
  const setQuantity = (code: string, qty: number) =>
    setItems(items.map((i) => (i.equipmentCode === code ? { ...i, quantity: qty } : i)));

  return (
    <EquipmentPicker
      catalog={catalogs.equipment}
      quantityByCode={quantityByCode}
      onAdd={addItem}
      onRemove={removeItem}
      onQuantity={setQuantity}
    />
  );
}
