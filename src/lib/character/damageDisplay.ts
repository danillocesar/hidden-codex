import type { DamageBreakdown } from '@/domain/rules/damage';

/**
 * Helpers de exibição da calculadora de dano — derivam um `DamageBreakdown`
 * ajustado (total reescalado) sem tocar no motor. Usados pelos modais quando
 * uma regra muda o total final (Canhão sem chakra ÷2, Ataque Múltiplo).
 */

/** Reescala o breakdown para um novo total, recomputando os graus (total × grau). */
export function withTotal(breakdown: DamageBreakdown, total: number): DamageBreakdown {
  const t = Math.max(0, total);
  return {
    ...breakdown,
    total: t,
    byGrade: { grade1: t, grade2: t * 2, grade3: t * 3, grade4: t * 4 },
  };
}

/**
 * Canhão usado sem custo de chakra (nível ≥ 2): dano dividido pela metade,
 * arredondado pra cima (RAW round up). Bônus já são desabilitados pelo caller.
 */
export function halveBreakdown(breakdown: DamageBreakdown): DamageBreakdown {
  return withTotal(breakdown, Math.ceil(breakdown.total / 2));
}
