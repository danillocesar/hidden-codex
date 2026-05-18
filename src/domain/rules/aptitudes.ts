import type {
  AttributeKey,
  CharacterAptitudeRef,
  CharacterCore,
  CombatSkillKey,
} from '../types';
import { calculateCC, calculateCD, calculateESQ, calculateLM } from './derivedStats';
import { calculatePericiaLevelByCode } from './skills';

/**
 * Vocabulario canonico de pre-requisitos.
 *
 * Cobre SCHEMA-PATTERNS section 2 + section 3 do projeto seed-data.
 *
 * Discriminadores principais:
 *   - * (AND): atributos/pericias/aptidoes/powers que TODOS precisam ser cumpridos
 *   - *_one_of (OR): qualquer um dos listados cumpre
 *   - alternatives (recursivo): qualquer um dos blocos AND aninhados cumpre
 *   - mutuallyExclusiveWith / incompatibleWith: char NAO pode ter essa aptidao
 *   - narrative: flag narrativo (Mestre marca via character.narrativeFlags)
 */
export type AptitudePrerequisites = {
  type?: string;
  attributes?: Partial<Record<AttributeKey, number>>;
  attributes_one_of?: Partial<Record<AttributeKey, number>>;
  combatSkills?: Partial<Record<CombatSkillKey, number>>;
  combatSkills_one_of?: Partial<Record<CombatSkillKey, number>>;
  pericias?: Record<string, number>;
  pericias_one_of?: Record<string, number>;
  skills?: Record<string, number>;
  powers?: Record<string, number>;
  powers_one_of?: Record<string, number> | ReadonlyArray<string>;
  aptitudes?: ReadonlyArray<string>;
  aptitudes_one_of?: ReadonlyArray<string>;
  effects?: ReadonlyArray<string>;
  kekkeiGenkai?: ReadonlyArray<string>;
  clans?: ReadonlyArray<string>;
  clans_one_of?: ReadonlyArray<string>;
  mutuallyExclusiveWith?: ReadonlyArray<string>;
  incompatibleWith?: ReadonlyArray<string>;
  narrative?: string;
  alternatives?: ReadonlyArray<
    AptitudePrerequisites & { name?: string; description?: string }
  >;
  custom?: string;
  // Refinements (nao validados; passam direto pra UI):
  weaponEquipped?: string;
  kuchiyoseRestriction?: ReadonlyArray<string>;
  noAdjacentObstaclesOrEnemies?: boolean;
  [extra: string]: unknown;
};

export type PrerequisiteCheckType =
  | 'attribute'
  | 'attribute_one_of'
  | 'combatSkill'
  | 'combatSkill_one_of'
  | 'pericia'
  | 'pericia_one_of'
  | 'power'
  | 'power_one_of'
  | 'aptitude'
  | 'aptitude_one_of'
  | 'effect'
  | 'kekkei'
  | 'clan'
  | 'clan_one_of'
  | 'mutuallyExclusive'
  | 'incompatible'
  | 'narrative'
  | 'alternative'
  | 'custom';

export type PrerequisiteCheck = {
  type: PrerequisiteCheckType;
  detail: string;
  met: boolean;
  /** Sinaliza que o check exige aprovacao manual do Mestre (narrativo, custom). */
  manualReview?: boolean;
  // Campos estruturados opcionais consumidos pelo humanizer da UI
  // (`src/lib/character/humanizePrereq.ts`). `detail` continua sendo o
  // formato canonico pros testes; estes ficam estaveis tambem.
  /** Code do item alvo (attribute key, pericia code, aptitude code, etc). */
  code?: string;
  /** Codes alternativos quando o check e do tipo `_one_of`. */
  codes?: ReadonlyArray<string>;
  /** Valor numerico requerido (>=). */
  value?: number;
  /** Valores numericos alternativos quando o check e `_one_of` de Record. */
  values?: ReadonlyArray<number>;
};

export type PrerequisiteResult = {
  allMet: boolean;
  checks: ReadonlyArray<PrerequisiteCheck>;
};

/**
 * Bases parametrizaveis conhecidas (RAW). Refs como perito_medicina sao
 * desdobradas em { base: "perito", parameter: "medicina" } ao validar.
 *
 * Ordem importa: prefixos mais longos primeiro (ex: usar_armaduras
 * antes de usar_arma).
 */
const PARAMETERIZABLE_APTITUDE_BASES: ReadonlyArray<string> = [
  'pericia_inata',
  'resistencia_maior',
  'usar_armaduras',
  'usar_arma',
  'maestria',
  'dominio',
  'guerreiro',
  'especialista',
  'perito',
  'clone',
];

/**
 * Tenta desdobrar perito_medicina em { base: "perito", parameter: "medicina" }.
 * Retorna null se o code nao bate com nenhuma base parametrizavel conhecida.
 */
export function splitParameterizedAptitude(
  code: string,
): { base: string; parameter: string } | null {
  for (const base of PARAMETERIZABLE_APTITUDE_BASES) {
    if (code.startsWith(`${base}_`) && code.length > base.length + 1) {
      return { base, parameter: code.slice(base.length + 1) };
    }
  }
  return null;
}

/**
 * Verifica se o personagem TEM uma aptidao (com fallback pra refs parametrizadas).
 */
export function hasAptitude(
  code: string,
  aptitudes: ReadonlyArray<CharacterAptitudeRef>,
): boolean {
  if (aptitudes.some((a) => a.code === code && !a.parameter)) {
    return true;
  }
  const split = splitParameterizedAptitude(code);
  if (split !== null) {
    return aptitudes.some(
      (a) => a.code === split.base && a.parameter === split.parameter,
    );
  }
  return aptitudes.some((a) => a.code === code);
}

/**
 * Calcula combat skills (CC/CD/ESQ/LM) base do personagem (sem arma/aptidao extra).
 */
function getCombatStats(character: CharacterCore): Record<CombatSkillKey, number> {
  const aptitudeCodes = character.aptitudes.map((a) => a.code);
  const input = {
    attributes: character.attributes,
    bases: character.bases,
    aptitudeCodes,
  };
  return {
    cc: calculateCC(input),
    cd: calculateCD(input),
    esq: calculateESQ(input),
    lm: calculateLM(input),
  };
}

/**
 * Avalia pre-requisitos de uma aptidao contra o estado atual do personagem.
 *
 * Suporta vocabulario completo de SCHEMA-PATTERNS section 2 + section 3:
 *   - Variantes AND e _one_of (OR) pra cada categoria
 *   - alternatives recursivo (multi-caminho)
 *   - effects (techniques aprendidas)
 *   - narrative (flag do Mestre)
 *   - mutuallyExclusiveWith / incompatibleWith
 *   - Refs parametrizadas (perito_medicina, usar_arma_katana, etc.)
 */
export function checkAptitudePrerequisites(
  prereqs: AptitudePrerequisites,
  character: CharacterCore,
): PrerequisiteResult {
  const checks: PrerequisiteCheck[] = [];

  // Atributos (AND)
  if (prereqs.attributes) {
    for (const [attr, required] of Object.entries(prereqs.attributes)) {
      if (required == null) continue;
      const value = character.attributes[attr as AttributeKey];
      checks.push({
        type: 'attribute',
        detail: `${attr.toUpperCase()} >= ${required}`,
        met: value >= required,
        code: attr,
        value: required,
      });
    }
  }

  // Atributos (OR)
  if (prereqs.attributes_one_of) {
    const entries = Object.entries(prereqs.attributes_one_of).filter(
      ([, v]) => v != null,
    ) as Array<[string, number]>;
    if (entries.length > 0) {
      const met = entries.some(([attr, required]) => {
        return character.attributes[attr as AttributeKey] >= required;
      });
      const detail = entries.map(([a, v]) => `${a.toUpperCase()} >= ${v}`).join(' OU ');
      checks.push({
        type: 'attribute_one_of',
        detail,
        met,
        codes: entries.map(([a]) => a),
        values: entries.map(([, v]) => v),
      });
    }
  }

  // Combat Skills (AND)
  if (prereqs.combatSkills) {
    const stats = getCombatStats(character);
    for (const [skill, required] of Object.entries(prereqs.combatSkills)) {
      if (required == null) continue;
      const key = skill as CombatSkillKey;
      checks.push({
        type: 'combatSkill',
        detail: `${skill.toUpperCase()} >= ${required}`,
        met: stats[key] >= required,
        code: skill,
        value: required,
      });
    }
  }

  // Combat Skills (OR)
  if (prereqs.combatSkills_one_of) {
    const stats = getCombatStats(character);
    const entries = Object.entries(prereqs.combatSkills_one_of).filter(
      ([, v]) => v != null,
    ) as Array<[string, number]>;
    if (entries.length > 0) {
      const met = entries.some(
        ([skill, required]) => stats[skill as CombatSkillKey] >= required,
      );
      const detail = entries.map(([s, v]) => `${s.toUpperCase()} >= ${v}`).join(' OU ');
      checks.push({
        type: 'combatSkill_one_of',
        detail,
        met,
        codes: entries.map(([s]) => s),
        values: entries.map(([, v]) => v),
      });
    }
  }

  // Pericias (AND) - pericias + skills (alias)
  const periciaInputs = { ...(prereqs.pericias ?? {}), ...(prereqs.skills ?? {}) };
  if (Object.keys(periciaInputs).length > 0) {
    for (const [code, required] of Object.entries(periciaInputs)) {
      const points = character.pericias[code] ?? 0;
      let level = 0;
      try {
        level = calculatePericiaLevelByCode(code, character.attributes, points);
      } catch {
        level = 0;
      }
      checks.push({
        type: 'pericia',
        detail: `${code} nivel >= ${required}`,
        met: level >= required,
        code,
        value: required,
      });
    }
  }

  // Pericias (OR)
  if (prereqs.pericias_one_of && Object.keys(prereqs.pericias_one_of).length > 0) {
    const entries = Object.entries(prereqs.pericias_one_of);
    const met = entries.some(([code, required]) => {
      const points = character.pericias[code] ?? 0;
      try {
        return calculatePericiaLevelByCode(code, character.attributes, points) >= required;
      } catch {
        return false;
      }
    });
    const detail = entries.map(([c, v]) => `${c} >= ${v}`).join(' OU ');
    checks.push({
      type: 'pericia_one_of',
      detail,
      met,
      codes: entries.map(([c]) => c),
      values: entries.map(([, v]) => v),
    });
  }

  // Powers (AND)
  if (prereqs.powers) {
    for (const [code, required] of Object.entries(prereqs.powers)) {
      const owned = character.powers.find((p) => p.code === code);
      checks.push({
        type: 'power',
        detail: `${code} nivel >= ${required}`,
        met: (owned?.level ?? 0) >= required,
        code,
        value: required,
      });
    }
  }

  // Powers (OR) - aceita Record OU array (nivel 1 implicito)
  if (prereqs.powers_one_of) {
    const requirements: Array<[string, number]> = Array.isArray(prereqs.powers_one_of)
      ? prereqs.powers_one_of.map((c) => [c, 1] as [string, number])
      : Object.entries(prereqs.powers_one_of);
    if (requirements.length > 0) {
      const met = requirements.some(([code, required]) => {
        const owned = character.powers.find((p) => p.code === code);
        return (owned?.level ?? 0) >= required;
      });
      const detail = requirements.map(([c, v]) => `${c} >= ${v}`).join(' OU ');
      checks.push({
        type: 'power_one_of',
        detail,
        met,
        codes: requirements.map(([c]) => c),
        values: requirements.map(([, v]) => v),
      });
    }
  }

  // Aptidoes (AND, com fallback parametrizado)
  if (prereqs.aptitudes) {
    for (const code of prereqs.aptitudes) {
      checks.push({
        type: 'aptitude',
        detail: `aptidao ${code}`,
        met: hasAptitude(code, character.aptitudes),
        code,
      });
    }
  }

  // Aptidoes (OR)
  if (prereqs.aptitudes_one_of && prereqs.aptitudes_one_of.length > 0) {
    const codes = prereqs.aptitudes_one_of;
    const met = codes.some((c) => hasAptitude(c, character.aptitudes));
    checks.push({
      type: 'aptitude_one_of',
      detail: codes.map((c) => `aptidao ${c}`).join(' OU '),
      met,
      codes: [...codes],
    });
  }

  // Effects (techniques aprendidas)
  if (prereqs.effects && prereqs.effects.length > 0) {
    const learned = new Set(character.learnedEffects ?? []);
    for (const code of prereqs.effects) {
      checks.push({
        type: 'effect',
        detail: `efeito ${code}`,
        met: learned.has(code),
        code,
      });
    }
  }

  // Kekkei Genkai
  if (prereqs.kekkeiGenkai) {
    for (const kg of prereqs.kekkeiGenkai) {
      checks.push({
        type: 'kekkei',
        detail: `kekkei genkai ${kg}`,
        met: character.kekkeiGenkai?.code === kg,
        code: kg,
      });
    }
  }

  // Clas (AND)
  if (prereqs.clans) {
    for (const clan of prereqs.clans) {
      checks.push({
        type: 'clan',
        detail: `cla ${clan}`,
        met: character.clan?.code === clan,
        code: clan,
      });
    }
  }

  // Clas (OR)
  if (prereqs.clans_one_of && prereqs.clans_one_of.length > 0) {
    const met = prereqs.clans_one_of.some((c) => character.clan?.code === c);
    checks.push({
      type: 'clan_one_of',
      detail: prereqs.clans_one_of.map((c) => `cla ${c}`).join(' OU '),
      met,
      codes: [...prereqs.clans_one_of],
    });
  }

  // Mutually Exclusive / Incompatible (NEGATIVO: char NAO pode ter)
  if (prereqs.mutuallyExclusiveWith && prereqs.mutuallyExclusiveWith.length > 0) {
    for (const code of prereqs.mutuallyExclusiveWith) {
      checks.push({
        type: 'mutuallyExclusive',
        detail: `NAO pode ter ${code}`,
        met: !hasAptitude(code, character.aptitudes),
        code,
      });
    }
  }
  if (prereqs.incompatibleWith && prereqs.incompatibleWith.length > 0) {
    for (const code of prereqs.incompatibleWith) {
      checks.push({
        type: 'incompatible',
        detail: `NAO pode ter ${code}`,
        met: !hasAptitude(code, character.aptitudes),
        code,
      });
    }
  }

  // Narrativo (Mestre marca via narrativeFlags)
  if (prereqs.narrative) {
    const flagSet = new Set(character.narrativeFlags ?? []);
    const met = flagSet.has(prereqs.narrative);
    checks.push({
      type: 'narrative',
      detail: `flag narrativo: ${prereqs.narrative}`,
      met,
      manualReview: !met,
      code: prereqs.narrative,
    });
  }

  // Custom (string descritiva - sempre manualReview)
  if (prereqs.custom) {
    checks.push({
      type: 'custom',
      detail: prereqs.custom,
      met: false,
      manualReview: true,
    });
  }

  // Alternatives (RECURSIVO - OR de blocos AND aninhados)
  if (prereqs.alternatives && prereqs.alternatives.length > 0) {
    const altResults = prereqs.alternatives.map((alt) => {
      const { name, description: _description, ...altPrereqs } = alt;
      const altResult = checkAptitudePrerequisites(altPrereqs, character);
      return { name: name ?? '?', result: altResult };
    });
    const anyMet = altResults.some((a) => a.result.allMet);
    const detail = altResults
      .map((a) => `[${a.name}] ${a.result.allMet ? 'ok' : 'falha'}`)
      .join(' OU ');
    checks.push({ type: 'alternative', detail, met: anyMet });
  }

  return {
    allMet: checks.every((c) => c.met),
    checks,
  };
}
