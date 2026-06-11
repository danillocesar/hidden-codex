'use server';

import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const JoinSchema = z.object({
  token: z.string().length(32),
  characterId: z.string().uuid().optional(),
});

/**
 * Entra em um Mundo via token de convite. O jogador pode opcionalmente informar
 * qual personagem usará neste Mundo (pode ser alterado depois).
 *
 * Se o usuário já é membro, atualiza o personagem selecionado (idempotente).
 */
export async function joinWorld(
  token: string,
  characterId: string | undefined,
): Promise<ActionResult<{ worldId: string }>> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  const parsed = JoinSchema.safeParse({ token, characterId });
  if (!parsed.success) {
    return { ok: false, error: 'Dados inválidos.' };
  }

  const world = await prisma.world.findFirst({
    where: { inviteToken: token, deletedAt: null },
    select: { id: true, gmId: true },
  });
  if (!world) return { ok: false, error: 'Link de convite inválido ou expirado.' };

  // Validar que o personagem pertence ao usuário (se informado)
  if (characterId) {
    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: session.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!character) return { ok: false, error: 'Personagem não encontrado.' };
  }

  // Upsert: cria o membro ou atualiza o personagem selecionado
  await prisma.worldMember.upsert({
    where: { worldId_userId: { worldId: world.id, userId: session.user.id } },
    create: {
      worldId: world.id,
      userId: session.user.id,
      characterId: characterId ?? null,
    },
    update: {
      characterId: characterId ?? null,
    },
  });

  return { ok: true, data: { worldId: world.id } };
}

/**
 * Atualiza o personagem selecionado de um membro em um Mundo.
 * O jogador pode trocar seu personagem enquanto estiver no Mundo.
 */
export async function updateWorldCharacter(
  worldId: string,
  characterId: string | null,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  // Validar que é membro do mundo
  const member = await prisma.worldMember.findFirst({
    where: { worldId, userId: session.user.id },
    select: { id: true },
  });
  if (!member) return { ok: false, error: 'Você não é membro deste Mundo.' };

  // Validar propriedade do personagem
  if (characterId) {
    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: session.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!character) return { ok: false, error: 'Personagem não encontrado.' };
  }

  await prisma.worldMember.update({
    where: { id: member.id },
    data: { characterId },
  });

  return { ok: true, data: undefined };
}

/**
 * Remove um membro do Mundo. O próprio jogador pode sair, ou o GM pode remover.
 */
export async function leaveWorld(
  worldId: string,
  targetUserId?: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  const userId = targetUserId ?? session.user.id;

  // Se está removendo outro usuário, verifica que é GM
  if (targetUserId && targetUserId !== session.user.id) {
    const world = await prisma.world.findFirst({
      where: { id: worldId, gmId: session.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!world) return { ok: false, error: 'Acesso negado.' };
  }

  await prisma.worldMember.deleteMany({
    where: { worldId, userId },
  });

  return { ok: true, data: undefined };
}
