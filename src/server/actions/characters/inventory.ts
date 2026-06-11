'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export type InventoryActionResult = { ok: true; id?: string } | { ok: false; error: string };
export type SetInventoryItemEquippedResult = { ok: true } | { ok: false; error: string };

/** Rebusca um item garantindo que pertence a um personagem do usuário logado. */
async function findOwnedItem(
  itemId: string,
  userId: string,
): Promise<{ id: string; characterId: string } | null> {
  return prisma.characterInventoryItem.findFirst({
    where: { id: itemId, character: { userId, deletedAt: null } },
    select: { id: true, characterId: true },
  });
}

const addInput = z.object({
  characterId: z.string().uuid(),
  equipmentCode: z.string().min(1).max(80).nullable().optional(),
  customName: z.string().trim().min(1).max(80).nullable().optional(),
  quantity: z.number().int().min(1).max(999).default(1),
});

export type AddInventoryItemInput = z.infer<typeof addInput>;

/**
 * Adiciona um item ao inventário — do catálogo (`equipmentCode`) ou custom
 * (`customName`). Owner-only. Se o item de catálogo já existe no inventário,
 * apenas soma a quantidade (mescla).
 */
export async function addInventoryItem(raw: AddInventoryItemInput): Promise<InventoryActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const parsed = addInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const input = parsed.data;
  if (!input.equipmentCode && !input.customName) {
    return { ok: false, error: 'Informe um equipamento do catálogo ou um nome custom.' };
  }

  const character = await prisma.character.findFirst({
    where: { id: input.characterId, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!character) return { ok: false, error: 'Ficha nao encontrada.' };

  let equipmentId: string | null = null;
  if (input.equipmentCode) {
    const eq = await prisma.equipment.findUnique({
      where: { code: input.equipmentCode },
      select: { id: true },
    });
    if (!eq) return { ok: false, error: 'Equipamento não encontrado no catálogo.' };
    equipmentId = eq.id;

    // Mescla quantidade se já houver esse equipamento (não custom) no inventário.
    const existing = await prisma.characterInventoryItem.findFirst({
      where: { characterId: character.id, equipmentId, customName: null },
      select: { id: true, quantity: true },
    });
    if (existing) {
      await prisma.characterInventoryItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(999, existing.quantity + input.quantity) },
      });
      revalidatePath(`/characters/${character.id}`);
      return { ok: true, id: existing.id };
    }
  }

  const created = await prisma.characterInventoryItem.create({
    data: {
      characterId: character.id,
      equipmentId,
      customName: equipmentId ? null : (input.customName ?? null),
      quantity: input.quantity,
    },
    select: { id: true },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true, id: created.id };
}

/** Remove um item do inventário. Owner-only. */
export async function removeInventoryItem(itemId: string): Promise<InventoryActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const item = await findOwnedItem(itemId, session.user.id);
  if (!item) return { ok: false, error: 'Item nao encontrado.' };

  await prisma.characterInventoryItem.delete({ where: { id: item.id } });
  revalidatePath(`/characters/${item.characterId}`);
  return { ok: true };
}

const qtyInput = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999),
});

/** Lê o bônus de compartimentos de um item de armazenamento (effects JSON). */
function readCompartmentBonus(effects: unknown): number {
  if (!effects || typeof effects !== 'object' || Array.isArray(effects)) return 0;
  const rec = effects as Record<string, unknown>;
  const v = rec.compartmentBonus ?? rec.compartmentModifier;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

const assignInput = z.object({
  itemId: z.string().uuid(),
  /** `<storageItemId>#<index>` ou null pra soltar. */
  compartmentRef: z.string().max(120).nullable(),
});

/**
 * Guarda (ou solta) um item num compartimento. Owner-only. Quando `compartmentRef`
 * é dado, valida que ele aponta pra um compartimento real de um item de
 * armazenamento DO MESMO personagem (formato `<storageId>#<index>`, índice dentro
 * do bônus). A regra de mesclagem/capacidade é validada no client (show+warn).
 */
export async function assignItemToCompartment(
  itemId: string,
  compartmentRef: string | null,
): Promise<InventoryActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const parsed = assignInput.safeParse({ itemId, compartmentRef });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const item = await findOwnedItem(itemId, session.user.id);
  if (!item) return { ok: false, error: 'Item nao encontrado.' };

  if (compartmentRef !== null) {
    const hash = compartmentRef.lastIndexOf('#');
    const storageId = hash > 0 ? compartmentRef.slice(0, hash) : '';
    const index = hash > 0 ? Number(compartmentRef.slice(hash + 1)) : NaN;
    if (!storageId || !Number.isInteger(index) || index < 0) {
      return { ok: false, error: 'Compartimento inválido.' };
    }
    const storage = await prisma.characterInventoryItem.findFirst({
      where: { id: storageId, characterId: item.characterId },
      select: { quantity: true, equipment: { select: { effects: true } } },
    });
    // Compartimentos fornecidos = bônus × quantidade (3 coldres = 3 compartimentos).
    const provided = storage ? readCompartmentBonus(storage.equipment?.effects) * storage.quantity : 0;
    if (!storage || provided <= 0 || index >= provided) {
      return { ok: false, error: 'Compartimento não pertence a este personagem.' };
    }
  }

  await prisma.characterInventoryItem.update({
    where: { id: item.id },
    data: { compartmentRef },
  });
  revalidatePath(`/characters/${item.characterId}`);
  return { ok: true };
}

/** Ajusta a quantidade de um item. Owner-only. */
export async function updateInventoryQuantity(
  itemId: string,
  quantity: number,
): Promise<InventoryActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const parsed = qtyInput.safeParse({ itemId, quantity });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Quantidade inválida.' };
  }

  const item = await findOwnedItem(itemId, session.user.id);
  if (!item) return { ok: false, error: 'Item nao encontrado.' };

  await prisma.characterInventoryItem.update({
    where: { id: item.id },
    data: { quantity: parsed.data.quantity },
  });
  revalidatePath(`/characters/${item.characterId}`);
  return { ok: true };
}

/**
 * Marca/desmarca um item de inventario como equipado. Owner-only: rebusca o
 * item garantindo que pertence a um personagem do usuario logado antes de
 * mutar. Alimenta o card "Combate Rapido" da ficha.
 */
export async function setInventoryItemEquipped(
  itemId: string,
  equipped: boolean,
): Promise<SetInventoryItemEquippedResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const item = await prisma.characterInventoryItem.findFirst({
    where: { id: itemId, character: { userId: session.user.id, deletedAt: null } },
    select: { id: true, characterId: true },
  });

  if (!item) {
    return { ok: false, error: 'Item nao encontrado.' };
  }

  await prisma.characterInventoryItem.update({
    where: { id: item.id },
    data: { equipped },
  });

  revalidatePath(`/characters/${item.characterId}`);
  return { ok: true };
}
