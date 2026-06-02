'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export type DeleteCharacterResult = { ok: true } | { ok: false; error: string };

/**
 * Soft delete de um personagem (seta `deletedAt`). Owner-only: rebusca o
 * personagem garantindo que pertence ao usuario logado antes de marcar.
 * Queries de listagem filtram `deletedAt: null`.
 */
export async function softDeleteCharacter(characterId: string): Promise<DeleteCharacterResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });

  if (!character) {
    return { ok: false, error: 'Ficha nao encontrada.' };
  }

  await prisma.character.update({
    where: { id: character.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/dashboard');
  return { ok: true };
}
