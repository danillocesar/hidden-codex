import { prisma } from '@/lib/prisma';
import type { ShareLinkInfo } from '@/server/actions/characters/share';

/**
 * Le o link de compartilhamento ativo de uma ficha (pra UI do dono). Retorna
 * null quando nao ha link ativo. Nao faz check de ownership — quem chama (a
 * pagina da ficha) ja resolveu o dono via `loadCharacterById`.
 */
export async function getActiveShareLink(characterId: string): Promise<ShareLinkInfo | null> {
  const link = await prisma.shareLink.findFirst({
    where: { characterId, isActive: true },
    select: { token: true, viewCount: true, lastViewedAt: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!link) return null;
  return {
    token: link.token,
    viewCount: link.viewCount,
    lastViewedAt: link.lastViewedAt?.toISOString() ?? null,
  };
}
