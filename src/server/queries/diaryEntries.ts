import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Entrada de diario serializada pra client components. `entryDate` vai como
 * `yyyy-mm-dd` (casa direto com `<input type="date">`); `createdAt/updatedAt`
 * como ISO completo.
 */
export type DiaryEntryView = {
  id: string;
  title: string;
  body: string;
  entryDate: string | null;
  tag: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DiaryPageData = {
  characterId: string;
  characterName: string;
  entries: DiaryEntryView[];
};

/** `select` das entradas de diario — reusado entre os loaders (dono e share). */
const DIARY_ENTRY_SELECT = {
  id: true,
  title: true,
  body: true,
  entryDate: true,
  tag: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DiaryEntrySelect;

type DiaryEntryRow = Prisma.DiaryEntryGetPayload<{ select: typeof DIARY_ENTRY_SELECT }>;

/** Date (UTC) -> `yyyy-mm-dd` pra `<input type="date">`. */
function toDateInput(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function mapEntry(e: DiaryEntryRow): DiaryEntryView {
  return {
    id: e.id,
    title: e.title,
    body: e.body,
    entryDate: toDateInput(e.entryDate),
    tag: e.tag,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

/**
 * Resolve o `characterId` de um token de compartilhamento ativo e nao expirado.
 * Mesma regra de validacao de `loadCharacterByShareToken` (link ativo + expiry
 * best-effort). Retorna `null` se o token nao existe, foi revogado ou expirou.
 */
async function resolveShareTokenCharacterId(token: string): Promise<string | null> {
  const link = await prisma.shareLink.findFirst({
    where: { token, isActive: true },
    select: { characterId: true, expiresAt: true },
  });
  if (!link) return null;
  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) return null;
  return link.characterId;
}

/**
 * Carrega o diario de um personagem — OWNER-ONLY. A query exige `userId` dono.
 * Retorna `null` quando a ficha nao existe ou nao e do usuario (a page cai em
 * 404 sem vazar existencia). Entradas com `deletedAt` (soft delete) ficam fora.
 */
export async function loadDiaryEntries(
  characterId: string,
  userId: string | null,
): Promise<DiaryPageData | null> {
  if (!userId) return null;

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      diaryEntries: {
        where: { deletedAt: null },
        // Mais recentes primeiro. Entradas sem data caem pra ordem de criacao.
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
        select: DIARY_ENTRY_SELECT,
      },
    },
  });
  if (!character) return null;

  return {
    characterId: character.id,
    characterName: character.name,
    entries: character.diaryEntries.map(mapEntry),
  };
}

/**
 * Carrega o diario via token de compartilhamento — acesso de LEITURA publico.
 * Quem tem o link de share da ficha le tambem o diario (todas as entradas
 * nao-deletadas). Sem `userId` (o token e a credencial). Retorna `null` se o
 * token e invalido/expirado ou a ficha sumiu.
 */
export async function loadDiaryEntriesByShareToken(token: string): Promise<DiaryPageData | null> {
  const characterId = await resolveShareTokenCharacterId(token);
  if (!characterId) return null;

  const character = await prisma.character.findFirst({
    where: { id: characterId, deletedAt: null },
    select: {
      id: true,
      name: true,
      diaryEntries: {
        where: { deletedAt: null },
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
        select: DIARY_ENTRY_SELECT,
      },
    },
  });
  if (!character) return null;

  return {
    characterId: character.id,
    characterName: character.name,
    entries: character.diaryEntries.map(mapEntry),
  };
}

/**
 * Conta entradas de diario visiveis via token de share. Usado pela ficha
 * compartilhada pra so mostrar o link "Diario" quando ha o que ler.
 */
export async function countSharedDiaryEntries(token: string): Promise<number> {
  const characterId = await resolveShareTokenCharacterId(token);
  if (!characterId) return 0;
  return prisma.diaryEntry.count({ where: { characterId, deletedAt: null } });
}
