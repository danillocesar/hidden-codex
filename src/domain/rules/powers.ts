import type { CharacterAptitudeRef, CharacterPowerRef, ValidationResult } from '../types';
import { getPowerLimit } from './attributeLimits';
import { getPowerBudget } from './pointsBudget';

export const APTITUDE_COST = 2 as const;

/**
 * Numero de aptidoes gratuitas concedidas na CRIACAO do personagem (alem das
 * de origem/cla/KG). As N primeiras aptidoes "pagas" entram sem custar pontos.
 * Fonte: Livro Basico (regra de criacao).
 */
export const FREE_STARTING_APTITUDES = 3 as const;

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

/**
 * Custo de aptidoes em pontos.
 *
 * `freeStartingCount` desconta as N primeiras aptidoes "pagas" (sem origem).
 * Default 0 mantem o comportamento antigo (level up, fichas pos-criacao).
 * Na CRIACAO o wizard passa `FREE_STARTING_APTITUDES` (3).
 */
export function calculateAptitudeCost(
  aptitudes: ReadonlyArray<CharacterAptitudeRef>,
  freeStartingCount: number = 0,
): number {
  const paid = aptitudes.filter((a) => !a.isFreeFromOrigin).length;
  const billable = Math.max(0, paid - Math.max(0, freeStartingCount));
  return billable * APTITUDE_COST;
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
  /**
   * Numero de aptidoes "starter" gratuitas (alem das de origem). Wizard de
   * criacao passa `FREE_STARTING_APTITUDES` (3); level up passa 0 (default).
   */
  freeStartingAptitudes?: number;
}): ValidationResult {
  const {
    characterPowers,
    aptitudes,
    freeLevelsByPower,
    nc,
    freeStartingAptitudes = 0,
  } = args;
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
  const aptidaoCost = calculateAptitudeCost(aptitudes, freeStartingAptitudes);
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
