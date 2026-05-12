import type { CharacterAptitudeRef, CharacterPowerRef, ValidationResult } from '../types';
import { getPowerLimit } from './attributeLimits';
import { getPowerBudget } from './pointsBudget';

export const APTITUDE_COST = 2 as const;

/**
 * Calcula o custo total de poderes considerando níveis gratuitos da origem
 * (kekkei genkai, clã). Níveis grátis abatem dos níveis pagos.
 *
 * Exemplo (Satsuki NC 6):
 *   - hyouton 3 (3 pts pagos)
 *   - suiton 2, 1 nível grátis → 1 pt pago
 *   - fuuton 1, 1 nível grátis → 0 pago
 *   Total: 4 pts.
 */
export function calculateTotalPowerCost(
  characterPowers: ReadonlyArray<CharacterPowerRef>,
  freeLevelsByPower: Readonly<Record<string, number>>,
): number {
  let total = 0;
  for (const { code, level } of characterPowers) {
    const free = freeLevelsByPower[code] ?? 0;
    const paid = Math.max(0, level - free);
    total += paid;
  }
  return total;
}

export function calculateAptitudeCost(
  aptitudes: ReadonlyArray<CharacterAptitudeRef>,
): number {
  return aptitudes.filter((a) => !a.isFreeFromOrigin).length * APTITUDE_COST;
}

/**
 * Validação combinada do orçamento de poder (poderes + aptidões pagas).
 *
 * 1. Cada poder respeita o limite ⌊NC/2⌋.
 * 2. Soma de pontos pagos não passa do budget da tabela de evolução.
 */
export function validatePowersAndAptitudes(args: {
  characterPowers: ReadonlyArray<CharacterPowerRef>;
  aptitudes: ReadonlyArray<CharacterAptitudeRef>;
  freeLevelsByPower: Readonly<Record<string, number>>;
  nc: number;
}): ValidationResult {
  const { characterPowers, aptitudes, freeLevelsByPower, nc } = args;
  const limit = getPowerLimit(nc);

  for (const { code, level } of characterPowers) {
    if (!Number.isInteger(level) || level < 0) {
      return { ok: false, error: `Poder ${code} com nível inválido: ${level}.` };
    }
    if (level > limit) {
      return {
        ok: false,
        error: `Poder ${code} nível ${level} excede limite ${limit} para NC ${nc}.`,
      };
    }
  }

  const powerCost = calculateTotalPowerCost(characterPowers, freeLevelsByPower);
  const aptidaoCost = calculateAptitudeCost(aptitudes);
  const total = powerCost + aptidaoCost;
  const budget = getPowerBudget(nc);

  if (total > budget) {
    return {
      ok: false,
      error: `Total de pontos de poder excede o orçamento (${total}/${budget}).`,
    };
  }

  return { ok: true };
}
