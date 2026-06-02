'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { parseLearnedEffects } from '@/lib/character/mapPrismaToCore';

export type JutsuActionResult = { ok: true; id?: string } | { ok: false; error: string };

const createJutsuInput = z.object({
  characterId: z.string().uuid(),
  name: z.string().trim().min(1, 'Nome obrigatório.').max(80),
  powerCode: z.string().min(1).max(60),
  effectCode: z.string().min(1).max(80),
  levels: z.array(z.number().int().min(1).max(30)).min(1, 'Escolha ao menos um nível.').max(30),
  imageUrl: z.string().startsWith('/uploads/').max(300).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

export type CreateJutsuInput = z.infer<typeof createJutsuInput>;

/**
 * Cria um jutsu real do personagem a partir de um poder + efeito aprendido,
 * com os níveis em que pode ser conjurado (1..nível do poder). Owner-only e
 * defensivo: revalida poder/efeito/níveis no servidor.
 */
export async function createJutsu(raw: CreateJutsuInput): Promise<JutsuActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const parsed = createJutsuInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const input = parsed.data;

  const character = await prisma.character.findFirst({
    where: { id: input.characterId, userId: session.user.id, deletedAt: null },
    select: {
      id: true,
      learnedEffects: true,
      powers: { select: { powerId: true, level: true, power: { select: { code: true } } } },
      images: { select: { url: true } },
    },
  });
  if (!character) return { ok: false, error: 'Ficha nao encontrada.' };

  const power = character.powers.find((p) => p.power.code === input.powerCode);
  if (!power) return { ok: false, error: 'Poder não pertence a este personagem.' };

  const learned = parseLearnedEffects(character.learnedEffects);
  if (!(learned[input.powerCode] ?? []).includes(input.effectCode)) {
    return { ok: false, error: 'Efeito não foi aprendido para este poder.' };
  }

  const invalidLevel = input.levels.find((lvl) => lvl < 1 || lvl > power.level);
  if (invalidLevel !== undefined) {
    return {
      ok: false,
      error: `Nível ${invalidLevel} fora do alcance do poder (1–${power.level}).`,
    };
  }

  if (input.imageUrl && !character.images.some((img) => img.url === input.imageUrl)) {
    return { ok: false, error: 'Imagem não pertence a esta ficha.' };
  }

  const effect = await prisma.powerEffect.findUnique({
    where: { code: input.effectCode },
    select: { id: true },
  });
  if (!effect) return { ok: false, error: 'Efeito não encontrado no catálogo.' };

  const levels = Array.from(new Set(input.levels)).sort((a, b) => a - b);

  const created = await prisma.characterJutsu.create({
    data: {
      characterId: character.id,
      powerId: power.powerId,
      powerEffectId: effect.id,
      name: input.name.trim(),
      flavorText: input.description?.trim() || null,
      imageUrl: input.imageUrl ?? null,
      levels,
    },
    select: { id: true },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true, id: created.id };
}

/**
 * Troca/limpa a imagem de um jutsu. Owner-only. A URL deve pertencer às
 * imagens do personagem (mesma regra do create).
 */
export async function updateJutsuImage(
  jutsuId: string,
  imageUrl: string | null,
): Promise<JutsuActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const jutsu = await prisma.characterJutsu.findFirst({
    where: { id: jutsuId, character: { userId: session.user.id, deletedAt: null } },
    select: {
      id: true,
      characterId: true,
      character: { select: { images: { select: { url: true } } } },
    },
  });
  if (!jutsu) return { ok: false, error: 'Jutsu não encontrado.' };

  if (imageUrl !== null && !jutsu.character.images.some((img) => img.url === imageUrl)) {
    return { ok: false, error: 'Imagem não pertence a esta ficha.' };
  }

  await prisma.characterJutsu.update({
    where: { id: jutsu.id },
    data: { imageUrl },
  });

  revalidatePath(`/characters/${jutsu.characterId}`);
  return { ok: true };
}

/** Remove um jutsu do personagem. Owner-only. */
export async function deleteJutsu(jutsuId: string): Promise<JutsuActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const jutsu = await prisma.characterJutsu.findFirst({
    where: { id: jutsuId, character: { userId: session.user.id, deletedAt: null } },
    select: { id: true, characterId: true },
  });
  if (!jutsu) return { ok: false, error: 'Jutsu não encontrado.' };

  await prisma.characterJutsu.delete({ where: { id: jutsu.id } });
  revalidatePath(`/characters/${jutsu.characterId}`);
  return { ok: true };
}
