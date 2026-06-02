'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  DEFAULT_SECTION_COVERS,
  isAllowedSectionCoverUrl,
  isSectionCoverKey,
  mergeSectionCoverUiState,
} from '@/lib/character/sectionCovers';

export type SetCharacterSectionCoverResult = { ok: true } | { ok: false; error: string };

export async function setCharacterSectionCover(
  characterId: string,
  key: string,
  url: string | null,
): Promise<SetCharacterSectionCoverResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  if (!isSectionCoverKey(key)) {
    return { ok: false, error: 'Separador invalido.' };
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: {
      id: true,
      uiState: true,
      images: { select: { url: true } },
    },
  });

  if (!character) {
    return { ok: false, error: 'Ficha nao encontrada.' };
  }

  if (url !== null) {
    if (!isAllowedSectionCoverUrl(url)) {
      return { ok: false, error: 'Imagem invalida.' };
    }

    const isDefault = Object.values(DEFAULT_SECTION_COVERS).includes(url);
    const belongsToCharacter = character.images.some((image) => image.url === url);
    if (!isDefault && !belongsToCharacter) {
      return { ok: false, error: 'Imagem nao pertence a esta ficha.' };
    }
  }

  const nextUiState = mergeSectionCoverUiState(character.uiState, key, url);
  await prisma.character.update({
    where: { id: character.id },
    data: { uiState: nextUiState as Prisma.InputJsonValue },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true };
}
