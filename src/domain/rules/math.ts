/**
 * Helpers de arredondamento do sistema SnS.
 *
 * Spec 04-RULES-ENGINE §"Regra de arredondamento":
 *   - Default: arredondar para CIMA (`roundUp`)
 *   - Exceção: limites de poder, perícia e sociais usam BAIXO (`roundDown`)
 *
 * Esqueça essa regra em uma fórmula e o cálculo de dano/alcance/etc. diverge
 * silenciosamente em casos de divisão ímpar.
 */
export const roundUp = (n: number): number => Math.ceil(n);
export const roundDown = (n: number): number => Math.floor(n);

/** Garante que o valor não ultrapasse [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
