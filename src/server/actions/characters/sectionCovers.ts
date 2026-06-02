'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  DEFAULT_SECTION_COVERS,
  isAllowedSectionCoverUrl,
  isSectionCoverKey,
  isValidCoverPosition,
  isValidCoverZoom,
  mergeFichaBackgroundUiState,
  mergeSectionCoverPositionUiState,
  mergeSectionCoverZoomUiState,
  mergeSectionCoverUiState,
} from '@/lib/character/sectionCovers';

export type SetCharacterSectionCoverResult = { ok: true } | { ok: false; error: string };

/**
 * Define/limpa o fundo da ficha inteira (imagem com transparência + P&B).
 * Owner-only; a imagem deve pertencer à ficha (ou null pra remover).
 */
export async function setCharacterFichaBackground(
  characterId: string,
  url: string | null,
): Promise<SetCharacterSectionCoverResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: { id: true, uiState: true, images: { select: { url: true } } },
  });
  if (!character) return { ok: false, error: 'Ficha nao encontrada.' };

  if (url !== null) {
    if (!isAllowedSectionCoverUrl(url) || !character.images.some((img) => img.url === url)) {
      return { ok: false, error: 'Imagem não pertence a esta ficha.' };
    }
  }

  const nextUiState = mergeFichaBackgroundUiState(character.uiState, url);
  await prisma.character.update({
    where: { id: character.id },
    data: { uiState: nextUiState as Prisma.InputJsonValue },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true };
}

/**
 * Salva a posição (object-position "X% Y%") da imagem de capa de uma seção,
 * pra o dono reposicionar a foto dentro do card. Owner-only.
 */
export async function setCharacterSectionCoverPosition(
  characterId: string,
  key: string,
  position: string,
  zoom: number,
): Promise<SetCharacterSectionCoverResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };
  if (!isSectionCoverKey(key)) return { ok: false, error: 'Separador invalido.' };
  if (!isValidCoverPosition(position)) return { ok: false, error: 'Posicao invalida.' };
  if (!isValidCoverZoom(zoom)) return { ok: false, error: 'Zoom invalido.' };

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: { id: true, uiState: true },
  });
  if (!character) return { ok: false, error: 'Ficha nao encontrada.' };

  const withPosition = mergeSectionCoverPositionUiState(character.uiState, key, position);
  const nextUiState = mergeSectionCoverZoomUiState(withPosition, key, zoom);
  await prisma.character.update({
    where: { id: character.id },
    data: { uiState: nextUiState as Prisma.InputJsonValue },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true };
}

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
