import { prisma } from '@/lib/prisma';

/**
 * Carrega as anotacoes livres do personagem — OWNER-ONLY. As anotacoes sao um
 * rascunho privado do dono (nao vao no view model compartilhado pra nao vazar
 * via link de share). Retorna string vazia quando nao ha nota, a ficha nao
 * existe ou nao e do usuario.
 */
export async function loadCharacterNotes(
  characterId: string,
  userId: string | null,
): Promise<string> {
  if (!userId) return '';
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId, deletedAt: null },
    select: { notes: true },
  });
  return character?.notes ?? '';
}
