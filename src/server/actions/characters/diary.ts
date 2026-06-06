'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export type DiaryActionResult = { ok: true; id: string } | { ok: false; error: string };
export type DiaryDeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Payload de uma entrada de diario. `body` guarda o documento do editor
 * (markdown). Datas vao como `yyyy-mm-dd` (o que o `<input type="date">` produz).
 */
const diaryEntryInput = z.object({
  title: z.string().trim().min(1, 'Título obrigatório.').max(120),
  body: z.string().max(50_000, 'Texto muito longo.').default(''),
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
    .nullable()
    .optional(),
  tag: z.string().trim().max(40).nullable().optional(),
});

const createInput = diaryEntryInput.extend({ characterId: z.string().uuid() });
const updateInput = diaryEntryInput.extend({ entryId: z.string().uuid() });

export type CreateDiaryEntryInput = z.input<typeof createInput>;
export type UpdateDiaryEntryInput = z.input<typeof updateInput>;

/** `yyyy-mm-dd` -> Date em meia-noite UTC (sem tropeço de fuso). */
function parseEntryDate(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function normalizeTag(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

/** Cria uma entrada no diario. Owner-only. */
export async function createDiaryEntry(raw: CreateDiaryEntryInput): Promise<DiaryActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  const parsed = createInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const input = parsed.data;

  const character = await prisma.character.findFirst({
    where: { id: input.characterId, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!character) return { ok: false, error: 'Ficha não encontrada.' };

  const created = await prisma.diaryEntry.create({
    data: {
      characterId: character.id,
      title: input.title,
      body: input.body,
      entryDate: parseEntryDate(input.entryDate),
      tag: normalizeTag(input.tag),
    },
    select: { id: true },
  });

  revalidatePath(`/characters/${character.id}/diary`);
  return { ok: true, id: created.id };
}

/** Edita uma entrada existente. Owner-only (via relação character.userId). */
export async function updateDiaryEntry(raw: UpdateDiaryEntryInput): Promise<DiaryActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  const parsed = updateInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const input = parsed.data;

  const entry = await prisma.diaryEntry.findFirst({
    where: {
      id: input.entryId,
      deletedAt: null,
      character: { userId: session.user.id, deletedAt: null },
    },
    select: { id: true, characterId: true },
  });
  if (!entry) return { ok: false, error: 'Entrada não encontrada.' };

  await prisma.diaryEntry.update({
    where: { id: entry.id },
    data: {
      title: input.title,
      body: input.body,
      entryDate: parseEntryDate(input.entryDate),
      tag: normalizeTag(input.tag),
    },
  });

  revalidatePath(`/characters/${entry.characterId}/diary`);
  return { ok: true, id: entry.id };
}

/** Soft delete (deletedAt) de uma entrada. Owner-only. */
export async function deleteDiaryEntry(entryId: string): Promise<DiaryDeleteResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  const parsedId = z.string().uuid().safeParse(entryId);
  if (!parsedId.success) return { ok: false, error: 'Entrada inválida.' };

  const entry = await prisma.diaryEntry.findFirst({
    where: {
      id: parsedId.data,
      deletedAt: null,
      character: { userId: session.user.id, deletedAt: null },
    },
    select: { id: true, characterId: true },
  });
  if (!entry) return { ok: false, error: 'Entrada não encontrada.' };

  await prisma.diaryEntry.update({
    where: { id: entry.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/characters/${entry.characterId}/diary`);
  return { ok: true };
}
