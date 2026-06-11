import { FREE_COMPARTMENT_LIMIT } from './inventory';

/**
 * Regras dos COMPARTIMENTOS como cards (Livro Básico p.127):
 * - Itens de armazenamento fornecem N compartimentos (um "slot" cada).
 * - Cada slot guarda 1 item à capacidade cheia (`itemsPerCompartment`), OU 2
 *   itens **mescláveis** (arremesso simples ou explosivos) à metade da
 *   capacidade cada (5 kunais + 9 shurikens).
 * - Até 3 compartimentos preenchidos sem penalidade (ver `summarizeOccupancy`).
 */

/** Máximo de itens distintos num mesmo compartimento (mesclagem). */
export const MAX_ITEMS_PER_COMPARTMENT = 2 as const;

export type CompartmentSlot = {
  /** Id estável do slot: `<storageItemId>#<index>`. */
  id: string;
  storageItemId: string;
  index: number;
  /** Título exibido (nome do item de armazenamento, + "#i" quando fornece >1). */
  title: string;
};

/** Deriva os slots de compartimento fornecidos pelos itens de armazenamento. */
export function deriveCompartmentSlots(
  storages: ReadonlyArray<{ id: string; name: string; compartmentBonus: number }>,
): CompartmentSlot[] {
  const slots: CompartmentSlot[] = [];
  for (const s of storages) {
    const n = Math.max(0, Math.floor(s.compartmentBonus));
    for (let i = 0; i < n; i += 1) {
      slots.push({
        id: `${s.id}#${i}`,
        storageItemId: s.id,
        index: i,
        title: n > 1 ? `${s.name} #${i + 1}` : s.name,
      });
    }
  }
  return slots;
}

/** Capacidade de um item num compartimento: cheia sozinho, metade se compartilhado (round down). */
export function itemCapacity(itemsPerCompartment: number, shared: boolean): number {
  const full = Math.max(1, itemsPerCompartment);
  return shared ? Math.floor(full / 2) : full;
}

export type DropCheck = { ok: true } | { ok: false; reason: string };

/**
 * Pode soltar `incoming` num compartimento que já contém `existing`?
 * Vazio → sim. 1 item → só mescla se AMBOS forem mescláveis. 2 itens → cheio.
 */
export function canDropInCompartment(
  incoming: { id: string; mixable: boolean },
  existing: ReadonlyArray<{ id: string; mixable: boolean }>,
): DropCheck {
  const others = existing.filter((e) => e.id !== incoming.id);
  if (others.length === 0) return { ok: true };
  if (others.length >= MAX_ITEMS_PER_COMPARTMENT) {
    return { ok: false, reason: 'Compartimento cheio (máx. 2 itens mesclados).' };
  }
  if (!incoming.mixable || !others.every((o) => o.mixable)) {
    return {
      ok: false,
      reason: 'Só armas de arremesso simples ou explosivos podem dividir um compartimento.',
    };
  }
  return { ok: true };
}

/** Item acima da capacidade do compartimento (quantidade > capacidade aplicável)? */
export function isOverCapacity(
  itemsPerCompartment: number,
  quantity: number,
  shared: boolean,
): boolean {
  return quantity > itemCapacity(itemsPerCompartment, shared);
}

export type OccupancySummary = {
  /** Compartimentos de armazenamento preenchidos (≥1 item). */
  filledSlots: number;
  /** Itens soltos que ocupam compartimento por conta própria (armas auto-carregadas). */
  looseOccupying: number;
  /** Total ocupado = preenchidos + soltos. */
  occupied: number;
  /** Slots fornecidos no total. */
  provided: number;
  freeLimit: number;
  excess: number;
  movementPenalty: number;
  precisionPenalty: number;
};

/**
 * Consolida a ocupação pra penalidade do limite de 3 (Livro p.127).
 * `looseOccupying` = itens não-desprezíveis fora de qualquer bolsa que se
 * auto-carregam (espadas, arcos) — cada um conta 1.
 */
export function summarizeOccupancy(args: {
  provided: number;
  filledSlots: number;
  looseOccupying: number;
}): OccupancySummary {
  const occupied = args.filledSlots + args.looseOccupying;
  const excess = Math.max(0, occupied - FREE_COMPARTMENT_LIMIT);
  return {
    filledSlots: args.filledSlots,
    looseOccupying: args.looseOccupying,
    occupied,
    provided: args.provided,
    freeLimit: FREE_COMPARTMENT_LIMIT,
    excess,
    movementPenalty: excess * 3,
    precisionPenalty: excess,
  };
}
