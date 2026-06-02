'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export type SetInventoryItemEquippedResult = { ok: true } | { ok: false; error: string };

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
