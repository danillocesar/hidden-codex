'use client';

import { useMemo } from 'react';
import { EquipmentPicker } from '@/components/character/wizard/EquipmentPicker';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { getStartingRyos } from '@/domain/rules/money';
import { getLevelRow } from '@/domain/rules/pointsBudget';
import { SHINOBI_RANK_LABELS } from '@/domain/catalog/ranks';
import type { WizardCatalogs } from '@/server/queries/wizardCatalogs';
import type { CreateCharacterInput } from '@/schemas/character/create';
import type { WizardAction, WizardState } from '../wizardState';

type InventoryItem = CreateCharacterInput['inventory'][number];

/**
 * Step Inventario (penultimo) — define os Ryos iniciais (sugeridos pelo posto
 * shinobi do NC, editaveis) e cadastra equipamentos do catalogo via picker
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

  const nc = state.identity.campaignLevel;
  const suggestedRyos = getStartingRyos(nc);
  const rankLabel = SHINOBI_RANK_LABELS[getLevelRow(nc).shinobiRank];
  const matchesSuggestion = state.ryos === suggestedRyos;

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
    <div className="space-y-6">
      <div className="rounded border border-border bg-bg-paper p-4" data-tour="inventory-ryos">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <Field label="Ryos (dinheiro inicial)" htmlFor="char-ryos">
            <Input
              id="char-ryos"
              type="number"
              inputMode="numeric"
              min={0}
              max={99_999_999}
              value={state.ryos}
              onChange={(e) => {
                const v = e.target.value;
                dispatch({ type: 'setRyos', ryos: v === '' ? 0 : Number.parseInt(v, 10) || 0 });
              }}
              className="max-w-[12rem]"
            />
          </Field>
          <p className="text-sm text-ink-muted">
            Sugerido para <b className="text-ice">{rankLabel}</b>:{' '}
            <b className="text-ice">{suggestedRyos.toLocaleString('pt-BR')}</b> Ryos
            {matchesSuggestion ? null : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 align-baseline"
                onClick={() => dispatch({ type: 'setRyos', ryos: suggestedRyos })}
              >
                Usar sugestão
              </Button>
            )}
          </p>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          RAW (Livro Básico): ninjas iniciam com este valor para itens próprios além do que a
          vila fornece. Ajuste conforme combinado com o mestre.
        </p>
      </div>

      <div data-tour="inventory-picker">
        <EquipmentPicker
          catalog={catalogs.equipment}
          quantityByCode={quantityByCode}
          onAdd={addItem}
          onRemove={removeItem}
          onQuantity={setQuantity}
        />
      </div>
    </div>
  );
}
