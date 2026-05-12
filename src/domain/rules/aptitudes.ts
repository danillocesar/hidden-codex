import type { AttributeKey, CharacterCore, CombatSkillKey } from '../types';
import { calculateCC, calculateCD, calculateESQ, calculateLM } from './derivedStats';
import { calculatePericiaLevelByCode } from './skills';

export type AptitudePrerequisites = {
  attributes?: Partial<Record<AttributeKey, number>>;
  combatSkills?: Partial<Record<CombatSkillKey, number>>;
  pericias?: Record<string, number>;
  powers?: Record<string, number>;
  aptitudes?: ReadonlyArray<string>;
  kekkeiGenkai?: ReadonlyArray<string>;
  clans?: ReadonlyArray<string>;
  custom?: string;
};

export type PrerequisiteCheck = {
  type: 'attribute' | 'combatSkill' | 'pericia' | 'power' | 'aptitude' | 'kekkei' | 'clan' | 'custom';
  detail: string;
  met: boolean;
};

export type PrerequisiteResult = {
  allMet: boolean;
  checks: ReadonlyArray<PrerequisiteCheck>;
};

/**
 * Avalia pré-requisitos de uma aptidão contra o estado atual do personagem.
 *
 * Para combat skills, usa o cálculo BASE (sem arma/Especialista) — o livro
 * permite usar bônus de Acuidade (substituição de atributo) para cumprir
 * pré-reqs, mas NÃO bônus aditivos como Especialista.
 *
 * Spec 04-RULES-ENGINE.md §"Acuidade" e §"Ambidestria".
 */
export function checkAptitudePrerequisites(
  prereqs: AptitudePrerequisites,
  character: CharacterCore,
): PrerequisiteResult {
  const checks: PrerequisiteCheck[] = [];

  if (prereqs.attributes) {
    for (const [attr, required] of Object.entries(prereqs.attributes)) {
      if (required == null) continue;
      const value = character.attributes[attr as AttributeKey];
      checks.push({
        type: 'attribute',
        detail: `${attr.toUpperCase()} ≥ ${required}`,
        met: value >= required,
      });
    }
  }

  if (prereqs.combatSkills) {
    const aptitudeCodes = character.aptitudes.map((a) => a.code);
    const input = {
      attributes: character.attributes,
      bases: character.bases,
      aptitudeCodes,
    };
    const stats: Record<CombatSkillKey, number> = {
      cc: calculateCC(input),
      cd: calculateCD(input),
      esq: calculateESQ(input),
      lm: calculateLM(input),
    };
    for (const [skill, required] of Object.entries(prereqs.combatSkills)) {
      if (required == null) continue;
      const key = skill as CombatSkillKey;
      checks.push({
        type: 'combatSkill',
        detail: `${skill.toUpperCase()} ≥ ${required}`,
        met: stats[key] >= required,
      });
    }
  }

  if (prereqs.pericias) {
    for (const [code, required] of Object.entries(prereqs.pericias)) {
      const points = character.pericias[code] ?? 0;
      let level = 0;
      try {
        level = calculatePericiaLevelByCode(code, character.attributes, points);
      } catch {
        level = 0;
      }
      checks.push({
        type: 'pericia',
        detail: `${code} nível ≥ ${required}`,
        met: level >= required,
      });
    }
  }

  if (prereqs.powers) {
    for (const [code, required] of Object.entries(prereqs.powers)) {
      const owned = character.powers.find((p) => p.code === code);
      checks.push({
        type: 'power',
        detail: `${code} nível ≥ ${required}`,
        met: (owned?.level ?? 0) >= required,
      });
    }
  }

  if (prereqs.aptitudes) {
    for (const code of prereqs.aptitudes) {
      checks.push({
        type: 'aptitude',
        detail: `aptidão ${code}`,
        met: character.aptitudes.some((a) => a.code === code),
      });
    }
  }

  if (prereqs.kekkeiGenkai) {
    for (const kg of prereqs.kekkeiGenkai) {
      checks.push({
        type: 'kekkei',
        detail: `kekkei genkai ${kg}`,
        met: character.kekkeiGenkai?.code === kg,
      });
    }
  }

  if (prereqs.clans) {
    for (const clan of prereqs.clans) {
      checks.push({
        type: 'clan',
        detail: `clã ${clan}`,
        met: character.clan?.code === clan,
      });
    }
  }

  return {
    allMet: checks.every((c) => c.met),
    checks,
  };
}
