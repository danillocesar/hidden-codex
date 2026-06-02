import { prisma } from '@/lib/prisma';
import {
  mapPrismaToCore,
  parseLearnedEffects,
  type CharacterViewModel,
  type CharacterWithRelations,
} from '@/lib/character/mapPrismaToCore';

export type LoadCharacterResult =
  | { ok: true; viewModel: CharacterViewModel }
  | { ok: false; reason: 'not_found' | 'forbidden' };

/**
 * Carrega um personagem por id com todas as relacoes necessarias pra renderizar
 * a ficha. Faz check de ownership simples: se o personagem nao e publico e nao
 * pertence ao `currentUserId`, retorna `forbidden` (a UI deve tratar como 404
 * pra nao vazar existencia).
 *
 * Tambem filtra soft-deleted (deletedAt != null).
 */
export async function loadCharacterById(
  characterId: string,
  currentUserId: string | null,
): Promise<LoadCharacterResult> {
  const row = (await prisma.character.findFirst({
    where: { id: characterId, deletedAt: null },
    include: {
      clan: true,
      village: true,
      kekkeiGenkai: true,
      pericias: true,
      aptitudes: { include: { aptitude: true } },
      powers: { include: { power: true } },
      jutsus: { orderBy: { createdAt: 'asc' } },
      inventory: { include: { equipment: true }, orderBy: { createdAt: 'asc' } },
      images: true,
    },
  })) as CharacterWithRelations | null;

  if (!row) return { ok: false, reason: 'not_found' };

  const isOwner = currentUserId !== null && row.userId === currentUserId;
  if (!isOwner && !row.isPublicOnProfile) {
    return { ok: false, reason: 'forbidden' };
  }

  // Efeitos aprendidos sao persistidos em `Character.learnedEffects`
  // (Record<powerCode, effectCode[]>). Carregamos os PowerEffect por code pra
  // resolver nome/regras na ficha.
  const learnedMap = parseLearnedEffects(row.learnedEffects);
  const effectCodes = Array.from(new Set(Object.values(learnedMap).flat()));
  const powerEffects = effectCodes.length
    ? await prisma.powerEffect.findMany({ where: { code: { in: effectCodes } } })
    : [];

  row.powerEffects = powerEffects;

  return { ok: true, viewModel: mapPrismaToCore(row, { currentUserId }) };
}
