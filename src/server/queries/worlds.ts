import { prisma } from '@/lib/prisma';

export type WorldListItem = {
  id: string;
  name: string;
  description: string | null;
  role: 'gm' | 'member';
  campaignCount: number;
  memberCount: number;
  updatedAt: string;
};

export type WorldDashboard = {
  id: string;
  name: string;
  description: string | null;
  inviteToken: string;
  gmId: string;
  gmName: string | null;
  gmAvatarUrl: string | null;
  campaignCount: number;
  updatedAt: string;
};

/**
 * Lista todos os Mundos em que o usuário é GM ou membro.
 */
export async function getWorldsByUser(userId: string): Promise<WorldListItem[]> {
  const [gmWorlds, memberWorlds] = await Promise.all([
    prisma.world.findMany({
      where: { gmId: userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        _count: { select: { campaigns: true, members: true } },
      },
    }),
    prisma.world.findMany({
      where: {
        deletedAt: null,
        members: { some: { userId } },
        gmId: { not: userId },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        _count: { select: { campaigns: true, members: true } },
      },
    }),
  ]);

  const toItem = (role: 'gm' | 'member') => (w: (typeof gmWorlds)[number]) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    role,
    campaignCount: w._count.campaigns,
    memberCount: w._count.members,
    updatedAt: w.updatedAt.toLocaleDateString('pt-BR'),
  });

  return [...gmWorlds.map(toItem('gm')), ...memberWorlds.map(toItem('member'))];
}

/**
 * Carrega o Mundo pelo id para o dashboard. Retorna null se não encontrado ou
 * se o usuário não tiver acesso (não é GM nem membro).
 */
export async function getWorldById(
  worldId: string,
  userId: string,
): Promise<WorldDashboard | null> {
  const world = await prisma.world.findFirst({
    where: { id: worldId, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      inviteToken: true,
      gmId: true,
      updatedAt: true,
      gm: { select: { displayName: true, avatarUrl: true } },
      _count: { select: { campaigns: true } },
      members: { where: { userId }, select: { id: true } },
    },
  });
  if (!world) return null;

  const isGm = world.gmId === userId;
  const isMember = world.members.length > 0;
  if (!isGm && !isMember) return null;

  return {
    id: world.id,
    name: world.name,
    description: world.description,
    inviteToken: world.inviteToken,
    gmId: world.gmId,
    gmName: world.gm.displayName,
    gmAvatarUrl: world.gm.avatarUrl,
    campaignCount: world._count.campaigns,
    updatedAt: world.updatedAt.toLocaleDateString('pt-BR'),
  };
}

/**
 * Busca um Mundo pelo token de convite para a tela de join.
 * Retorna dados mínimos (sem inviteToken) pra mostrar na tela de confirmação.
 */
export async function getWorldByInviteToken(
  token: string,
): Promise<{ id: string; name: string; description: string | null; gmName: string | null } | null> {
  const world = await prisma.world.findFirst({
    where: { inviteToken: token, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      gm: { select: { displayName: true } },
    },
  });
  if (!world) return null;
  return {
    id: world.id,
    name: world.name,
    description: world.description,
    gmName: world.gm.displayName,
  };
}

export type WorldMemberView = {
  id: string;
  userId: string;
  userName: string | null;
  userAvatarUrl: string | null;
  characterId: string | null;
  characterName: string | null;
  characterPortraitUrl: string | null;
  joinedAt: string;
};

/**
 * Lista os membros (jogadores) de um Mundo. Exclui o GM da lista.
 */
export async function getWorldMembers(worldId: string, gmId: string): Promise<WorldMemberView[]> {
  const members = await prisma.worldMember.findMany({
    where: { worldId, userId: { not: gmId } },
    orderBy: { joinedAt: 'asc' },
    select: {
      id: true,
      userId: true,
      joinedAt: true,
      user: { select: { displayName: true, avatarUrl: true } },
      character: { select: { id: true, name: true, portraitUrl: true } },
    },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    userName: m.user.displayName,
    userAvatarUrl: m.user.avatarUrl,
    characterId: m.character?.id ?? null,
    characterName: m.character?.name ?? null,
    characterPortraitUrl: m.character?.portraitUrl ?? null,
    joinedAt: m.joinedAt.toLocaleDateString('pt-BR'),
  }));
}
