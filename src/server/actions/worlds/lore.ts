'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { assertGm } from '@/lib/worlds/permissions';

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

// ── Pastas ──────────────────────────────────────────────────────────────────

export async function createLoreFolder(
  worldId: string,
  name: string,
  parentId?: string,
): Promise<ActionResult<{ folderId: string }>> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const nameResult = z.string().min(1).max(80).safeParse(name);
  if (!nameResult.success) return { ok: false, error: 'Nome inválido.' };

  // Se parentId informado, verificar que pertence ao mesmo Mundo
  if (parentId) {
    const parent = await prisma.loreFolder.findFirst({
      where: { id: parentId, worldId },
      select: { id: true },
    });
    if (!parent) return { ok: false, error: 'Pasta pai não encontrada.' };
  }

  const folder = await prisma.loreFolder.create({
    data: { worldId, name: nameResult.data, parentId: parentId ?? null },
    select: { id: true },
  });

  revalidatePath(`/worlds/${worldId}/lore`);
  return { ok: true, data: { folderId: folder.id } };
}

export async function renameLoreFolder(
  worldId: string,
  folderId: string,
  name: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const nameResult = z.string().min(1).max(80).safeParse(name);
  if (!nameResult.success) return { ok: false, error: 'Nome inválido.' };

  const folder = await prisma.loreFolder.findFirst({
    where: { id: folderId, worldId },
    select: { id: true },
  });
  if (!folder) return { ok: false, error: 'Pasta não encontrada.' };

  await prisma.loreFolder.update({
    where: { id: folderId },
    data: { name: nameResult.data },
  });

  revalidatePath(`/worlds/${worldId}/lore`);
  return { ok: true, data: undefined };
}

/**
 * Exclui uma pasta. Entradas órfãs (`folderId=null`) ficam visíveis na raiz
 * (via `onDelete: SetNull` no schema).
 */
export async function deleteLoreFolder(
  worldId: string,
  folderId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const folder = await prisma.loreFolder.findFirst({
    where: { id: folderId, worldId },
    select: { id: true },
  });
  if (!folder) return { ok: false, error: 'Pasta não encontrada.' };

  await prisma.loreFolder.delete({ where: { id: folderId } });

  revalidatePath(`/worlds/${worldId}/lore`);
  return { ok: true, data: undefined };
}

// ── Entradas ────────────────────────────────────────────────────────────────

export type LoreVisibility = 'GM_ONLY' | 'PLAYERS';

const LoreEntrySchema = z.object({
  title: z.string().min(1, 'Título obrigatório.').max(120, 'Título muito longo.'),
  body: z.string().max(200_000, 'Conteúdo muito grande.').optional(),
  folderId: z.string().uuid().optional(),
  visibility: z.enum(['GM_ONLY', 'PLAYERS']).optional(),
});

export async function createLoreEntry(
  worldId: string,
  input: { title: string; body?: string; folderId?: string; visibility?: LoreVisibility },
): Promise<ActionResult<{ entryId: string }>> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const parsed = LoreEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  // Verificar que a pasta pertence ao Mundo (se informada)
  if (parsed.data.folderId) {
    const folder = await prisma.loreFolder.findFirst({
      where: { id: parsed.data.folderId, worldId },
      select: { id: true },
    });
    if (!folder) return { ok: false, error: 'Pasta não encontrada.' };
  }

  const entry = await prisma.loreEntry.create({
    data: {
      worldId,
      folderId: parsed.data.folderId ?? null,
      title: parsed.data.title,
      body: parsed.data.body ?? '[]',
      visibility: parsed.data.visibility ?? 'GM_ONLY',
    },
    select: { id: true },
  });

  revalidatePath(`/worlds/${worldId}/lore`);
  return { ok: true, data: { entryId: entry.id } };
}

export async function updateLoreEntry(
  worldId: string,
  entryId: string,
  input: { title: string; body: string; visibility?: LoreVisibility },
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const parsed = LoreEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const entry = await prisma.loreEntry.findFirst({
    where: { id: entryId, worldId, deletedAt: null },
    select: { id: true },
  });
  if (!entry) return { ok: false, error: 'Entrada não encontrada.' };

  await prisma.loreEntry.update({
    where: { id: entryId },
    data: {
      title: parsed.data.title,
      body: parsed.data.body ?? '[]',
      ...(parsed.data.visibility ? { visibility: parsed.data.visibility } : {}),
    },
  });

  revalidatePath(`/worlds/${worldId}/lore`);
  return { ok: true, data: undefined };
}

/**
 * Alterna a visibilidade de uma entrada (GM_ONLY ↔ PLAYERS) sem reabrir o editor.
 * Usado pelo toggle rápido no card. Apenas GM.
 */
export async function setLoreEntryVisibility(
  worldId: string,
  entryId: string,
  visibility: LoreVisibility,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const entry = await prisma.loreEntry.findFirst({
    where: { id: entryId, worldId, deletedAt: null },
    select: { id: true },
  });
  if (!entry) return { ok: false, error: 'Entrada não encontrada.' };

  await prisma.loreEntry.update({
    where: { id: entryId },
    data: { visibility },
  });

  revalidatePath(`/worlds/${worldId}/lore`);
  return { ok: true, data: undefined };
}

export async function deleteLoreEntry(
  worldId: string,
  entryId: string,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Não autenticado.' };

  try {
    await assertGm(worldId, session.user.id);
  } catch {
    return { ok: false, error: 'Acesso negado.' };
  }

  const entry = await prisma.loreEntry.findFirst({
    where: { id: entryId, worldId, deletedAt: null },
    select: { id: true },
  });
  if (!entry) return { ok: false, error: 'Entrada não encontrada.' };

  await prisma.loreEntry.update({
    where: { id: entryId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/worlds/${worldId}/lore`);
  return { ok: true, data: undefined };
}

// ── Queries de Lore ─────────────────────────────────────────────────────────

export type LoreFolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  entryCount: number;
  children: LoreFolderItem[];
};

export type LoreEntryCard = {
  id: string;
  folderId: string | null;
  title: string;
  /** Corpo completo (JSON BlockNote) — usado para reabrir no editor. */
  body: string;
  bodyExcerpt: string;
  visibility: LoreVisibility;
  order: number;
  updatedAt: string;
};

/**
 * Carrega a estrutura de pastas e entradas da Lore de um Mundo.
 * Apenas membros do Mundo têm acesso (GM e jogadores).
 *
 * Para jogadores (não-GM), apenas entradas com `visibility = PLAYERS` são
 * retornadas, e pastas que ficariam vazias são ocultadas.
 */
export async function getLoreData(
  worldId: string,
  userId: string,
): Promise<{ folders: LoreFolderItem[]; entries: LoreEntryCard[]; isGm: boolean } | null> {
  // Verificar que o usuário é membro ou GM
  const world = await prisma.world.findFirst({
    where: {
      id: worldId,
      deletedAt: null,
      OR: [{ gmId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true, gmId: true },
  });
  if (!world) return null;

  const isGm = world.gmId === userId;

  const [rawFolders, rawEntries] = await Promise.all([
    prisma.loreFolder.findMany({
      where: { worldId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        parentId: true,
        order: true,
        _count: {
          select: {
            entries: {
              where: { deletedAt: null, ...(isGm ? {} : { visibility: 'PLAYERS' }) },
            },
          },
        },
      },
    }),
    prisma.loreEntry.findMany({
      // Jogadores só veem entradas marcadas como PLAYERS
      where: { worldId, deletedAt: null, ...(isGm ? {} : { visibility: 'PLAYERS' }) },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        folderId: true,
        title: true,
        body: true,
        visibility: true,
        order: true,
        updatedAt: true,
      },
    }),
  ]);

  // Montar árvore de pastas (flat → tree)
  const folderMap = new Map<string, LoreFolderItem>();
  const roots: LoreFolderItem[] = [];

  for (const f of rawFolders) {
    const item: LoreFolderItem = {
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      order: f.order,
      entryCount: f._count.entries,
      children: [],
    };
    folderMap.set(f.id, item);
  }

  for (const item of folderMap.values()) {
    if (item.parentId) {
      folderMap.get(item.parentId)?.children.push(item);
    } else {
      roots.push(item);
    }
  }

  const entries: LoreEntryCard[] = rawEntries.map((e) => ({
    id: e.id,
    folderId: e.folderId,
    title: e.title,
    body: e.body,
    bodyExcerpt: extractTextExcerpt(e.body, 200),
    visibility: e.visibility as LoreVisibility,
    order: e.order,
    updatedAt: e.updatedAt.toLocaleDateString('pt-BR'),
  }));

  return { folders: roots, entries, isGm };
}

function extractTextExcerpt(body: string, maxChars: number): string {
  try {
    const blocks = JSON.parse(body) as Array<{ content?: Array<{ text?: string }>; children?: Array<{ content?: Array<{ text?: string }> }> }>;
    const texts: string[] = [];
    for (const block of blocks) {
      for (const c of block.content ?? []) {
        if (c.text) texts.push(c.text);
      }
      for (const child of block.children ?? []) {
        for (const c of child.content ?? []) {
          if (c.text) texts.push(c.text);
        }
      }
      if (texts.join(' ').length >= maxChars) break;
    }
    const full = texts.join(' ');
    return full.length > maxChars ? full.slice(0, maxChars) + '…' : full;
  } catch {
    return body.slice(0, maxChars);
  }
}
