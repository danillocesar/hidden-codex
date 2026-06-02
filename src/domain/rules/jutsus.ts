import { roundUp } from './math';

export type ChakraCostShape = {
  base?: number;
  perLevel?: number;
};

export type RangeShape = {
  base?: number;
  perEsp?: number;
};

/**
 * Custo de chakra de um efeito de poder.
 *
 * Cada efeito tem `chakraCost: { base, perLevel }` no seu JSONB. Modificadores
 * opcionais permitem multiplicar (área expandida) ou somar custo extra
 * (técnicas combinadas). Resultado sempre arredondado pra cima.
 */
export function calculateChakraCost(
  shape: ChakraCostShape,
  levelUsed: number,
  modifiers?: { multiplier?: number; additive?: number },
): number {
  const base = shape.base ?? 0;
  const perLevel = shape.perLevel ?? 0;
  let cost = base + perLevel * levelUsed;
  if (modifiers?.multiplier != null) cost *= modifiers.multiplier;
  if (modifiers?.additive != null) cost += modifiers.additive;
  return roundUp(cost);
}

/**
 * Alcance de um efeito: base + perEsp × Espírito. Em metros.
 */
export function calculateRange(shape: RangeShape, espirito: number): number {
  const base = shape.base ?? 0;
  const perEsp = shape.perEsp ?? 0;
  return base + perEsp * espirito;
}

/**
 * Dano padrão de Ninpou: ⌈Esp/2⌉ + nível usado do poder.
 */
export function calculateNinpouBaseDamage(espirito: number, powerLevelUsed: number): number {
  return roundUp(espirito / 2) + powerLevelUsed;
}

/**
 * Dano de Canhão: 2 × nível do poder. Substitui a fórmula padrão.
 */
export function calculateCanhaoDamage(powerLevel: number): number {
  return 2 * powerLevel;
}

// ── "Comum do poder" ────────────────────────────────────────────────────────
// Valores-padrão de um poder, escalando com Espírito (e nível usado). Fonte:
// Livro Básico (tabela base dos poderes). Dano/Dureza base = nível + ⌈Esp/2⌉,
// já coberto por `calculateNinpouBaseDamage`.

/** Alcance "comum do poder" (Médio): 10m + 2m por nível de Espírito. */
export function commonPowerRange(espirito: number): number {
  return 10 + 2 * espirito;
}

/** Dificuldade dos testes "comum do poder": 9 + nível usado + ⌈Esp/2⌉. */
export function commonPowerDifficulty(espirito: number, powerLevelUsed: number): number {
  return 9 + calculateNinpouBaseDamage(espirito, powerLevelUsed);
}

/** Tamanho "comum do poder" (Escala Grande): 1m por nível de Espírito. */
export function commonPowerSize(espirito: number): number {
  return espirito;
}
