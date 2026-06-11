'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { isUploadedUrlUnder } from '@/lib/storage/publicUrl';

export type SetPortraitResult = { ok: true } | { ok: false; error: string };

/**
 * Define/limpa o retrato (avatar) do personagem. Owner-only. A URL vem do
 * upload em `/api/upload/character-portrait` (`/uploads/portraits/...`).
 */
export async function setCharacterPortrait(
  characterId: string,
  url: string | null,
): Promise<SetPortraitResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  if (url !== null && (!isUploadedUrlUnder(url, 'portraits') || url.length > 300)) {
    return { ok: false, error: 'Imagem inválida.' };
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!character) return { ok: false, error: 'Ficha nao encontrada.' };

  await prisma.character.update({
    where: { id: character.id },
    data: { portraitUrl: url },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true };
}
