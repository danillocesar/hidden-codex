'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { assertGm } from '@/lib/worlds/permissions';

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

function generateInviteToken(): string {
  return randomBytes(16).toString('hex');
}

const WorldInputSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório.').max(80, 'Nome muito longo.'),
  description: z.string().max(500, 'Descrição muito longa.').optional(),
});

export async function createWorld(
  formData: FormData,
): Promise<ActionResult<{ worldId: string }>> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  const parsed = WorldInputSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const world = await prisma.world.create({
    data: {
      gmId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      inviteToken: generateInviteToken(),
      // GM é automaticamente adicionado como WorldMember
      members: { create: { userId: session.user.id } },
    },
    select: { id: true },
  });

  revalidatePath('/worlds');
  return { ok: true, data: { worldId: world.id } };
}

export async function updateWorld(
  worldId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const parsed = WorldInputSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  await prisma.world.update({
    where: { id: worldId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
  });

  revalidatePath(`/worlds/${worldId}`);
  return { ok: true, data: undefined };
}

export async function deleteWorld(worldId: string): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  await prisma.world.update({
    where: { id: worldId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/worlds');
  return { ok: true, data: undefined };
}

/**
 * Gera um novo token de convite para o Mundo, invalidando o anterior.
 * Apenas o GM pode executar esta ação.
 */
export async function regenerateInviteToken(
  worldId: string,
): Promise<ActionResult<{ inviteToken: string }>> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const updated = await prisma.world.update({
    where: { id: worldId },
    data: { inviteToken: generateInviteToken() },
    select: { inviteToken: true },
  });

  revalidatePath(`/worlds/${worldId}`);
  return { ok: true, data: { inviteToken: updated.inviteToken } };
}
