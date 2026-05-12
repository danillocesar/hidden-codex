import type { AttributeKey, Attributes } from '../types';
import { ATTRIBUTE_KEYS } from '../types';
import { roundDown } from './math';
import { getLevelRow } from './pointsBudget';

export type AttributeLimits = { min: number; max: number };

/**
 * Limites de atributo (min e max) para um dado NC.
 *
 * - **Mínimo** vem da tabela de evolução (`minAttribute`).
 * - **Máximo** = NC. Personagem NC 6 não pode ter atributo > 6.
 */
export function getAttributeLimits(nc: number): AttributeLimits {
  const row = getLevelRow(nc);
  return { min: row.minAttribute, max: nc };
}

/**
 * Limite de nível de poder = ⌊NC/2⌋ (arredonda pra BAIXO — exceção da regra).
 */
export function getPowerLimit(nc: number): number {
  return roundDown(nc / 2);
}

/** Limite de pontos por perícia individual. Mesma regra do poder. */
export function getPericaLimit(nc: number): number {
  return roundDown(nc / 2);
}

/** Limite de Carisma e Manipulação. Mesma regra. */
export function getSocialLimit(nc: number): number {
  return roundDown(nc / 2);
}

/** Atributos abaixo do mínimo do NC — usado para forçar gasto em level up. */
export function findAttributesBelowMin(
  attributes: Attributes,
  nc: number,
): ReadonlyArray<{ key: AttributeKey; current: number; required: number }> {
  const { min } = getAttributeLimits(nc);
  const below: { key: AttributeKey; current: number; required: number }[] = [];
  for (const key of ATTRIBUTE_KEYS) {
    const value = attributes[key];
    if (value < min) {
      below.push({ key, current: value, required: min });
    }
  }
  return below;
}

/** Atributos acima do máximo permitido. */
export function findAttributesAboveMax(
  attributes: Attributes,
  nc: number,
): ReadonlyArray<{ key: AttributeKey; current: number; max: number }> {
  const { max } = getAttributeLimits(nc);
  const above: { key: AttributeKey; current: number; max: number }[] = [];
  for (const key of ATTRIBUTE_KEYS) {
    const value = attributes[key];
    if (value > max) {
      above.push({ key, current: value, max });
    }
  }
  return above;
}
