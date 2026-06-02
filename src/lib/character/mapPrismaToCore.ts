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
  CharacterJutsu,
  CharacterInventoryItem,
  Equipment,
  CharacterImage,
  PowerEffect,
  Prisma,
} from '@prisma/client';

import type { AttributeKey, CharacterCore, CombatSkillKey } from '@/domain/types';
import { applyOriginBenefits } from './applyOriginBenefits';
import { resolveSectionCovers, type SectionCoverImage, type SectionCovers } from './sectionCovers';

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
  jutsus: ReadonlyArray<CharacterJutsu>;
  inventory: ReadonlyArray<CharacterInventoryItem & { equipment: Equipment | null }>;
  images: ReadonlyArray<CharacterImage>;
  powerEffects: ReadonlyArray<PowerEffect>;
};

export type FichaInventoryItem = {
  id: string;
  name: string;
  kind: string | null;
  subtype: string | null;
  category: string | null;
  quantity: number;
  equipped: boolean;
  damage: string | null;
  damageType: string | null;
  range: string | null;
  isWeapon: boolean;
};

export type FichaJutsu = {
  id: string;
  name: string;
  powerName: string | null;
  effectName: string | null;
  /** Níveis do poder em que o jutsu pode ser conjurado (1..nível do poder). */
  levels: ReadonlyArray<number>;
  imageUrl: string | null;
  description: string | null;
  /**
   * Tipo de acerto vindo do efeito (`stats.rollType`): CC, CD ou LM. `null`
   * para efeitos sem ataque ou com teste resistido especial (agarrar, etc.).
   */
  acerto: 'cc' | 'cd' | 'lm' | null;
  /** Custo de chakra quando declarado no JSON do efeito; senao null. */
  cost: number | null;
};

export type FichaEffect = {
  code: string;
  name: string;
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
    portraitUrl: string | null;
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
    sectionCovers: SectionCovers;
    images: ReadonlyArray<SectionCoverImage>;
    uiState: Prisma.JsonValue;
    /** Inventario completo (armas, armaduras, itens) para a secao da ficha. */
    inventory: ReadonlyArray<FichaInventoryItem>;
    /** Subconjunto: armas com `equipped=true` — alimenta o Combate Rapido. */
    equippedWeapons: ReadonlyArray<FichaInventoryItem>;
    /** Jutsus cadastrados (nome + poder/efeito + custo quando disponivel). */
    jutsus: ReadonlyArray<FichaJutsu>;
    /** Efeitos aprendidos agrupados por code do poder (secao Tecnicas). */
    effectsByPowerCode: Readonly<Record<string, ReadonlyArray<FichaEffect>>>;
  };
  /**
   * Lookup pra UI mostrar nome / descricao / categoria das aptidoes/poderes
   * referenciadas pelo `core`.
   */
  lookup: {
    aptitudeByCode: Map<string, Aptitude>;
    powerByCode: Map<string, Power>;
    effectByCode: Map<string, PowerEffect>;
    effectById: Map<string, PowerEffect>;
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
    village: row.village ? { code: row.village.code, benefits: row.village.benefits } : null,
  });
  const effectById = new Map(row.powerEffects.map((e) => [e.id, e]));
  const effectByCode = new Map(row.powerEffects.map((e) => [e.code, e]));

  // Efeitos aprendidos vem de `Character.learnedEffects` (Record<powerCode,
  // effectCode[]>), nao mais de CharacterJutsu.
  const learnedMap = parseLearnedEffects(row.learnedEffects);
  const learnedEffects = Object.values(learnedMap).flat();

  const powerByPowerId = new Map(row.powers.map((p) => [p.powerId, p.power]));

  const inventory: FichaInventoryItem[] = row.inventory.map((item) => {
    const eq = item.equipment;
    return {
      id: item.id,
      name: eq?.name ?? item.customName ?? 'Item',
      kind: eq?.kind ?? null,
      subtype: eq?.subtype ?? null,
      category: eq?.category ?? null,
      quantity: item.quantity,
      equipped: item.equipped,
      damage: eq?.damage ?? null,
      damageType: eq?.damageType ?? null,
      range: eq?.range ?? null,
      isWeapon: eq?.kind === 'WEAPON',
    };
  });
  const equippedWeapons = inventory.filter((i) => i.isWeapon && i.equipped);

  const jutsus: FichaJutsu[] = row.jutsus.map((j) => {
    const effect = effectById.get(j.powerEffectId);
    const power = powerByPowerId.get(j.powerId);
    return {
      id: j.id,
      name: j.name,
      powerName: power?.name ?? null,
      effectName: effect?.name ?? null,
      levels: j.levels,
      imageUrl: j.imageUrl,
      description: j.flavorText,
      acerto: readRollType(effect?.stats),
      cost: readEffectCost(effect?.rules),
    };
  });

  // Efeitos aprendidos agrupados pelo code do poder — exibidos junto dos
  // poderes na secao Tecnicas (os jutsus reais vao no Combate Rapido).
  const effectsByPowerCode: Record<string, FichaEffect[]> = {};
  for (const [powerCode, codes] of Object.entries(learnedMap)) {
    effectsByPowerCode[powerCode] = codes.map((code) => ({
      code,
      name: effectByCode.get(code)?.name ?? code,
    }));
  }

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
    learnedEffects,
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
      portraitUrl: row.portraitUrl,
      isOwner: opts.currentUserId === row.userId,
      clanName: row.clan?.name ?? row.customClanName ?? null,
      clanCode: row.clan?.code ?? null,
      villageName: row.village?.name ?? row.customVillageName ?? null,
      villageCode: row.village?.code ?? null,
      kekkeiGenkaiName: row.kekkeiGenkai?.name ?? null,
      kekkeiGenkaiCode: row.kekkeiGenkai?.code ?? benefits.effectiveKekkeiGenkaiCode,
      freePowerLevels: benefits.freePowerLevels,
      freeAptitudeCodes: benefits.freeAptitudeCodes,
      sectionCovers: resolveSectionCovers(row.uiState),
      images: row.images.map((image) => ({
        id: image.id,
        url: image.url,
        label: image.label,
      })),
      uiState: row.uiState,
      inventory,
      equippedWeapons,
      jutsus,
      effectsByPowerCode,
    },
    lookup: {
      aptitudeByCode: new Map(row.aptitudes.map((a) => [a.aptitude.code, a.aptitude])),
      powerByCode: new Map(row.powers.map((p) => [p.power.code, p.power])),
      effectByCode,
      effectById,
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

/**
 * Le um custo de chakra do JSON `rules` do efeito, se declarado. Tolerante a
 * formatos: aceita `chakraCost` ou `cost` numerico. Retorna null quando ausente
 * — o calculo real de custo entra com a calculadora de combate (Fase 4).
 */
/**
 * Le o JSON `Character.learnedEffects` (Record<powerCode, effectCode[]>) de
 * forma tolerante: ignora chaves/valores malformados. Fonte unica de verdade
 * dos efeitos aprendidos desde a migration `add_character_learned_effects`.
 */
export function parseLearnedEffects(json: Prisma.JsonValue): Record<string, string[]> {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {};
  const out: Record<string, string[]> = {};
  for (const [powerCode, value] of Object.entries(json as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    const codes = value.filter((c): c is string => typeof c === 'string');
    if (codes.length > 0) out[powerCode] = codes;
  }
  return out;
}

/**
 * Le `stats.rollType` do efeito e normaliza pro tipo de acerto do jutsu. So
 * CC/CD/LM viram acerto numerico na ficha; testes resistidos especiais
 * (agarrar, olhar_hipnotico, "Vigor ...") e efeitos sem ataque retornam null.
 */
function readRollType(stats: Prisma.JsonValue | undefined): 'cc' | 'cd' | 'lm' | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).rollType;
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  return value === 'cc' || value === 'cd' || value === 'lm' ? value : null;
}

function readEffectCost(rules: Prisma.JsonValue | undefined): number | null {
  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) return null;
  const record = rules as Record<string, unknown>;
  const raw = record.chakraCost ?? record.cost;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}
