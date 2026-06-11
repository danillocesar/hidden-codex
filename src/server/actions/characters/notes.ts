'use server';

import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

/**
 * Salva as anotacoes livres (rascunho de sessao) de um personagem. Owner-only.
 * O corpo e o JSON do editor BlockNote (mesmo formato de DiaryEntry.body);
 * validamos so tamanho/tipo aqui. Sem revalidatePath agressivo — o autosave
 * dispara com frequencia e a UI ja reflete localmente.
 */

const MAX_NOTES_BYTES = 200_000;

const saveNotesInput = z.object({
  characterId: z.string().uuid(),
  notes: z.string().max(MAX_NOTES_BYTES),
});

export type SaveNotesResult = { ok: true } | { ok: false; error: string };

export async function updateCharacterNotes(
  raw: z.infer<typeof saveNotesInput>,
): Promise<SaveNotesResult> {
  const parsed = saveNotesInput.safeParse(raw);
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
    data: { notes: parsed.data.notes },
  });

  return { ok: true };
}
