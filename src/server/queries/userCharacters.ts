import { prisma } from '@/lib/prisma';

/**
 * View model de um personagem na lista do dashboard. Campos resolvidos
 * (cla/vila canonico OU custom) e data ja formatada pra evitar mismatch de
 * hidratacao no client.
 */
export type DashboardCharacter = {
  id: string;
  name: string;
  campaignLevel: number;
  rank: string;
  clanName: string | null;
  villageName: string | null;
  kekkeiGenkaiName: string | null;
  portraitUrl: string | null;
  updatedAtLabel: string;
};

/**
 * Lista os personagens (nao deletados) do usuario, mais recentes primeiro.
 * `select` estreito — apenas o que o card consome.
 */
export async function loadUserCharacters(userId: string): Promise<DashboardCharacter[]> {
  const rows = await prisma.character.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      campaignLevel: true,
      rank: true,
      portraitUrl: true,
      updatedAt: true,
      customClanName: true,
      customVillageName: true,
      clan: { select: { name: true } },
      village: { select: { name: true } },
      kekkeiGenkai: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    campaignLevel: row.campaignLevel,
    rank: row.rank,
    clanName: row.clan?.name ?? row.customClanName ?? null,
    villageName: row.village?.name ?? row.customVillageName ?? null,
    kekkeiGenkaiName: row.kekkeiGenkai?.name ?? null,
    portraitUrl: row.portraitUrl,
    updatedAtLabel: row.updatedAt.toLocaleDateString('pt-BR'),
  }));
}

/**
 * Conta os personagens (nao deletados) do usuario. Usado pra decidir se o
 * wizard deve auto-disparar o tour de onboarding (1o personagem = count 0).
 */
export async function countUserCharacters(userId: string): Promise<number> {
  return prisma.character.count({ where: { userId, deletedAt: null } });
}
