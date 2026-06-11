'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { assertGm } from '@/lib/worlds/permissions';

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const CampaignInputSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório.').max(80, 'Nome muito longo.'),
  description: z.string().max(500, 'Descrição muito longa.').optional(),
});

export async function createCampaign(
  worldId: string,
  formData: FormData,
): Promise<ActionResult<{ campaignId: string }>> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const parsed = CampaignInputSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const campaign = await prisma.campaign.create({
    data: {
      worldId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
    select: { id: true },
  });

  revalidatePath(`/worlds/${worldId}`);
  return { ok: true, data: { campaignId: campaign.id } };
}

export async function deleteCampaign(
  worldId: string,
  campaignId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  // Confirma que a campanha pertence ao mundo (anti-IDOR)
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, worldId, deletedAt: null },
    select: { id: true },
  });
  if (!campaign) return { ok: false, error: 'Campanha não encontrada.' };

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/worlds/${worldId}`);
  return { ok: true, data: undefined };
}

/**
 * Adiciona um WorldMember a uma Campanha. O GM passa o worldMemberId do jogador
 * (não o userId), garantindo que o jogador já pertence ao Mundo.
 */
export async function addToCampaign(
  worldId: string,
  campaignId: string,
  worldMemberId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  // Verificar que o WorldMember pertence a este Mundo
  const member = await prisma.worldMember.findFirst({
    where: { id: worldMemberId, worldId },
    select: { id: true },
  });
  if (!member) return { ok: false, error: 'Membro não encontrado neste Mundo.' };

  // Verificar que a campanha pertence ao Mundo
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, worldId, deletedAt: null },
    select: { id: true },
  });
  if (!campaign) return { ok: false, error: 'Campanha não encontrada.' };

  await prisma.campaignMember.upsert({
    where: { campaignId_worldMemberId: { campaignId, worldMemberId } },
    create: { campaignId, worldMemberId },
    update: {},
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${campaignId}`);
  return { ok: true, data: undefined };
}

export async function removeFromCampaign(
  worldId: string,
  campaignId: string,
  worldMemberId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  await prisma.campaignMember.deleteMany({
    where: { campaignId, worldMemberId },
  });

  revalidatePath(`/worlds/${worldId}/campaigns/${campaignId}`);
  return { ok: true, data: undefined };
}
