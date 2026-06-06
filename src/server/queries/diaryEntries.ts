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

/** Date (UTC) -> `yyyy-mm-dd` pra `<input type="date">`. */
function toDateInput(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/**
 * Carrega o diario de um personagem — OWNER-ONLY. O diario e privado: nao tem
 * caminho publico/compartilhado, entao a query exige `userId` dono. Retorna
 * `null` quando a ficha nao existe ou nao e do usuario (a page cai em 404 sem
 * vazar existencia). Entradas com `deletedAt` (soft delete) ficam de fora.
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
        select: {
          id: true,
          title: true,
          body: true,
          entryDate: true,
          tag: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
  if (!character) return null;

  return {
    characterId: character.id,
    characterName: character.name,
    entries: character.diaryEntries.map((e) => ({
      id: e.id,
      title: e.title,
      body: e.body,
      entryDate: toDateInput(e.entryDate),
      tag: e.tag,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  };
}
