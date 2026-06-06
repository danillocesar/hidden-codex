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
 * Carrega + mapeia um personagem (com todas as relacoes da ficha) SEM aplicar
 * gate de acesso. Resolve os efeitos aprendidos do catalogo. Retorna tambem o
 * flag `isPublicOnProfile` pra quem chama decidir o gate.
 *
 * `currentUserId` so afeta `display.isOwner` no view model (null → nao-dono).
 */
async function loadCharacterViewModel(
  characterId: string,
  currentUserId: string | null,
): Promise<{ viewModel: CharacterViewModel; isPublicOnProfile: boolean } | null> {
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

  if (!row) return null;

  // Efeitos aprendidos sao persistidos em `Character.learnedEffects`
  // (Record<powerCode, effectCode[]>). Carregamos os PowerEffect por code pra
  // resolver nome/regras na ficha.
  const learnedMap = parseLearnedEffects(row.learnedEffects);
  const effectCodes = Array.from(new Set(Object.values(learnedMap).flat()));
  const powerEffects = effectCodes.length
    ? await prisma.powerEffect.findMany({ where: { code: { in: effectCodes } } })
    : [];

  row.powerEffects = powerEffects;

  return {
    viewModel: mapPrismaToCore(row, { currentUserId }),
    isPublicOnProfile: row.isPublicOnProfile,
  };
}

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
  const loaded = await loadCharacterViewModel(characterId, currentUserId);
  if (!loaded) return { ok: false, reason: 'not_found' };

  if (!loaded.viewModel.display.isOwner && !loaded.isPublicOnProfile) {
    return { ok: false, reason: 'forbidden' };
  }

  return { ok: true, viewModel: loaded.viewModel };
}

/**
 * Carrega a ficha via token de compartilhamento (link gerado pelo dono). O token
 * autoriza acesso read-only — ignora o gate de `isPublicOnProfile`. Valida que o
 * link esta ativo e nao expirou; incrementa o contador de visualizacoes.
 *
 * Retorna sempre `isOwner=false` (currentUserId=null) — a UI esconde tudo que
 * for de edicao.
 */
export async function loadCharacterByShareToken(
  token: string,
): Promise<CharacterViewModel | null> {
  const link = await prisma.shareLink.findFirst({
    where: { token, isActive: true },
    select: { id: true, characterId: true, expiresAt: true },
  });
  if (!link) return null;
  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) return null;

  const loaded = await loadCharacterViewModel(link.characterId, null);
  if (!loaded) return null;

  // Contador de acessos (best-effort — nao bloqueia o render se falhar).
  await prisma.shareLink
    .update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    })
    .catch(() => undefined);

  return loaded.viewModel;
}
