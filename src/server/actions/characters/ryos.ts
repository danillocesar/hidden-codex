'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

/**
 * Ação de mesa: ajustar o saldo de Ryos (moeda) de um personagem.
 *
 * Owner-only. Recebe o valor ABSOLUTO final (o client computa ganhar/gastar) e
 * o impõe com piso 0 e cap. Mantém a simplicidade do padrão das ações de combate
 * (`combat.ts`): valida, confere posse, persiste, revalida a ficha.
 */

const MAX_RYOS = 99_999_999;

const setRyosInput = z.object({
  characterId: z.string().uuid(),
  value: z.number().int().min(0).max(MAX_RYOS),
});

export type SetRyosResult = { ok: true; ryos: number } | { ok: false; error: string };

export async function setRyos(raw: z.infer<typeof setRyosInput>): Promise<SetRyosResult> {
  const parsed = setRyosInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  const character = await prisma.character.findFirst({
    where: { id: parsed.data.characterId, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!character) return { ok: false, error: 'Ficha não encontrada.' };

  await prisma.character.update({
    where: { id: character.id },
    data: { ryos: parsed.data.value },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true, ryos: parsed.data.value };
}
