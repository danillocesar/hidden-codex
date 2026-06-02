'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, type ComboboxValue } from '@/components/ui/combobox';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { WizardCatalogs, WizardEquipmentOption } from '@/server/queries/wizardCatalogs';
import type { CreateCharacterInput } from '@/schemas/character/create';
import type { WizardAction, WizardState } from '../wizardState';

type InventoryItem = CreateCharacterInput['inventory'][number];

/**
 * Step Inventario (penultimo) — cadastra equipamentos do catalogo. Armas
 * ganham um checkbox "Equipada" que alimenta o card "Combate Rapido" da ficha.
 *
 * Opcional: o personagem pode ser criado sem nenhum item. Sem validacao de
 * regra aqui (peso/compartimentos entram numa fase futura de inventario).
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
  const [picker, setPicker] = useState<ComboboxValue>(null);

  const equipmentByCode = useMemo(
    () => new Map(catalogs.equipment.map((e) => [e.code, e])),
    [catalogs.equipment],
  );

  const options = useMemo(
    () =>
      catalogs.equipment.map((e) => ({
        value: e.code,
        label: `${e.name}${e.subtype ? ` · ${humanize(e.subtype)}` : ''}`,
      })),
    [catalogs.equipment],
  );

  const items = state.inventory;

  const setItems = (next: InventoryItem[]) => dispatch({ type: 'setInventory', inventory: next });

  const addItem = (code: string) => {
    const existingIndex = items.findIndex((i) => i.equipmentCode === code);
    if (existingIndex >= 0) {
      setItems(
        items.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: Math.min(9999, i.quantity + 1) } : i,
        ),
      );
      return;
    }
    setItems([...items, { equipmentCode: code, quantity: 1, equipped: false }]);
  };

  const patchItem = (index: number, patch: Partial<InventoryItem>) => {
    setItems(items.map((i, idx) => (idx === index ? { ...i, ...patch } : i)));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow tone="deep" size="sm" as="p" className="tracking-[0.35em]">
          Adicionar item
        </Eyebrow>
        <div className="mt-2 max-w-md">
          <Combobox
            options={options}
            value={picker}
            allowCustom={false}
            placeholder="Buscar arma, armadura ou item…"
            emptyHint="Nenhum equipamento encontrado"
            onChange={(next) => {
              if (next?.type === 'canonical') {
                addItem(next.value);
                setPicker(null);
              } else {
                setPicker(next);
              }
            }}
          />
        </div>
        <Text variant="help" className="mt-2">
          O inventário é opcional. Marque <span className="text-ice">Equipada</span> nas armas em
          uso para que apareçam no Combate Rápido da ficha.
        </Text>
      </div>

      {items.length === 0 ? (
        <Surface tone="sunken" padding="lg" className="text-center">
          <Text variant="muted">Nenhum item adicionado ainda.</Text>
        </Surface>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => {
            const def = equipmentByCode.get(item.equipmentCode);
            const isWeapon = def?.kind === 'WEAPON';
            return (
              <li key={item.equipmentCode}>
                <Surface
                  tone="default"
                  padding="lg"
                  className="flex flex-wrap items-center gap-x-4 gap-y-3"
                >
                  <div className="min-w-40 flex-1">
                    <div className="flex items-center gap-2">
                      <Text variant="strong">{def?.name ?? item.equipmentCode}</Text>
                      {def?.subtype ? (
                        <Badge tone="neutral" variant="soft">
                          {humanize(def.subtype)}
                        </Badge>
                      ) : null}
                    </div>
                    <Text variant="help" className="mt-0.5">
                      {describeEquipment(def)}
                    </Text>
                  </div>

                  <QuantityStepper
                    value={item.quantity}
                    onChange={(q) => patchItem(index, { quantity: q })}
                  />

                  {isWeapon ? (
                    <Checkbox
                      checked={item.equipped}
                      onChange={(next) => patchItem(index, { equipped: next })}
                      label="Equipada"
                    />
                  ) : (
                    <span className="w-[88px]" aria-hidden />
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    aria-label={`Remover ${def?.name ?? item.equipmentCode}`}
                  >
                    Remover
                  </Button>
                </Surface>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Eyebrow tone="default" size="xs" className="tracking-[0.25em]">
        Qtd
      </Eyebrow>
      <div className="flex items-center overflow-hidden rounded border border-border">
        <button
          type="button"
          className="grid h-8 w-8 place-items-center text-ink-muted transition-colors hover:bg-bg-card-2 hover:text-ice disabled:opacity-40"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <span className="min-w-9 px-1 text-center font-serif text-lg text-ice-bright">{value}</span>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center text-ink-muted transition-colors hover:bg-bg-card-2 hover:text-ice"
          onClick={() => onChange(Math.min(9999, value + 1))}
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>
    </div>
  );
}

function describeEquipment(def: WizardEquipmentOption | undefined): string {
  if (!def) return 'Item customizado';
  const parts: string[] = [];
  if (def.damage) parts.push(`dano ${def.damage}`);
  if (def.damageType) parts.push(def.damageType);
  if (def.range) parts.push(def.range);
  if (parts.length === 0 && def.shortDescription) return def.shortDescription;
  return parts.join(' · ') || humanize(def.kind);
}

function humanize(value: string): string {
  return value.replace(/_/g, ' ');
}
