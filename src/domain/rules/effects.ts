import type { CharacterCore, CharacterPowerRef, ValidationResult } from '../types';
import {
  checkAptitudePrerequisites,
  type AptitudePrerequisites,
  type PrerequisiteResult,
} from './aptitudes';

/**
 * Definicao minima de efeito consumida pelo motor — espelha `PowerEffect` do
 * banco mas sem ID/timestamps. Permite testar regras sem Prisma.
 */
export type EffectDef = {
  code: string;
  name: string;
  minLevel: number;
  availableFor: ReadonlyArray<string>;
  rules?: { prerequisites?: AptitudePrerequisites } | null | Record<string, unknown>;
};

/**
 * Filtra os efeitos disponiveis pra um (power, level) — sem checar pre-req.
 *
 * Regras (RAW Livro Basico):
 *   - `power.code` deve estar em `effect.availableFor`
 *   - `effect.minLevel` deve ser <= nivel atual do poder
 */
export function getAvailableEffects(
  catalog: ReadonlyArray<EffectDef>,
  powerCode: string,
  powerLevel: number,
): ReadonlyArray<EffectDef> {
  return catalog.filter(
    (e) => e.availableFor.includes(powerCode) && e.minLevel <= powerLevel,
  );
}

/**
 * Wrapper sobre `checkAptitudePrerequisites` — efeitos usam o MESMO
 * vocabulario canonico no `rules.prerequisites`, entao reusamos direto.
 */
export function checkEffectPrerequisites(
  effect: EffectDef,
  character: CharacterCore,
): PrerequisiteResult {
  const rules = (effect.rules ?? {}) as Record<string, unknown>;
  const prereqs = (rules.prerequisites ?? {}) as AptitudePrerequisites;
  return checkAptitudePrerequisites(prereqs, character);
}

/**
 * Valida selecao COMPLETA de efeitos por poder (chamada no submit do wizard
 * e no level-up). Regras:
 *   1. Cada (powerCode, effectCode) deve existir no catalogo
 *   2. Cada efeito selecionado deve estar em `availableFor` do poder
 *   3. `effect.minLevel <= power.level`
 *   4. Quantidade selecionada por poder = nivel do poder (slots obrigatorios)
 *   5. Pre-reqs cumpridos (excluindo `manualReview` que ja foi aprovado fora)
 *   6. Sem duplicatas (mesmo effect 2x no mesmo poder)
 */
export function validateEffectSelection(args: {
  characterPowers: ReadonlyArray<CharacterPowerRef>;
  selectedByPower: Readonly<Record<string, ReadonlyArray<string>>>;
  catalog: ReadonlyArray<EffectDef>;
  character: CharacterCore;
}): ValidationResult {
  const { characterPowers, selectedByPower, catalog, character } = args;
  const byCode = new Map(catalog.map((e) => [e.code, e]));

  for (const power of characterPowers) {
    const selected = selectedByPower[power.code] ?? [];

    // 4. Quantidade
    if (selected.length !== power.level) {
      return {
        ok: false,
        error: `Poder ${power.code}: ${selected.length}/${power.level} efeitos selecionados.`,
      };
    }

    // 6. Duplicatas
    const dedup = new Set(selected);
    if (dedup.size !== selected.length) {
      return {
        ok: false,
        error: `Poder ${power.code}: efeito duplicado na selecao.`,
      };
    }

    for (const effectCode of selected) {
      const effect = byCode.get(effectCode);
      // 1. Existe no catalogo
      if (!effect) {
        return {
          ok: false,
          error: `Efeito desconhecido: ${effectCode}.`,
        };
      }
      // 2. AvailableFor
      if (!effect.availableFor.includes(power.code)) {
        return {
          ok: false,
          error: `Efeito ${effectCode} nao esta disponivel para o poder ${power.code}.`,
        };
      }
      // 3. minLevel
      if (effect.minLevel > power.level) {
        return {
          ok: false,
          error: `Efeito ${effectCode} exige ${power.code} nivel >= ${effect.minLevel} (atual ${power.level}).`,
        };
      }
      // 5. Pre-reqs
      const prereq = checkEffectPrerequisites(effect, character);
      if (!prereq.allMet) {
        const missing = prereq.checks
          .filter((c) => !c.met && !c.manualReview)
          .map((c) => c.detail)
          .join('; ');
        if (missing.length > 0) {
          return {
            ok: false,
            error: `Pre-requisitos faltantes pro efeito ${effectCode}: ${missing}.`,
          };
        }
      }
    }
  }

  return { ok: true };
}
