import { roundUp } from './math';

/**
 * Regras de compartimentos de itens (Livro Básico 4.1b, p.127).
 *
 * - Itens de armazenamento (bolsa, coldre, mochila) **fornecem** compartimentos
 *   (`compartmentBonus`) e não ocupam nenhum.
 * - Demais itens **ocupam** compartimentos: cada compartimento comporta
 *   `itemsPerCompartment` unidades (ex.: 18 shurikens), e um item pode custar
 *   mais de um compartimento por unidade (`compartmentsPerStack`, raro).
 * - Itens desprezíveis (livro, foto…) não contam (decisão do mestre).
 * - Até 3 compartimentos preenchidos sem penalidade. Acima disso: −3m de
 *   deslocamento e −1 de precisão por compartimento excedente (testes de
 *   mobilidade/Força/Agilidade); o deslocamento não cai abaixo de 10m.
 */

export const FREE_COMPARTMENT_LIMIT = 3 as const;
export const MIN_MOVEMENT = 10 as const;

export type CompartmentItem = {
  /** Quantos itens cabem em 1 compartimento (`slots.items`). Default 1 (não-empilhável). */
  itemsPerCompartment: number;
  /** Compartimentos por unidade/stack (`slots.compartments`). Default 1. */
  compartmentsPerStack: number;
  quantity: number;
  /** Item de armazenamento: fornece compartimentos em vez de ocupar. */
  compartmentBonus: number;
  /** Desprezível: não conta nas regras de compartimento. */
  negligible: boolean;
};

export type CompartmentSummary = {
  /** Compartimentos ocupados pelos itens carregados. */
  occupied: number;
  /** Compartimentos fornecidos pelos itens de armazenamento. */
  provided: number;
  /** Limite sem penalidade (3). */
  freeLimit: number;
  /** Compartimentos preenchidos acima do limite. */
  excess: number;
  /** Penalidade de deslocamento (−3m por excedente). */
  movementPenalty: number;
  /** Penalidade de precisão (−1 por excedente). */
  precisionPenalty: number;
  /** Carrega mais do que a capacidade fornecida pelos itens de armazenamento. */
  overCapacity: boolean;
};

/** Compartimentos ocupados por um item (0 se desprezível ou item de armazenamento). */
export function compartmentCostForItem(item: CompartmentItem): number {
  if (item.negligible || item.compartmentBonus > 0) return 0;
  if (item.quantity <= 0) return 0;
  const perCompartment = item.itemsPerCompartment > 0 ? item.itemsPerCompartment : 1;
  const perStack = item.compartmentsPerStack > 0 ? item.compartmentsPerStack : 1;
  return roundUp(item.quantity / perCompartment) * perStack;
}

/** Consolida ocupação, capacidade fornecida e penalidades de uma lista de itens. */
export function summarizeCompartments(
  items: ReadonlyArray<CompartmentItem>,
): CompartmentSummary {
  let occupied = 0;
  let provided = 0;
  for (const item of items) {
    occupied += compartmentCostForItem(item);
    provided += Math.max(0, item.compartmentBonus);
  }
  const excess = Math.max(0, occupied - FREE_COMPARTMENT_LIMIT);
  return {
    occupied,
    provided,
    freeLimit: FREE_COMPARTMENT_LIMIT,
    excess,
    movementPenalty: excess * 3,
    precisionPenalty: excess,
    overCapacity: occupied > provided,
  };
}

/** Deslocamento efetivo após a penalidade de compartimentos (piso de 10m). */
export function applyMovementPenalty(baseMovement: number, summary: CompartmentSummary): number {
  return Math.max(MIN_MOVEMENT, baseMovement - summary.movementPenalty);
}
