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
import {
  calculateCanhaoDamage,
  calculateNinpouBaseDamage,
  commonPowerRange,
} from '@/domain/rules/jutsus';
import { applyOriginBenefits } from './applyOriginBenefits';
import {
  resolveSectionCovers,
  resolveSectionCoverPositions,
  type SectionCoverImage,
  type SectionCovers,
  type SectionCoverPositions,
} from './sectionCovers';

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
  /**
   * Custo de chakra do efeito, já em rótulo legível (`stats.chakraCost`):
   * ex.: "1 por nível usado", "Sem custo", "3 de chakra", "varia". `null` se ausente.
   */
  chakraCost: string | null;
  /**
   * Dano do efeito, em rótulo legível (`stats.damage`): ex.: "2 por nível do poder",
   * "comum do poder", "ver descrição". `null` quando o efeito não causa dano direto.
   */
  damage: string | null;
  /** Alcance/área do efeito (`stats.range`), em rótulo legível. `null` se ausente. */
  range: string | null;
  /** Duração do efeito (`stats.duration`), em rótulo legível. `null` se ausente. */
  duration: string | null;
  /** Glifo do elemento do poder (氷/水/火/風…) pro card. Fallback 術. */
  powerKanji: string;
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
    sectionCoverPositions: SectionCoverPositions;
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
      chakraCost: resolveChakra(effect?.stats, j.levels),
      damage: resolveDamage(effect?.stats, row.attrEsp, j.levels),
      range: resolveRange(effect?.stats, row.attrEsp),
      duration: formatDuration(effect?.stats),
      powerKanji: powerKanjiFor(power?.code),
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
      sectionCoverPositions: resolveSectionCoverPositions(row.uiState),
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

/**
 * Códigos de custo de chakra usados no seed → rótulo legível em PT.
 */
const CHAKRA_COST_LABELS: Record<string, string> = {
  nivel_usado: '1 por nível usado',
  nível_usado: '1 por nível usado',
  nivel_usado_quando_atacar: '1 por nível usado (ao atacar)',
  nivel_do_poder: '1 por nível do poder',
  padrao_do_poder: 'padrão do poder',
  metade_do_nivel_do_poder: 'metade do nível do poder',
};

/**
 * Le `stats.chakraCost` e devolve um rótulo legível. Aceita número (custo fixo),
 * códigos conhecidos (mapeados acima) e frases livres (já legíveis no seed, ex.:
 * "1 por nível do poder", "varia"). Retorna null quando ausente.
 */
function formatChakraCost(stats: Prisma.JsonValue | undefined): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).chakraCost;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw === 0 ? 'Sem custo' : `${raw} de chakra`;
  }
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key) return null;
  return CHAKRA_COST_LABELS[key] ?? key.replace(/_/g, ' ');
}

/** Códigos de chakra cujo custo = nível usado (1 por nível). */
const CHAKRA_PER_LEVEL = new Set([
  'nivel_usado',
  'nível_usado',
  'nivel_usado_quando_atacar',
  'nivel_do_poder',
  '1 por nível do poder',
  '1 por nível usado',
]);

/**
 * Resolve o custo de chakra por nível conjurável. "nivel_usado" e similares =
 * o próprio nível (ex.: níveis 1·2·3 → "1 · 2 · 3"); "metade do nível" =
 * ⌈nível/2⌉; número fixo é mantido. Sem nível/desconhecido cai no rótulo.
 */
function resolveChakra(
  stats: Prisma.JsonValue | undefined,
  levels: ReadonlyArray<number>,
): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).chakraCost;
  if (typeof raw === 'number') return raw === 0 ? 'Sem custo' : String(raw);
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key) return null;
  const perLevel = (fn: (lvl: number) => number): string | null =>
    levels.length > 0 ? levels.map(fn).join(' · ') : null;
  if (CHAKRA_PER_LEVEL.has(key)) return perLevel((lvl) => lvl) ?? formatChakraCost(stats);
  if (key === 'metade_do_nivel_do_poder') {
    return perLevel((lvl) => Math.ceil(lvl / 2)) ?? formatChakraCost(stats);
  }
  return formatChakraCost(stats);
}

/** Tokens de duração (enum do seed) → rótulo capitalizado. */
const DURATION_TOKENS: Record<string, string> = {
  INSTANTANEA: 'Instantânea',
  CONTINUA: 'Contínua',
  CONTINUA_ATE_LIBERTAR: 'Contínua (até libertar)',
  SUSTENTADA: 'Sustentada',
  CONCENTRACAO: 'Concentração',
  PERMANENTE: 'Permanente',
};

/**
 * Le `stats.duration` e devolve um rótulo enxuto: normaliza "ou"/"_OU_" para
 * "/", capitaliza tokens conhecidos e tira o ALL-CAPS. Ex.:
 * "SUSTENTADA_OU_PERMANENTE" → "Sustentada/Permanente".
 */
function formatDuration(stats: Prisma.JsonValue | undefined): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).duration;
  if (typeof raw === 'number') return String(raw);
  if (typeof raw !== 'string') return null;
  const normalized = raw
    .trim()
    .replace(/\s+ou\s+/gi, '/')
    .replace(/_ou_/gi, '/')
    .replace(/_/g, ' ');
  if (!normalized) return null;
  return normalized
    .split('/')
    .map((segment) => {
      const seg = segment.trim();
      const upper = seg.toUpperCase();
      for (const [token, label] of Object.entries(DURATION_TOKENS)) {
        if (upper === token) return label;
        if (upper.startsWith(`${token} `)) return label + seg.slice(token.length);
      }
      const base = seg === upper ? seg.toLowerCase() : seg;
      return base.charAt(0).toUpperCase() + base.slice(1);
    })
    .join('/​'); // zero-width space: permite quebrar após a "/"
}

/** Códigos de dano usados no seed → rótulo legível em PT (ou null = sem dano). */
const DAMAGE_LABELS: Record<string, string | null> = {
  nenhum: null,
  nenhum_direto: null,
  comum_do_poder: 'comum do poder',
  comum_juuken: 'comum do Juuken',
  '2x_nivel_do_poder': '2 por nível do poder',
  ver_texto: 'ver descrição',
  ver_descricao: 'ver descrição',
};

/**
 * Le `stats.damage` e devolve um rótulo legível, ou null quando o efeito não
 * causa dano direto ("nenhum"). Aceita número, códigos conhecidos e frases livres.
 */
function formatDamage(stats: Prisma.JsonValue | undefined): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).damage;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw === 0 ? null : `${raw}`;
  }
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key) return null;
  if (key in DAMAGE_LABELS) return DAMAGE_LABELS[key] ?? null;
  return key.replace(/_/g, ' ');
}

/**
 * Resolve o alcance: "comum_do_poder" vira o valor calculado (Médio = 10 + 2×Esp);
 * o resto cai no rótulo legível. Ex.: Esp 1 → "Médio (12m)".
 */
function resolveRange(stats: Prisma.JsonValue | undefined, esp: number): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).range;
  if (raw === 'comum_do_poder') return `Médio (${commonPowerRange(esp)}m)`;
  if (raw === 'meio_comum_do_poder') return `${Math.ceil(commonPowerRange(esp) / 2)}m`;
  return labelizeStat(stats, 'range', RANGE_LABELS);
}

/**
 * Resolve o dano por nível conjurável, usando Espírito. "comum_do_poder" =
 * nível + ⌈Esp/2⌉; Canhão (2 por nível) = 2 × nível. Ex.: níveis 1·2·3 com
 * Esp 3 → "3 · 4 · 5". Quando não dá pra calcular, cai no rótulo do efeito.
 */
function resolveDamage(
  stats: Prisma.JsonValue | undefined,
  esp: number,
  levels: ReadonlyArray<number>,
): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const record = stats as Record<string, unknown>;
  const rawDamage = record.damage;
  if (typeof rawDamage === 'number') return rawDamage === 0 ? null : String(rawDamage);
  const formula = typeof record.damageFormula === 'string' ? record.damageFormula.trim() : '';
  const d = typeof rawDamage === 'string' ? rawDamage.trim() : '';
  if (d === 'nenhum' || d === 'nenhum_direto') return null;

  const perLevel = (fn: (lvl: number) => number): string | null =>
    levels.length > 0 ? levels.map(fn).join(' · ') : null;

  const isComum = d === 'comum_do_poder' || formula === 'nivel_usado + ceil(esp / 2)';
  const isDouble =
    formula === '2 * nivel_usado' ||
    d === '2x_nivel_do_poder' ||
    d === '2 por nível do poder usado' ||
    d === '2 por nível usado';

  if (isComum) return perLevel((lvl) => calculateNinpouBaseDamage(esp, lvl)) ?? formatDamage(stats);
  if (isDouble) return perLevel((lvl) => calculateCanhaoDamage(lvl)) ?? formatDamage(stats);
  return formatDamage(stats);
}

const RANGE_LABELS: Record<string, string> = {
  pessoal: 'Pessoal',
  comum_do_poder: 'comum do poder',
  meio_comum_do_poder: 'metade do comum',
  toque: 'Toque',
  curto: 'Curto',
  magen_padrao: 'padrão (genjutsu)',
};

/**
 * Le `stats[key]` e devolve rótulo legível: número vira string, códigos
 * conhecidos viram label do mapa, e o resto tem `_` trocado por espaço.
 */
function labelizeStat(
  stats: Prisma.JsonValue | undefined,
  key: string,
  labels: Record<string, string>,
): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>)[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return labels[trimmed] ?? trimmed.replace(/_/g, ' ');
}

/** Kanji do elemento por código de poder (canônico). Fallback 術 (jutsu). */
const POWER_KANJI: Record<string, string> = {
  ninpou: '忍',
  katon: '火',
  suiton: '水',
  fuuton: '風',
  doton: '土',
  raiton: '雷',
  hyouton: '氷',
  mokuton: '木',
  shouton: '晶',
  youton: '熔',
  futton: '沸',
  jiton: '磁',
  ranton: '嵐',
  shakuton: '灼',
  bakuton: '爆',
  arashi: '嵐',
  jinton: '塵',
};

function powerKanjiFor(code: string | undefined): string {
  if (!code) return '術';
  return POWER_KANJI[code] ?? '術';
}
