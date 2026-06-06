'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { assertGm } from '@/lib/worlds/permissions';

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type WorldNpcView = {
  id: string;
  characterId: string;
  characterName: string;
  characterPortraitUrl: string | null;
  characterCampaignLevel: number;
  label: string | null;
};

/**
 * Retorna as fichas do Mestre associadas ao Mundo (roster de NPCs).
 */
export async function getWorldNpcs(worldId: string, _userId: string): Promise<WorldNpcView[]> {
  const npcs = await prisma.worldNpc.findMany({
    where: { worldId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      label: true,
      character: {
        select: {
          id: true,
          name: true,
          portraitUrl: true,
          campaignLevel: true,
        },
      },
    },
  });

  return npcs.map((n) => ({
    id: n.id,
    characterId: n.character.id,
    characterName: n.character.name,
    characterPortraitUrl: n.character.portraitUrl,
    characterCampaignLevel: n.character.campaignLevel,
    label: n.label,
  }));
}

/**
 * Adiciona uma ficha do GM ao roster de NPCs do Mundo.
 * Valida que o personagem pertence ao GM e não está já no roster.
 */
export async function addNpcToWorld(
  worldId: string,
  characterId: string,
  label?: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  // O personagem deve pertencer ao GM
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!character) return { ok: false, error: 'Personagem não encontrado.' };

  await prisma.worldNpc.upsert({
    where: { worldId_characterId: { worldId, characterId } },
    create: { worldId, characterId, label: label ?? null },
    update: { label: label ?? null },
  });

  revalidatePath(`/worlds/${worldId}`);
  return { ok: true, data: undefined };
}

export async function removeNpcFromWorld(
  worldId: string,
  npcId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const npc = await prisma.worldNpc.findFirst({
    where: { id: npcId, worldId },
    select: { id: true },
  });
  if (!npc) return { ok: false, error: 'NPC não encontrado.' };

  await prisma.worldNpc.delete({ where: { id: npcId } });

  revalidatePath(`/worlds/${worldId}`);
  return { ok: true, data: undefined };
}
