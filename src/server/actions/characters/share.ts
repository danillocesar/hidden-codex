'use server';

import { randomBytes } from 'node:crypto';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

/**
 * Estado de um link de compartilhamento exposto pra UI. `lastViewedAt` vai como
 * ISO string (serializavel pra client components).
 */
export type ShareLinkInfo = {
  token: string;
  viewCount: number;
  lastViewedAt: string | null;
};

export type ShareLinkResult =
  | { ok: true; link: ShareLinkInfo }
  | { ok: false; error: string };

export type RevokeShareLinkResult = { ok: true } | { ok: false; error: string };

function generateToken(): string {
  // 16 bytes = 128 bits de entropia → 32 chars hex. Inviavel de adivinhar.
  return randomBytes(16).toString('hex');
}

async function assertOwnership(characterId: string, userId: string): Promise<boolean> {
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId, deletedAt: null },
    select: { id: true },
  });
  return character !== null;
}

/**
 * Gera (ou reaproveita) o link de compartilhamento ativo de uma ficha. Modelo:
 * um unico link revogavel por ficha — se ja existe um ativo, retorna ele em vez
 * de criar outro (idempotente). Owner-only.
 */
export async function createShareLink(characterId: string): Promise<ShareLinkResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  if (!(await assertOwnership(characterId, session.user.id))) {
    return { ok: false, error: 'Ficha nao encontrada.' };
  }

  const existing = await prisma.shareLink.findFirst({
    where: { characterId, isActive: true },
    select: { token: true, viewCount: true, lastViewedAt: true },
  });
  if (existing) {
    return {
      ok: true,
      link: {
        token: existing.token,
        viewCount: existing.viewCount,
        lastViewedAt: existing.lastViewedAt?.toISOString() ?? null,
      },
    };
  }

  const created = await prisma.shareLink.create({
    data: {
      token: generateToken(),
      characterId,
      userId: session.user.id,
    },
    select: { token: true, viewCount: true, lastViewedAt: true },
  });

  return {
    ok: true,
    link: {
      token: created.token,
      viewCount: created.viewCount,
      lastViewedAt: created.lastViewedAt?.toISOString() ?? null,
    },
  };
}

/**
 * Revoga (desativa) o(s) link(s) ativo(s) de uma ficha. O GM perde acesso
 * imediatamente. Owner-only. Para rotacionar, revogue e gere de novo.
 */
export async function revokeShareLink(characterId: string): Promise<RevokeShareLinkResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  if (!(await assertOwnership(characterId, session.user.id))) {
    return { ok: false, error: 'Ficha nao encontrada.' };
  }

  await prisma.shareLink.updateMany({
    where: { characterId, isActive: true },
    data: { isActive: false },
  });

  return { ok: true };
}
