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
import { getElementDamageBonus } from '@/domain/rules/elements';
import { applyOriginBenefits } from './applyOriginBenefits';
import {
  resolveFichaBackground,
  resolveSectionCovers,
  resolveSectionCoverPositions,
  resolveSectionCoverZooms,
  type SectionCoverImage,
  type SectionCovers,
  type SectionCoverPositions,
  type SectionCoverZooms,
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
  /** Code do equipamento de catálogo (null se item custom). Liga o picker ao item. */
  equipmentCode: string | null;
  name: string;
  kind: string | null;
  subtype: string | null;
  category: string | null;
  quantity: number;
  equipped: boolean;
  damage: string | null;
  damageType: string | null;
  range: string | null;
  /** Descrição completa do item (pro drawer de detalhes). null em itens custom. */
  description: string | null;
  /** Resumo curto do item. */
  shortDescription: string | null;
  isWeapon: boolean;
  /** Bônus de dano numérico parseado de `damage` ("+2" → 2). null se não numérico. */
  weaponDamageValue: number | null;
  /** Tipo de ataque pra calculadora: CC (corporal) ou CD-arremesso. null = não-arma. */
  attackKind: 'cc' | 'cd_thrown' | null;
  /** Arma aceita a aptidão Acuidade (leve ou marcada em `compatibleAptitudes`). */
  acceptsAcuidade: boolean;
  /** Quantos itens cabem em 1 compartimento (`slots.items`). Default 1. */
  itemsPerCompartment: number;
  /** Compartimentos por unidade (`slots.compartments`); 0 = não ocupa (armazenamento/desprezível). */
  compartmentsPerStack: number;
  /** Compartimentos que o item FORNECE (bolsa/coldre/mochila). 0 se não for armazenamento. */
  compartmentBonus: number;
  /** Item desprezível: não conta nas regras de compartimento. */
  negligible: boolean;
  /** Compartimento onde está guardado (`<storageItemId>#<index>`), ou null se solto. */
  compartmentRef: string | null;
  /** Pode dividir um compartimento (arremesso simples ou explosivo). */
  mixable: boolean;
  /** Pode ser guardado num compartimento de armazenamento (empilhável, não-arma de mão). */
  storable: boolean;
};

/**
 * Dados numéricos de combate de um jutsu — alimentam a calculadora de dano do
 * modal. Separado dos rótulos legíveis (`damage`/`chakraCost`) porque a
 * calculadora recalcula por nível/toggle no client.
 */
export type FichaJutsuCombat = {
  /** Fórmula de dano reconhecida, ou null quando o efeito não tem dano direto calculável. */
  damageType: 'ninpou_canhao' | 'ninpou_standard' | 'ninpou_flechas' | null;
  /** Canhão a partir do nível 2 do poder permite uso sem custo de chakra (dano ÷2). */
  isCanhao: boolean;
  /** Custo de chakra numérico por nível conjurável (mesmo índice de `levels`). null = não auto-debitável. */
  chakraByLevel: ReadonlyArray<number | null>;
  /** Bônus de dano base do elemento do poder (Fuuton +2, etc.). */
  elementDamageBonus: number;
};

export type FichaJutsu = {
  id: string;
  name: string;
  /** Code do poder de origem (pro editor pré-selecionar). `null` se não resolvido. */
  powerCode: string | null;
  /** Code do efeito de origem (pro editor pré-selecionar). `null` se não resolvido. */
  effectCode: string | null;
  powerName: string | null;
  effectName: string | null;
  /** Descrição completa do efeito (pro drawer de detalhes). */
  effectDescription: string | null;
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
  /** Ação para conjurar (`stats.action`): "Padrão", "Parcial", etc. `null` se ausente. */
  action: string | null;
  /** Alvo do efeito (`stats.target`): "Uma criatura", "O ambiente", etc. `null` se ausente. */
  target: string | null;
  /** Área de efeito (`stats.areaOfEffect` + `areaHeight`), em rótulo legível. `null` se ausente. */
  area: string | null;
  /** Pré-requisito do efeito (`rules.prerequisites`), em rótulo legível. `null` se nenhum. */
  prerequisite: string | null;
  /** Glifo do elemento do poder (氷/水/火/風…) pro card. Fallback 術. */
  powerKanji: string;
  /** Dados numéricos pra calculadora de dano (modal de uso). */
  combat: FichaJutsuCombat;
};

export type FichaEffect = {
  code: string;
  name: string;
  /** Nível do efeito (nível do poder em que fica disponível). */
  minLevel: number;
  /**
   * Efeito escala com o nível conjurado (dano/custo variam). `false` = nível
   * fixo (ex.: Névoa, sempre usado no seu nível) → não precisa multi-seleção.
   */
  scaling: boolean;
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
    /** Ryos (moeda) atuais do personagem. */
    ryos: number;
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
    sectionCoverZooms: SectionCoverZooms;
    /** Imagem de fundo da ficha inteira (P&B + overlay), ou null. */
    fichaBackground: string | null;
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
    const isWeapon = eq?.kind === 'WEAPON';
    const compartment = resolveCompartment(eq?.slots, eq?.effects, isWeapon);
    return {
      id: item.id,
      equipmentCode: eq?.code ?? null,
      name: eq?.name ?? item.customName ?? 'Item',
      kind: eq?.kind ?? null,
      subtype: eq?.subtype ?? null,
      category: eq?.category ?? null,
      quantity: item.quantity,
      equipped: item.equipped,
      damage: eq?.damage ?? null,
      damageType: eq?.damageType ?? null,
      range: eq?.range ?? null,
      description: eq?.description ?? null,
      shortDescription: eq?.shortDescription ?? null,
      isWeapon,
      weaponDamageValue: isWeapon ? parseWeaponDamage(eq?.damage ?? null) : null,
      attackKind: weaponAttackKind(eq?.category ?? null, isWeapon),
      acceptsAcuidade: isWeapon && weaponAcceptsAcuidade(eq?.category ?? null, eq?.effects),
      ...compartment,
      compartmentRef: item.compartmentRef ?? null,
      mixable:
        (eq?.category === 'ARREMESSO' && eq?.subtype === 'simples') || eq?.category === 'EXPLOSIVO',
      storable:
        compartment.itemsPerCompartment > 1 &&
        compartment.compartmentBonus === 0 &&
        !compartment.negligible,
    };
  });
  // Combate Rápido: qualquer item guardado num compartimento + armas que se
  // auto-carregam (espadas etc.). Armas empilháveis (shuriken/kunai) só entram
  // quando estão guardadas num compartimento — soltas, não.
  const equippedWeapons = inventory.filter(
    (i) => i.compartmentRef != null || (i.isWeapon && !i.storable),
  );

  const jutsus: FichaJutsu[] = row.jutsus.map((j) => {
    const effect = effectById.get(j.powerEffectId);
    const power = powerByPowerId.get(j.powerId);
    return {
      id: j.id,
      name: j.name,
      powerCode: power?.code ?? null,
      effectCode: effect?.code ?? null,
      powerName: power?.name ?? null,
      effectName: effect?.name ?? null,
      effectDescription: effect?.description ?? effect?.shortDescription ?? null,
      levels: j.levels,
      imageUrl: j.imageUrl,
      description: j.flavorText,
      acerto: readRollType(effect?.stats),
      chakraCost: resolveChakra(effect?.stats, j.levels, effect?.minLevel),
      damage: resolveDamage(effect?.stats, row.attrEsp, j.levels, power?.code),
      range: resolveRange(effect?.stats, row.attrEsp),
      duration: formatDuration(effect?.stats),
      action: resolveAction(effect?.stats),
      target: resolveTarget(effect?.stats),
      area: resolveArea(effect?.stats, row.attrEsp),
      prerequisite: resolvePrerequisite(effect?.rules),
      powerKanji: powerKanjiFor(power?.code),
      combat: resolveJutsuCombat(effect?.stats, j.levels, power?.code, effect?.minLevel),
    };
  });

  // Efeitos aprendidos agrupados pelo code do poder — exibidos junto dos
  // poderes na secao Tecnicas (os jutsus reais vao no Combate Rapido).
  const effectsByPowerCode: Record<string, FichaEffect[]> = {};
  for (const [powerCode, codes] of Object.entries(learnedMap)) {
    effectsByPowerCode[powerCode] = codes.map((code) => {
      const def = effectByCode.get(code);
      return {
        code,
        name: def?.name ?? code,
        minLevel: def?.minLevel ?? 1,
        scaling: isEffectScaling(def?.stats),
      };
    });
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
      ryos: row.ryos,
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
      sectionCoverZooms: resolveSectionCoverZooms(row.uiState),
      fichaBackground: resolveFichaBackground(row.uiState),
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
  effectMinLevel: number | undefined,
): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).chakraCost;
  if (typeof raw === 'number') return raw === 0 ? 'Sem custo' : String(raw);
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key) return null;
  // Custo não especificado no livro = o próprio nível do efeito (fixo).
  if (key === 'nivel_do_efeito') return String(effectMinLevel ?? 1);
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
  powerCode: string | undefined,
): string | null {
  const profile = classifyJutsuDamageType(stats);
  const elementBonus = getElementDamageBonus(powerCode);
  const perLevel = (fn: (lvl: number) => number): string | null =>
    levels.length > 0 ? levels.map((lvl) => fn(lvl) + elementBonus).join(' · ') : null;

  if (profile === 'ninpou_standard') {
    return perLevel((lvl) => calculateNinpouBaseDamage(esp, lvl)) ?? formatDamage(stats);
  }
  if (profile === 'ninpou_canhao') {
    return perLevel((lvl) => calculateCanhaoDamage(lvl)) ?? formatDamage(stats);
  }
  if (profile === 'ninpou_flechas') {
    // 2 por projétil × nível projéteis = 2 × nível, mesmo total do Canhão; bônus
    // (incl. elemento) uma única vez por alvo, já somado por `perLevel`.
    return perLevel((lvl) => calculateCanhaoDamage(lvl)) ?? formatDamage(stats);
  }
  return formatDamage(stats);
}

/**
 * Classifica a fórmula de dano de um efeito nos dois tipos que a calculadora
 * sabe recalcular: Ninpou padrão (⌈Esp/2⌉ + nível) e Canhão (2 × nível). null
 * pra efeitos sem dano direto ou com dano só descritivo ("ver texto").
 */
function classifyJutsuDamageType(
  stats: Prisma.JsonValue | undefined,
): 'ninpou_canhao' | 'ninpou_standard' | 'ninpou_flechas' | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const record = stats as Record<string, unknown>;
  const rawDamage = record.damage;
  if (typeof rawDamage === 'number') return null;
  const formula = typeof record.damageFormula === 'string' ? record.damageFormula.trim() : '';
  const d = typeof rawDamage === 'string' ? rawDamage.trim() : '';
  if (d === 'nenhum' || d === 'nenhum_direto') return null;

  // Flechas/projéteis: 2 fixo por projétil, 1 projétil por nível usado. Total
  // = 2 × nível (mesmo do Canhão), mas sem a opção "sem custo (÷2)".
  const isFlechas =
    typeof record.projectilesFormula === 'string' || d === '2 por projétil' || d === '2_por_projetil';

  const isComum = d === 'comum_do_poder' || formula === 'nivel_usado + ceil(esp / 2)';
  const isDouble =
    formula === '2 * nivel_usado' ||
    d === '2x_nivel_do_poder' ||
    d === '2 por nível do poder usado' ||
    d === '2 por nível usado';

  if (isFlechas) return 'ninpou_flechas';
  if (isComum) return 'ninpou_standard';
  if (isDouble) return 'ninpou_canhao';
  return null;
}

/**
 * Custo de chakra numérico de um efeito num nível específico. "nivel_usado" e
 * similares = o próprio nível; "metade do nível" = ⌈nível/2⌉; número fixo é
 * mantido. Retorna null quando o custo não é auto-debitável (texto livre/varia).
 */
function chakraCostForLevel(
  stats: Prisma.JsonValue | undefined,
  level: number,
  effectMinLevel: number | undefined,
): number | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).chakraCost;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (key === 'nivel_do_efeito') return effectMinLevel ?? 1;
  if (CHAKRA_PER_LEVEL.has(key)) return level;
  if (key === 'metade_do_nivel_do_poder') return Math.ceil(level / 2);
  return null;
}

/**
 * Efeito escala com o nível conjurado? `stats.scaling === false` marca nível
 * fixo (ex.: Névoa). Default true (mantém o comportamento de efeitos com
 * dano/custo por nível).
 */
export function isEffectScaling(stats: Prisma.JsonValue | undefined): boolean {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return true;
  return (stats as Record<string, unknown>).scaling !== false;
}

/** Monta os dados numéricos de combate do jutsu pra calculadora do modal. */
function resolveJutsuCombat(
  stats: Prisma.JsonValue | undefined,
  levels: ReadonlyArray<number>,
  powerCode: string | undefined,
  effectMinLevel: number | undefined,
): FichaJutsuCombat {
  const damageType = classifyJutsuDamageType(stats);
  return {
    damageType,
    isCanhao: damageType === 'ninpou_canhao',
    chakraByLevel: levels.map((lvl) => chakraCostForLevel(stats, lvl, effectMinLevel)),
    elementDamageBonus: getElementDamageBonus(powerCode),
  };
}

/** Categorias de arma que atacam com Combate a Distância (arremesso/disparo). */
const RANGED_ATTACK_CATEGORIES = new Set(['ARREMESSO', 'DISPARO', 'EXPLOSIVO', 'AREA']);

/** Parse "+2"/"+1/+1"/"+0" → bônus numérico (primeiro token). null se não numérico. */
function parseWeaponDamage(raw: string | null): number | null {
  if (!raw) return null;
  const match = raw.match(/[+-]?\d+/);
  return match ? Number(match[0]) : null;
}

/** Tipo de ataque da arma pra calculadora: ranged → CD-arremesso, resto → CC. */
function weaponAttackKind(
  category: string | null,
  isWeapon: boolean,
): 'cc' | 'cd_thrown' | null {
  if (!isWeapon) return null;
  if (category && RANGED_ATTACK_CATEGORIES.has(category)) return 'cd_thrown';
  return 'cc';
}

/**
 * Arma aceita Acuidade? Toda arma leve (categoria LEVE) aceita por definição
 * (Livro Básico); demais precisam declarar `acuidade` em `effects.compatibleAptitudes`.
 */
function weaponAcceptsAcuidade(category: string | null, effects: Prisma.JsonValue | undefined): boolean {
  if (category === 'LEVE') return true;
  if (!effects || typeof effects !== 'object' || Array.isArray(effects)) return false;
  const compat = (effects as Record<string, unknown>).compatibleAptitudes;
  return Array.isArray(compat) && compat.includes('acuidade');
}

/** Lê um número de um campo JSON tolerante a ausência/tipo. */
function readNumber(obj: Record<string, unknown>, key: string): number | null {
  const v = obj[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Resolve os campos de compartimento de um item (Livro Básico p.127):
 * - armazenamento (bolsa/coldre/mochila) fornece via `effects.compartmentBonus`/`compartmentModifier`;
 * - itens com `slots.compartments` ocupam isso; armas de mão sem slots ocupam 1;
 * - armaduras/bugigangas sem slots não ocupam (desprezível pra regra).
 */
function resolveCompartment(
  slots: Prisma.JsonValue | undefined,
  effects: Prisma.JsonValue | undefined,
  isWeapon: boolean,
): {
  itemsPerCompartment: number;
  compartmentsPerStack: number;
  compartmentBonus: number;
  negligible: boolean;
} {
  const slotsObj = slots && typeof slots === 'object' && !Array.isArray(slots) ? (slots as Record<string, unknown>) : {};
  const effectsObj =
    effects && typeof effects === 'object' && !Array.isArray(effects)
      ? (effects as Record<string, unknown>)
      : {};

  const compartmentBonus =
    readNumber(effectsObj, 'compartmentBonus') ?? readNumber(effectsObj, 'compartmentModifier') ?? 0;
  const itemsPerCompartment = readNumber(slotsObj, 'items') ?? 1;
  const slotsCompartments = readNumber(slotsObj, 'compartments');

  let compartmentsPerStack: number;
  if (compartmentBonus > 0) {
    compartmentsPerStack = 0; // armazenamento fornece, não ocupa
  } else if (slotsCompartments != null) {
    compartmentsPerStack = slotsCompartments;
  } else if (isWeapon) {
    compartmentsPerStack = 1; // arma sem slots explícitos ocupa 1 (bainha/aljava)
  } else {
    compartmentsPerStack = 0; // armadura/bugiganga: não ocupa compartimento
  }

  const negligible = compartmentBonus === 0 && compartmentsPerStack === 0;
  return { itemsPerCompartment, compartmentsPerStack, compartmentBonus, negligible };
}

/** Tokens de ação (enum do seed) → rótulo capitalizado. */
const ACTION_LABELS: Record<string, string> = {
  PADRAO: 'Padrão',
  PARCIAL: 'Parcial',
  MOVIMENTO: 'Movimento',
  COMPLETA: 'Completa',
  LIVRE: 'Livre',
  REACAO: 'Reação',
};

/** Le `stats.action` e devolve rótulo legível (ex.: PADRAO → "Padrão"). */
function resolveAction(stats: Prisma.JsonValue | undefined): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).action;
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key) return null;
  return ACTION_LABELS[key.toUpperCase()] ?? capitalizeWords(key.replace(/_/g, ' '));
}

/** Codigos de alvo do seed → rótulo legível em PT. */
const TARGET_LABELS: Record<string, string> = {
  ambiente: 'O ambiente',
  uma_criatura: 'Uma criatura',
  uma_ou_mais_criaturas: 'Uma ou mais criaturas',
  varias_criaturas: 'Várias criaturas',
  area: 'Área',
  pessoal: 'Pessoal',
  si_mesmo: 'Si mesmo',
  um_objeto: 'Um objeto',
  um_aliado: 'Um aliado',
};

/** Le `stats.target` e devolve rótulo legível (ex.: "ambiente" → "O ambiente"). */
function resolveTarget(stats: Prisma.JsonValue | undefined): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const raw = (stats as Record<string, unknown>).target;
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key) return null;
  return TARGET_LABELS[key] ?? capitalizeWords(key.replace(/_/g, ' '));
}

/**
 * Le `stats.areaOfEffect` (+ `areaHeight`) e devolve rótulo legível. Resolve o
 * termo "por Espírito" com o Esp atual (ex.: "3m_por_esp" com Esp 3 → "9m") e
 * deixa o restante como fórmula. Ex.: "Círculo Ø 30m + 9m · alt. comum do poder".
 */
function resolveArea(stats: Prisma.JsonValue | undefined, esp: number): string | null {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return null;
  const rec = stats as Record<string, unknown>;
  const raw = rec.areaOfEffect;
  if (typeof raw === 'number') return `${raw}m`;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const shape = raw
    .replace(/(\d+)m_por_esp/gi, (_, n: string) => `${Number(n) * esp}m`)
    .replace(/circulo/gi, 'Círculo Ø')
    .replace(/quadrado/gi, 'Quadrado')
    .replace(/_diametro/gi, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const h = rec.areaHeight;
  const height =
    typeof h === 'string' && h.trim()
      ? h.trim() === 'comum_do_poder'
        ? 'alt. comum do poder'
        : h.replace(/_/g, ' ')
      : null;
  return height ? `${shape} · ${height}` : shape;
}

/** Rótulos de aptidões usadas como pré-requisito de efeito. */
const PREREQ_APTITUDE_LABELS: Record<string, string> = {
  lutar_as_cegas: 'Lutar às Cegas',
  sensor: 'sensor',
};

/**
 * Le `rules.prerequisites` e devolve rótulo legível. Cobre os formatos do seed:
 * `aptitudes_one_of` (junta com "ou") e `aptitudes_all` (junta com "e").
 */
function resolvePrerequisite(rules: Prisma.JsonValue | undefined): string | null {
  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) return null;
  const pre = (rules as Record<string, unknown>).prerequisites;
  if (!pre || typeof pre !== 'object' || Array.isArray(pre)) return null;
  const rec = pre as Record<string, unknown>;
  const label = (code: string): string =>
    PREREQ_APTITUDE_LABELS[code] ?? capitalizeWords(code.replace(/_/g, ' '));

  const oneOf = rec.aptitudes_one_of;
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    return oneOf.filter((c): c is string => typeof c === 'string').map(label).join(' ou ');
  }
  const all = rec.aptitudes_all;
  if (Array.isArray(all) && all.length > 0) {
    return all.filter((c): c is string => typeof c === 'string').map(label).join(' e ');
  }
  return null;
}

/** Capitaliza a primeira letra de cada palavra (rótulos derivados de codes). */
function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
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
