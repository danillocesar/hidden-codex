import type { Attributes, ValidationResult } from '../types';
import { getPericiaByCode, PERICIAS } from '../catalog/pericias';
import { roundUp } from './math';
import { getLevelRow } from './pointsBudget';
import { getPericaLimit } from './attributeLimits';

/**
 * Nível total de uma perícia = ⌈atributo/2⌉ + pontos investidos.
 *
 * Perícias com `requiresTraining` e zero pontos retornam 0 ("sem treino").
 */
export function calculatePericiaLevel(
  pointsInvested: number,
  attributeValue: number,
  requiresTraining = false,
): number {
  if (requiresTraining && pointsInvested === 0) return 0;
  const initial = roundUp(attributeValue / 2);
  return initial + pointsInvested;
}

/** Conveniência: calcula nível usando código + atributos do personagem. */
export function calculatePericiaLevelByCode(
  code: string,
  attributes: Attributes,
  pointsInvested: number,
): number {
  const def = getPericiaByCode(code);
  if (!def) {
    throw new Error(`Perícia desconhecida: ${code}`);
  }
  return calculatePericiaLevel(pointsInvested, attributes[def.attribute], def.requiresTraining);
}

/**
 * Valida o gasto total e por-perícia respeitando budget e limite individual.
 * Inclui regras de criação:
 *   - Venefício é proibida em NC 4 (criação inicial).
 *   - Perícia desconhecida (code não está no catálogo) gera erro explícito.
 */
export function validatePericiaBudget(
  pericias: Readonly<Record<string, number>>,
  nc: number,
): ValidationResult {
  const row = getLevelRow(nc);
  const maxBudget = row.pericaPoints;
  const maxPerPericia = getPericaLimit(nc);

  let total = 0;
  for (const [code, points] of Object.entries(pericias)) {
    if (!Number.isFinite(points) || !Number.isInteger(points) || points < 0) {
      return { ok: false, error: `Perícia ${code} com pontos inválidos: ${points}.` };
    }
    const def = getPericiaByCode(code);
    if (!def) {
      return { ok: false, error: `Perícia desconhecida: "${code}".` };
    }
    if (points > maxPerPericia) {
      return {
        ok: false,
        error: `Perícia ${def.name} excede limite de pontos (${points}/${maxPerPericia}).`,
      };
    }
    if (def.forbiddenAtNc4 && nc === 4 && points > 0) {
      return {
        ok: false,
        error: `${def.name} não pode ser adquirida na criação (NC 4).`,
      };
    }
    total += points;
  }

  if (total > maxBudget) {
    return {
      ok: false,
      error: `Total de pontos em perícias excede o orçamento (${total}/${maxBudget}).`,
    };
  }

  return { ok: true };
}

/** Retorna o total de pontos investidos atualmente. Útil para "X / Y pontos". */
export function sumPericiaPoints(pericias: Readonly<Record<string, number>>): number {
  let total = 0;
  for (const points of Object.values(pericias)) {
    if (Number.isFinite(points) && points > 0) total += points;
  }
  return total;
}

export { PERICIAS };
