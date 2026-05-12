import type { Attributes, ValidationResult } from '../types';
import { getPericiaByCode, isPrimaryAttribute, PERICIAS } from '../catalog/pericias';
import { roundUp } from './math';
import { getLevelRow } from './pointsBudget';
import { getPericaLimit } from './attributeLimits';

/**
 * Nível total de uma perícia = ⌈atributo/2⌉ + pontos investidos.
 *
 * Perícias com `trained=true` e zero pontos retornam 0 ("sem treino" no livro).
 */
export function calculatePericiaLevel(
  pointsInvested: number,
  attributeValue: number,
  trained = false,
): number {
  if (trained && pointsInvested === 0) return 0;
  const initial = roundUp(attributeValue / 2);
  return initial + pointsInvested;
}

/**
 * Conveniência: calcula nível usando código + atributos primários do personagem.
 *
 * Para perícias sociais (atualmente apenas `obter_informacao` com base em
 * Carisma + ½ Inteligência) o cálculo não está implementado — lance erro
 * explícito em vez de fingir suporte com NaN. Implementação social entra
 * quando os atributos sociais do `Character` tiverem cálculo dedicado.
 */
export function calculatePericiaLevelByCode(
  code: string,
  attributes: Attributes,
  pointsInvested: number,
): number {
  const def = getPericiaByCode(code);
  if (!def) {
    throw new Error(`Perícia desconhecida: ${code}`);
  }
  if (!isPrimaryAttribute(def.attribute)) {
    throw new Error(
      `Perícia "${code}" usa atributo social ("${def.attribute}"). Cálculo social ainda não implementado.`,
    );
  }
  return calculatePericiaLevel(pointsInvested, attributes[def.attribute], def.trained);
}

/**
 * Valida o gasto total e por-perícia respeitando budget e limite individual.
 *
 * Regras:
 *   - Perícia desconhecida (code fora do catálogo) → erro explícito.
 *   - Pontos negativos / não-inteiros → erro.
 *   - Pontos individuais > ⌊NC/2⌋ → erro.
 *   - Soma total > orçamento da tabela de evolução → erro.
 *   - `doubleTrained` (ex.: Venefício) só pode ser comprada se a aptidão
 *     associada estiver presente — essa checagem entra quando o catálogo de
 *     aptidões for seedado (F2.3+). Por ora, perícias `doubleTrained` passam
 *     pela validação de budget normalmente; o gate de aptidão é responsabilidade
 *     do wizard de criação.
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
