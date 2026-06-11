import { prisma } from '@/lib/prisma';

export type CombatListItem = {
  id: string;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'ENDED';
  participantCount: number;
  createdAt: string;
  endedAt: string | null;
};

export type CombatParticipantView = {
  id: string;
  kind: 'PLAYER' | 'GM_CHARACTER' | 'GENERIC_ENEMY';
  // Para PLAYER e GM_CHARACTER
  characterId: string | null;
  characterName: string | null;
  characterPortraitUrl: string | null;
  characterCurrentVitality: number | null;
  characterMaxVitality: number | null;
  characterCurrentChakra: number | null;
  characterMaxChakra: number | null;
  // Para GENERIC_ENEMY
  enemyName: string | null;
  enemyMaxHp: number | null;
  enemyCurrentHp: number | null;
  // Combate
  initiative: number | null;
  displayOrder: number;
};

export type CombatView = {
  id: string;
  campaignId: string;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'ENDED';
  participants: CombatParticipantView[];
  createdAt: string;
  endedAt: string | null;
};

/**
 * Lista os combates de uma Campanha, ordenados do mais recente.
 */
export async function getCombatsByCampaign(campaignId: string): Promise<CombatListItem[]> {
  const combats = await prisma.combat.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      endedAt: true,
      _count: { select: { participants: true } },
    },
  });

  return combats.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status as 'SETUP' | 'ACTIVE' | 'ENDED',
    participantCount: c._count.participants,
    createdAt: c.createdAt.toLocaleDateString('pt-BR'),
    endedAt: c.endedAt?.toLocaleDateString('pt-BR') ?? null,
  }));
}

/**
 * Carrega um Combate com todos os participantes. Para jogadores, omite dados
 * de HP de inimigos (visibilidade controlada em componente via `isGm` prop).
 *
 * Retorna null se não encontrar ou se o combate não pertencer à campanha.
 */
export async function getCombatById(
  combatId: string,
  campaignId: string,
): Promise<CombatView | null> {
  const combat = await prisma.combat.findFirst({
    where: { id: combatId, campaignId },
    select: {
      id: true,
      campaignId: true,
      name: true,
      status: true,
      createdAt: true,
      endedAt: true,
      participants: {
        orderBy: [{ displayOrder: 'asc' }],
        select: {
          id: true,
          kind: true,
          initiative: true,
          displayOrder: true,
          enemyName: true,
          enemyMaxHp: true,
          enemyCurrentHp: true,
          characterId: true,
          character: {
            select: {
              name: true,
              portraitUrl: true,
              currentVitality: true,
              currentChakra: true,
              attrVig: true,
              attrEsp: true,
              campaignLevel: true,
            },
          },
        },
      },
    },
  });
  if (!combat) return null;

  const participants: CombatParticipantView[] = combat.participants.map((p) => {
    const char = p.character;
    const maxVitality =
      char ? Math.ceil((char.attrVig * 5 + char.campaignLevel) * 1) : null;
    const maxChakra = char ? char.attrEsp * 10 : null;

    return {
      id: p.id,
      kind: p.kind as 'PLAYER' | 'GM_CHARACTER' | 'GENERIC_ENEMY',
      characterId: p.characterId,
      characterName: char?.name ?? null,
      characterPortraitUrl: char?.portraitUrl ?? null,
      characterCurrentVitality: char?.currentVitality ?? null,
      characterMaxVitality: maxVitality,
      characterCurrentChakra: char?.currentChakra ?? null,
      characterMaxChakra: maxChakra,
      enemyName: p.enemyName,
      enemyMaxHp: p.enemyMaxHp,
      enemyCurrentHp: p.enemyCurrentHp,
      initiative: p.initiative,
      displayOrder: p.displayOrder,
    };
  });

  return {
    id: combat.id,
    campaignId: combat.campaignId,
    name: combat.name,
    status: combat.status as 'SETUP' | 'ACTIVE' | 'ENDED',
    participants,
    createdAt: combat.createdAt.toLocaleDateString('pt-BR'),
    endedAt: combat.endedAt?.toLocaleDateString('pt-BR') ?? null,
  };
}
