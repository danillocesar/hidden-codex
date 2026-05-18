import type {
  Character,
  CharacterAptitude,
  CharacterPericia,
  CharacterPower,
  Clan,
  KekkeiGenkai,
  Village,
  Aptitude,
  Power,
  Prisma,
} from '@prisma/client';

import type { AttributeKey, CharacterCore, CombatSkillKey } from '@/domain/types';
import { applyOriginBenefits } from './applyOriginBenefits';

/**
 * Shape do Character retornado pela query `loadCharacterById` — inclui as
 * relacoes necessarias pro mapper.
 */
export type CharacterWithRelations = Character & {
  clan: Clan | null;
  village: Village | null;
  kekkeiGenkai: KekkeiGenkai | null;
  pericias: ReadonlyArray<CharacterPericia>;
  aptitudes: ReadonlyArray<CharacterAptitude & { aptitude: Aptitude }>;
  powers: ReadonlyArray<CharacterPower & { power: Power }>;
};

/**
 * Resultado do mapper: o `CharacterCore` (consumido pelo motor) + dados
 * "horizontais" que a UI da ficha precisa mas que nao cabem no core (nome do
 * cla pra exibir, free power levels resolvidos, etc.).
 */
export type CharacterViewModel = {
  core: CharacterCore;
  display: {
    id: string;
    name: string;
    age: number | null;
    gender: string | null;
    rank: Character['rank'];
    size: Character['size'];
    tendency: string | null;
    biography: string | null;
    isOwner: boolean;
    /** Resolvido: `clan.name` OU `customClanName` OU null. */
    clanName: string | null;
    /** Codigo canonico do cla quando aplicavel. */
    clanCode: string | null;
    villageName: string | null;
    villageCode: string | null;
    kekkeiGenkaiName: string | null;
    kekkeiGenkaiCode: string | null;
    /** Niveis gratuitos por poder (vindos de KG). Pra UI mostrar X (grátis). */
    freePowerLevels: Readonly<Record<string, number>>;
    /** Codigos de aptidoes grátis vindas da origem. */
    freeAptitudeCodes: ReadonlyArray<string>;
    uiState: Prisma.JsonValue;
  };
  /**
   * Lookup pra UI mostrar nome / descricao / categoria das aptidoes/poderes
   * referenciadas pelo `core`.
   */
  lookup: {
    aptitudeByCode: Map<string, Aptitude>;
    powerByCode: Map<string, Power>;
  };
};

export function mapPrismaToCore(
  row: CharacterWithRelations,
  opts: { currentUserId: string | null },
): CharacterViewModel {
  const pericias: Record<string, number> = {};
  for (const p of row.pericias) {
    pericias[p.periciaCode] = p.points;
  }

  const benefits = applyOriginBenefits({
    clan: row.clan ? { code: row.clan.code, benefits: row.clan.benefits } : null,
    kekkeiGenkai: row.kekkeiGenkai
      ? { code: row.kekkeiGenkai.code, benefits: row.kekkeiGenkai.benefits }
      : null,
    village: row.village
      ? { code: row.village.code, benefits: row.village.benefits }
      : null,
  });

  const core: CharacterCore = {
    campaignLevel: row.campaignLevel,
    attributes: pickAttributes(row),
    bases: pickBases(row),
    pericias,
    aptitudes: row.aptitudes.map((a) => ({
      code: a.aptitude.code,
      parameter: a.parameter ?? undefined,
      isFreeFromOrigin: a.isFreeFromOrigin,
    })),
    powers: row.powers.map((p) => ({ code: p.power.code, level: p.level })),
    learnedEffects: [],
    narrativeFlags: [],
    clan: row.clan ? { code: row.clan.code } : undefined,
    kekkeiGenkai: benefits.effectiveKekkeiGenkaiCode
      ? { code: benefits.effectiveKekkeiGenkaiCode }
      : undefined,
    currentVitality: row.currentVitality,
    currentChakra: row.currentChakra,
    socialCarisma: row.socialCarisma,
    socialManipulacao: row.socialManipulacao,
  };

  return {
    core,
    display: {
      id: row.id,
      name: row.name,
      age: row.age,
      gender: row.gender,
      rank: row.rank,
      size: row.size,
      tendency: row.tendency,
      biography: row.biography,
      isOwner: opts.currentUserId === row.userId,
      clanName: row.clan?.name ?? row.customClanName ?? null,
      clanCode: row.clan?.code ?? null,
      villageName: row.village?.name ?? row.customVillageName ?? null,
      villageCode: row.village?.code ?? null,
      kekkeiGenkaiName: row.kekkeiGenkai?.name ?? null,
      kekkeiGenkaiCode: row.kekkeiGenkai?.code ?? benefits.effectiveKekkeiGenkaiCode,
      freePowerLevels: benefits.freePowerLevels,
      freeAptitudeCodes: benefits.freeAptitudeCodes,
      uiState: row.uiState,
    },
    lookup: {
      aptitudeByCode: new Map(row.aptitudes.map((a) => [a.aptitude.code, a.aptitude])),
      powerByCode: new Map(row.powers.map((p) => [p.power.code, p.power])),
    },
  };
}

function pickAttributes(row: Character): Readonly<Record<AttributeKey, number>> {
  return {
    for: row.attrFor,
    des: row.attrDes,
    agi: row.attrAgi,
    per: row.attrPer,
    int: row.attrInt,
    vig: row.attrVig,
    esp: row.attrEsp,
  };
}

function pickBases(row: Character): Readonly<Record<CombatSkillKey, number>> {
  return { cc: row.baseCc, cd: row.baseCd, esq: row.baseEsq, lm: row.baseLm };
}
