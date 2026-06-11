'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { assertGm } from '@/lib/worlds/permissions';

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export async function createCombat(
  worldId: string,
  campaignId: string,
  name: string,
): Promise<ActionResult<{ combatId: string }>> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const nameResult = z.string().min(1).max(80).safeParse(name);
  if (!nameResult.success) return { ok: false, error: 'Nome inválido.' };

  // Verificar que a campanha pertence ao Mundo
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, worldId, deletedAt: null },
    select: { id: true },
  });
  if (!campaign) return { ok: false, error: 'Campanha não encontrada.' };

  const combat = await prisma.combat.create({
    data: { campaignId, name: nameResult.data },
    select: { id: true },
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${campaignId}`);
  return { ok: true, data: { combatId: combat.id } };
}

/**
 * Adiciona um jogador da Campanha ao Combate.
 * Usa o worldMemberId para recuperar o characterId automaticamente.
 */
export async function addPlayerParticipant(
  worldId: string,
  combatId: string,
  worldMemberId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const combat = await prisma.combat.findFirst({
    where: { id: combatId, campaign: { worldId } },
    select: { id: true, campaignId: true },
  });
  if (!combat) return { ok: false, error: 'Combate não encontrado.' };

  // Verificar que o WorldMember é membro da Campanha
  const member = await prisma.campaignMember.findFirst({
    where: { worldMemberId, campaignId: combat.campaignId },
    select: { worldMember: { select: { characterId: true } } },
  });
  if (!member) return { ok: false, error: 'Jogador não é membro desta Campanha.' };

  const characterId = member.worldMember.characterId;
  if (!characterId) return { ok: false, error: 'Jogador não selecionou um personagem.' };

  // Evitar duplicatas
  const existing = await prisma.combatParticipant.findFirst({
    where: { combatId, characterId, kind: 'PLAYER' },
    select: { id: true },
  });
  if (existing) return { ok: false, error: 'Jogador já está neste Combate.' };

  const count = await prisma.combatParticipant.count({ where: { combatId } });

  await prisma.combatParticipant.create({
    data: {
      combatId,
      kind: 'PLAYER',
      characterId,
      displayOrder: count,
    },
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${combat.campaignId}/combats/${combatId}`);
  return { ok: true, data: undefined };
}

/**
 * Adiciona uma ficha do GM (WorldNpc) ao Combate como GM_CHARACTER.
 */
export async function addNpcParticipant(
  worldId: string,
  combatId: string,
  characterId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const combat = await prisma.combat.findFirst({
    where: { id: combatId, campaign: { worldId } },
    select: { id: true, campaignId: true },
  });
  if (!combat) return { ok: false, error: 'Combate não encontrado.' };

  // Verificar que o personagem está no roster do Mundo
  const npc = await prisma.worldNpc.findFirst({
    where: { worldId, characterId },
    select: { id: true },
  });
  if (!npc) return { ok: false, error: 'Personagem não está no roster do Mundo.' };

  const count = await prisma.combatParticipant.count({ where: { combatId } });

  await prisma.combatParticipant.create({
    data: {
      combatId,
      kind: 'GM_CHARACTER',
      characterId,
      displayOrder: count,
    },
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${combat.campaignId}/combats/${combatId}`);
  return { ok: true, data: undefined };
}

/**
 * Adiciona um inimigo genérico (sem ficha) ao Combate.
 */
export async function addGenericEnemy(
  worldId: string,
  combatId: string,
  enemyName: string,
  enemyMaxHp: number,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const nameResult = z.string().min(1).max(80).safeParse(enemyName);
  if (!nameResult.success) return { ok: false, error: 'Nome inválido.' };

  const hpResult = z.number().int().positive().safeParse(enemyMaxHp);
  if (!hpResult.success) return { ok: false, error: 'HP inválido.' };

  const combat = await prisma.combat.findFirst({
    where: { id: combatId, campaign: { worldId } },
    select: { id: true, campaignId: true },
  });
  if (!combat) return { ok: false, error: 'Combate não encontrado.' };

  const count = await prisma.combatParticipant.count({ where: { combatId } });

  await prisma.combatParticipant.create({
    data: {
      combatId,
      kind: 'GENERIC_ENEMY',
      enemyName: nameResult.data,
      enemyMaxHp: hpResult.data,
      enemyCurrentHp: hpResult.data,
      displayOrder: count,
    },
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${combat.campaignId}/combats/${combatId}`);
  return { ok: true, data: undefined };
}

export async function removeParticipant(
  worldId: string,
  combatId: string,
  participantId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const participant = await prisma.combatParticipant.findFirst({
    where: { id: participantId, combatId },
    select: { id: true, combat: { select: { campaignId: true } } },
  });
  if (!participant) return { ok: false, error: 'Participante não encontrado.' };

  await prisma.combatParticipant.delete({ where: { id: participantId } });

  revalidatePath(
    `/worlds/${worldId}/campaigns/${participant.combat.campaignId}/combats/${combatId}`,
  );
  return { ok: true, data: undefined };
}

export async function setInitiative(
  worldId: string,
  combatId: string,
  participantId: string,
  initiative: number | null,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const participant = await prisma.combatParticipant.findFirst({
    where: { id: participantId, combatId, combat: { campaign: { worldId } } },
    select: { id: true, combat: { select: { campaignId: true } } },
  });
  if (!participant) return { ok: false, error: 'Participante não encontrado.' };

  await prisma.combatParticipant.update({
    where: { id: participantId },
    data: { initiative },
  });

  revalidatePath(
    `/worlds/${worldId}/campaigns/${participant.combat.campaignId}/combats/${combatId}`,
  );
  return { ok: true, data: undefined };
}

/**
 * Atualiza o HP atual de um inimigo genérico. Apenas GM pode executar.
 */
export async function updateEnemyHp(
  worldId: string,
  combatId: string,
  participantId: string,
  currentHp: number,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const participant = await prisma.combatParticipant.findFirst({
    where: {
      id: participantId,
      combatId,
      combat: { campaign: { worldId } },
    },
    select: {
      id: true,
      kind: true,
      combat: { select: { campaignId: true } },
    },
  });
  if (!participant) return { ok: false, error: 'Participante não encontrado.' };

  await prisma.combatParticipant.update({
    where: { id: participantId },
    data: { enemyCurrentHp: currentHp },
  });

  revalidatePath(
    `/worlds/${worldId}/campaigns/${participant.combat.campaignId}/combats/${combatId}`,
  );
  return { ok: true, data: undefined };
}

export async function activateCombat(
  worldId: string,
  combatId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const combat = await prisma.combat.findFirst({
    where: { id: combatId, campaign: { worldId }, status: 'SETUP' },
    select: { id: true, campaignId: true },
  });
  if (!combat) return { ok: false, error: 'Combate não encontrado ou já ativo.' };

  await prisma.combat.update({
    where: { id: combatId },
    data: { status: 'ACTIVE' },
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${combat.campaignId}/combats/${combatId}`);
  return { ok: true, data: undefined };
}

export async function endCombat(worldId: string, combatId: string): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const combat = await prisma.combat.findFirst({
    where: { id: combatId, campaign: { worldId }, status: 'ACTIVE' },
    select: { id: true, campaignId: true },
  });
  if (!combat) return { ok: false, error: 'Combate não encontrado ou já encerrado.' };

  await prisma.combat.update({
    where: { id: combatId },
    data: { status: 'ENDED', endedAt: new Date() },
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${combat.campaignId}/combats/${combatId}`);
  return { ok: true, data: undefined };
}
