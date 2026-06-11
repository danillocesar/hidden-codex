import { prisma } from '@/lib/prisma';

export type CampaignListItem = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  activeCombatCount: number;
};

export type CampaignDetail = {
  id: string;
  worldId: string;
  name: string;
  description: string | null;
  members: CampaignMemberView[];
};

export type CampaignMemberView = {
  worldMemberId: string;
  userId: string;
  userName: string | null;
  userAvatarUrl: string | null;
  characterId: string | null;
  characterName: string | null;
  characterPortraitUrl: string | null;
};

/**
 * Lista as campanhas de um Mundo com contagem de membros e combates ativos.
 */
export async function getCampaignsByWorld(worldId: string): Promise<CampaignListItem[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { worldId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { members: true } },
      combats: {
        where: { status: { in: ['SETUP', 'ACTIVE'] } },
        select: { id: true },
      },
    },
  });

  return campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    memberCount: c._count.members,
    activeCombatCount: c.combats.length,
  }));
}

/**
 * Carrega uma Campanha com seus membros. Verifica que pertence ao worldId informado
 * (protege contra IDOR — não usa só o campaignId).
 */
export async function getCampaignById(
  campaignId: string,
  worldId: string,
): Promise<CampaignDetail | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, worldId, deletedAt: null },
    select: {
      id: true,
      worldId: true,
      name: true,
      description: true,
      members: {
        select: {
          worldMember: {
            select: {
              id: true,
              userId: true,
              user: { select: { displayName: true, avatarUrl: true } },
              character: { select: { id: true, name: true, portraitUrl: true } },
            },
          },
        },
      },
    },
  });
  if (!campaign) return null;

  return {
    id: campaign.id,
    worldId: campaign.worldId,
    name: campaign.name,
    description: campaign.description,
    members: campaign.members.map((m) => ({
      worldMemberId: m.worldMember.id,
      userId: m.worldMember.userId,
      userName: m.worldMember.user.displayName,
      userAvatarUrl: m.worldMember.user.avatarUrl,
      characterId: m.worldMember.character?.id ?? null,
      characterName: m.worldMember.character?.name ?? null,
      characterPortraitUrl: m.worldMember.character?.portraitUrl ?? null,
    })),
  };
}
