import { prisma } from '@/lib/prisma';

export type WorldRole = 'gm' | 'member' | 'none';

/**
 * Retorna o papel do usuário em um Mundo: GM, membro ou nenhum.
 * Ignora mundos soft-deleted (deletedAt != null).
 */
export async function getWorldRole(worldId: string, userId: string): Promise<WorldRole> {
  const world = await prisma.world.findFirst({
    where: { id: worldId, deletedAt: null },
    select: {
      gmId: true,
      members: { where: { userId }, select: { id: true } },
    },
  });
  if (!world) return 'none';
  if (world.gmId === userId) return 'gm';
  if (world.members.length > 0) return 'member';
  return 'none';
}

/**
 * Lança erro se o usuário não for GM do Mundo. Use em server actions.
 */
export async function assertGm(worldId: string, userId: string): Promise<void> {
  const role = await getWorldRole(worldId, userId);
  if (role !== 'gm') throw new Error('Acesso negado: apenas o Mestre pode executar esta ação.');
}

/**
 * Lança erro se o usuário não for membro (nem GM) do Mundo.
 */
export async function assertMember(worldId: string, userId: string): Promise<void> {
  const role = await getWorldRole(worldId, userId);
  if (role === 'none') throw new Error('Acesso negado: você não é membro deste Mundo.');
}

/**
 * Retorna o papel do usuário em uma Campanha, considerando o contexto do Mundo.
 * GM do Mundo tem acesso total à Campanha mesmo sem registro em CampaignMember.
 */
export async function getCampaignRole(
  campaignId: string,
  userId: string,
): Promise<'gm' | 'member' | 'none'> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, deletedAt: null },
    select: {
      world: { select: { id: true, gmId: true } },
      members: {
        where: { worldMember: { userId } },
        select: { id: true },
      },
    },
  });
  if (!campaign) return 'none';
  if (campaign.world.gmId === userId) return 'gm';
  if (campaign.members.length > 0) return 'member';
  return 'none';
}
