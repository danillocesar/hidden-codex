'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Text } from '@/components/ui/text';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { compartmentCostForItem } from '@/domain/rules/inventory';
import {
  canDropInCompartment,
  deriveCompartmentSlots,
  itemCapacity,
  summarizeOccupancy,
} from '@/domain/rules/compartments';
import type { FichaInventoryItem } from '@/lib/character/mapPrismaToCore';
import {
  EquipmentPicker,
  type EquipmentPickerItem,
} from '@/components/character/wizard/EquipmentPicker';
import {
  addInventoryItem,
  assignItemToCompartment,
  removeInventoryItem,
  updateInventoryQuantity,
} from '@/server/actions/characters/inventory';
import { ItemInfo } from './ItemInfo';

const KIND_LABEL: Record<string, string> = {
  WEAPON: 'Armamento',
  ARMOR: 'Armadura',
  CONSUMABLE: 'Consumível',
  GENERAL: 'Geral',
  TOOL: 'Ferramenta',
};

const INVENTORY_ZONE = 'inventory';

/**
 * Inventário da ficha (dono) — 2 colunas: à esquerda os itens soltos (não
 * guardados) + armazenamento + desprezíveis; à direita os cards de
 * compartimento fornecidos pelos itens de armazenamento. Arrasta um item pra
 * dentro de um compartimento (respeitando capacidade e mesclagem, Livro p.127).
 * Clique no ✦ equipa (Combate Rápido). Mutações otimistas.
 */
export function InventoryManager({
  characterId,
  items,
  catalog,
}: {
  characterId: string;
  items: ReadonlyArray<FichaInventoryItem>;
  catalog: ReadonlyArray<EquipmentPickerItem>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  const [localItems, setLocalItems] = useState<FichaInventoryItem[]>([...items]);
  useEffect(() => setLocalItems([...items]), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  // Itens de armazenamento (cada um vira UM card com N compartimentos dentro).
  const storages = useMemo(() => localItems.filter((i) => i.compartmentBonus > 0), [localItems]);
  // Lista achatada de slots (pra validação de refs e ocupação).
  // Compartimentos fornecidos = bônus × quantidade (3 coldres = 3 compartimentos).
  const slots = useMemo(
    () =>
      deriveCompartmentSlots(
        storages.map((i) => ({
          id: i.id,
          name: i.name,
          compartmentBonus: i.compartmentBonus * i.quantity,
        })),
      ),
    [storages],
  );
  const validRefs = useMemo(() => new Set(slots.map((s) => s.id)), [slots]);

  const itemsByRef = useMemo(() => {
    const map = new Map<string, FichaInventoryItem[]>();
    for (const i of localItems) {
      if (i.compartmentRef && validRefs.has(i.compartmentRef)) {
        (map.get(i.compartmentRef) ?? map.set(i.compartmentRef, []).get(i.compartmentRef)!).push(i);
      }
    }
    return map;
  }, [localItems, validRefs]);

  // Itens soltos (inclui armazenamento e desprezíveis); refs órfãos viram soltos.
  const loose = useMemo(
    () => localItems.filter((i) => !i.compartmentRef || !validRefs.has(i.compartmentRef)),
    [localItems, validRefs],
  );

  const occupancy = useMemo(() => {
    const filledSlots = slots.filter((s) => (itemsByRef.get(s.id)?.length ?? 0) > 0).length;
    const looseOccupying = loose
      .filter((i) => !i.negligible && i.compartmentBonus === 0)
      .reduce(
        (sum, i) =>
          sum +
          compartmentCostForItem({
            itemsPerCompartment: i.itemsPerCompartment,
            compartmentsPerStack: i.compartmentsPerStack,
            quantity: i.quantity,
            compartmentBonus: i.compartmentBonus,
            negligible: i.negligible,
          }),
        0,
      );
    return summarizeOccupancy({ provided: slots.length, filledSlots, looseOccupying });
  }, [slots, itemsByRef, loose]);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, errPrefix: string) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) toast(`${errPrefix}: ${res.error}`, 'danger');
      router.refresh();
    });
  }

  const patchLocal = (id: string, patch: Partial<FichaInventoryItem>) =>
    setLocalItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const setQuantity = (item: FichaInventoryItem, qty: number) => {
    patchLocal(item.id, { quantity: qty });
    run(() => updateInventoryQuantity(item.id, qty), 'Falha ao atualizar');
  };
  const remove = (item: FichaInventoryItem) => {
    setLocalItems((p) => p.filter((i) => i.id !== item.id));
    run(() => removeInventoryItem(item.id), 'Falha ao remover');
  };
  const assign = (item: FichaInventoryItem, ref: string | null) => {
    patchLocal(item.id, { compartmentRef: ref });
    run(() => assignItemToCompartment(item.id, ref), 'Falha ao guardar');
  };

  function onDragEnd(event: DragEndEvent) {
    const itemId = String(event.active.id);
    const zone = event.over?.id ? String(event.over.id) : null;
    if (!zone) return;
    const item = localItems.find((i) => i.id === itemId);
    if (!item) return;

    if (zone === INVENTORY_ZONE) {
      if (item.compartmentRef) assign(item, null);
      return;
    }
    // Soltou num compartimento.
    if (item.compartmentRef === zone) return;
    if (!item.storable) {
      toast('Esse item se auto-carrega — não vai em compartimento.', 'warning');
      return;
    }
    const current = itemsByRef.get(zone) ?? [];
    const check = canDropInCompartment(
      { id: item.id, mixable: item.mixable },
      current.map((c) => ({ id: c.id, mixable: c.mixable })),
    );
    if (!check.ok) {
      toast(check.reason, 'warning');
      return;
    }
    assign(item, zone);
  }

  // Picker (modal) — adicionar do catálogo.
  const quantityByCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of localItems) if (i.equipmentCode) map.set(i.equipmentCode, i.quantity);
    return map;
  }, [localItems]);
  const addByCode = (code: string) => {
    const cat = catalog.find((c) => c.code === code);
    setLocalItems((p) => [...p, optimisticItem(code, cat)]);
    run(() => addInventoryItem({ characterId, equipmentCode: code, quantity: 1 }), 'Falha ao adicionar');
  };
  const removeByCode = (code: string) => {
    const it = localItems.find((i) => i.equipmentCode === code);
    if (it) remove(it);
  };
  const quantityByCodeChange = (code: string, qty: number) => {
    const it = localItems.find((i) => i.equipmentCode === code);
    if (it) setQuantity(it, qty);
  };

  const cardProps = (item: FichaInventoryItem) => ({
    item,
    onQuantity: (q: number) => setQuantity(item, q),
    onRemove: () => remove(item),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OccupancyMeter occupancy={occupancy} />
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          + Adicionar item
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          {/* ── Inventário (itens soltos) ── */}
          <DropZone id={INVENTORY_ZONE} label="Inventário">
            {loose.length === 0 ? (
              <ZoneHint>Vazio. Use “Adicionar item”.</ZoneHint>
            ) : (
              <ul className="grid gap-2">
                {loose.map((item) => (
                  <li key={item.id}>
                    <ItemCard {...cardProps(item)} />
                  </li>
                ))}
              </ul>
            )}
          </DropZone>

          {/* ── Compartimentos ── */}
          <div className="space-y-2">
            <Eyebrow
              tone="accent"
              size="xs"
              as="div"
              className="border-b border-dashed border-border pb-1 tracking-[0.3em]"
            >
              Compartimentos
            </Eyebrow>
            {storages.length === 0 ? (
              <Text variant="help">
                Compre uma bolsa, coldre ou mochila pra ganhar compartimentos onde guardar shurikens,
                kunais, bombas etc.
              </Text>
            ) : (
              storages.map((storage) => (
                <StorageCard
                  key={storage.id}
                  storage={storage}
                  itemsByRef={itemsByRef}
                  cardProps={cardProps}
                />
              ))
            )}
          </div>
        </div>
      </DndContext>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Adicionar item"
        description="Clique pra adicionar; ajuste a quantidade no contador"
        size="lg"
        footer={
          <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
            Fechar
          </Button>
        }
      >
        <EquipmentPicker
          catalog={catalog}
          quantityByCode={quantityByCode}
          onAdd={addByCode}
          onRemove={removeByCode}
          onQuantity={quantityByCodeChange}
        />
      </Modal>
    </div>
  );
}

function OccupancyMeter({ occupancy }: { occupancy: ReturnType<typeof summarizeOccupancy> }) {
  const penalised = occupancy.excess > 0;
  return (
    <div className="flex flex-col gap-1">
      <Eyebrow tone="accent" size="xs" as="div" className="tracking-[0.3em]">
        Compartimentos ocupados
      </Eyebrow>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-serif text-lg font-medium',
            penalised ? 'text-warning' : 'text-ice-bright',
          )}
        >
          {occupancy.occupied}
        </span>
        <span className="font-body text-xs text-ink-muted">
          ocupados · {occupancy.provided} disponíveis · limite {occupancy.freeLimit}
        </span>
      </div>
      {penalised ? (
        <Alert tone="warning" className="mt-1">
          {occupancy.excess} acima do limite: −{occupancy.movementPenalty}m de deslocamento e −
          {occupancy.precisionPenalty} de precisão em testes de mobilidade/Força/Agilidade.
        </Alert>
      ) : null}
    </div>
  );
}

function DropZone({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div>
      <Eyebrow
        tone="deep"
        size="xs"
        as="div"
        className="mb-1.5 border-b border-dashed border-border pb-1 tracking-[0.3em]"
      >
        {label}
      </Eyebrow>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-24 rounded border p-2 transition-colors',
          isOver ? 'border-ice bg-ice-deep/15' : 'border-border bg-bg-card/30',
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Card de um item de armazenamento — contém N compartimentos (slots) dentro. */
function StorageCard({
  storage,
  itemsByRef,
  cardProps,
}: {
  storage: FichaInventoryItem;
  itemsByRef: Map<string, FichaInventoryItem[]>;
  cardProps: (item: FichaInventoryItem) => CardProps;
}) {
  const n = Math.max(0, Math.floor(storage.compartmentBonus * storage.quantity));
  const slotIds = Array.from({ length: n }, (_, i) => `${storage.id}#${i}`);
  const used = slotIds.filter((id) => (itemsByRef.get(id)?.length ?? 0) > 0).length;

  return (
    <div className="rounded border border-ice-deep/40 bg-ice-deep/[0.06] p-2">
      <div className="mb-2 flex items-center justify-between">
        <Eyebrow tone="accent" size="xs" as="div" className="tracking-[0.25em]">
          {storage.name}
          {storage.quantity > 1 ? ` ×${storage.quantity}` : ''}
        </Eyebrow>
        <span className="font-body text-[10px] text-ink-muted">
          {used}/{n} compartimento{n > 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid gap-2">
        {slotIds.map((id, i) => (
          <Slot key={id} id={id} index={i} items={itemsByRef.get(id) ?? []} cardProps={cardProps} />
        ))}
      </div>
    </div>
  );
}

/** Um compartimento (slot) dentro de um item de armazenamento — alvo do drop. */
function Slot({
  id,
  index,
  items,
  cardProps,
}: {
  id: string;
  index: number;
  items: ReadonlyArray<FichaInventoryItem>;
  cardProps: (item: FichaInventoryItem) => CardProps;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const shared = items.length > 1;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded border border-dashed p-1.5 transition-colors',
        isOver ? 'border-ice bg-ice-deep/15' : 'border-border',
      )}
    >
      {items.length === 0 ? (
        <p className="px-1 py-2 text-center font-body text-[11px] text-ink-faint">
          Compartimento {index + 1} · vazio
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {items.map((item) => {
            const cap = itemCapacity(item.itemsPerCompartment, shared);
            const over = item.quantity > cap;
            return (
              <li key={item.id}>
                <ItemCard
                  {...cardProps(item)}
                  capacityNote={
                    <span
                      className={cn('font-body text-[10px]', over ? 'text-warning' : 'text-ink-muted')}
                    >
                      {item.quantity}/{cap}
                      {over ? ' ⚠' : ''}
                    </span>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ZoneHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid place-items-center px-3 py-4 text-center">
      <Text variant="help">{children}</Text>
    </div>
  );
}

type CardProps = {
  item: FichaInventoryItem;
  onQuantity: (q: number) => void;
  onRemove: () => void;
};

function ItemCard({
  item,
  onQuantity,
  onRemove,
  capacityNote,
}: CardProps & { capacityNote?: React.ReactNode }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id: item.id });
  const meta = [item.damage && `dano ${item.damage}`, item.range].filter(Boolean).join(' · ');

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={cn(
        'flex items-start gap-2 rounded border bg-bg-card-2 p-2.5 transition-shadow',
        isDragging ? 'z-10 border-ice shadow-hero' : 'border-border',
      )}
    >
      {/* Corpo = alça de arraste */}
      <div {...listeners} {...attributes} className="min-w-0 flex-1 cursor-grab active:cursor-grabbing">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="font-body text-sm text-ink">{item.name}</p>
          <span className="font-display text-[8px] uppercase tracking-[0.25em] text-ice-deep">
            {KIND_LABEL[item.kind ?? ''] ?? item.kind}
          </span>
          {meta ? (
            <Badge tone="neutral" variant="soft" size="xs">
              {meta}
            </Badge>
          ) : null}
          {item.negligible ? (
            <span className="font-body text-[10px] italic text-ink-faint">desprezível</span>
          ) : null}
          <ItemInfo item={item} />
          {capacityNote}
        </div>
      </div>

      {/* Controles (fora da alça) */}
      <div className="flex shrink-0 items-center gap-1">
        <QtyStepper value={item.quantity} onChange={onQuantity} />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${item.name}`}
          className="grid h-7 w-7 place-items-center rounded text-ink-faint transition hover:bg-danger/20 hover:text-danger"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function QtyStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="flex items-center overflow-hidden rounded border border-border">
      <button
        type="button"
        className="grid h-7 w-6 place-items-center text-ink-muted transition-colors hover:bg-bg-card-2 hover:text-ice disabled:opacity-40"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <span className="min-w-6 px-0.5 text-center font-serif text-sm text-ice-bright">{value}</span>
      <button
        type="button"
        className="grid h-7 w-6 place-items-center text-ink-muted transition-colors hover:bg-bg-card-2 hover:text-ice"
        onClick={() => onChange(Math.min(999, value + 1))}
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
}

/** Item otimista temporário enquanto o servidor não devolve o real (via refresh). */
function optimisticItem(code: string, cat: EquipmentPickerItem | undefined): FichaInventoryItem {
  const isWeapon = cat?.kind === 'WEAPON';
  return {
    id: `temp-${code}`,
    equipmentCode: code,
    name: cat?.name ?? code,
    kind: cat?.kind ?? null,
    subtype: cat?.subtype ?? null,
    category: cat?.category ?? null,
    quantity: 1,
    equipped: false,
    damage: cat?.damage ?? null,
    damageType: cat?.damageType ?? null,
    range: cat?.range ?? null,
    description: null,
    shortDescription: cat?.shortDescription ?? null,
    isWeapon,
    weaponDamageValue: null,
    attackKind: null,
    acceptsAcuidade: false,
    itemsPerCompartment: 1,
    compartmentsPerStack: 1,
    compartmentBonus: 0,
    negligible: false,
    compartmentRef: null,
    mixable: false,
    storable: false,
  };
}
