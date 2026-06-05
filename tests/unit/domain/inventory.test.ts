import { describe, expect, it } from 'vitest';
import {
  applyMovementPenalty,
  compartmentCostForItem,
  summarizeCompartments,
  type CompartmentItem,
} from '@/domain/rules/inventory';

function item(partial: Partial<CompartmentItem>): CompartmentItem {
  return {
    itemsPerCompartment: 1,
    compartmentsPerStack: 1,
    quantity: 1,
    compartmentBonus: 0,
    negligible: false,
    ...partial,
  };
}

describe('inventory — compartmentCostForItem', () => {
  it('18 shurikens (18/comp) = 1 compartimento', () => {
    expect(compartmentCostForItem(item({ itemsPerCompartment: 18, quantity: 18 }))).toBe(1);
  });

  it('20 shurikens = 2 compartimentos (arredonda pra cima)', () => {
    expect(compartmentCostForItem(item({ itemsPerCompartment: 18, quantity: 20 }))).toBe(2);
  });

  it('arma de mão (não-empilhável) = 1 por unidade', () => {
    expect(compartmentCostForItem(item({ quantity: 1 }))).toBe(1);
    expect(compartmentCostForItem(item({ quantity: 2 }))).toBe(2);
  });

  it('item de armazenamento não ocupa (fornece)', () => {
    expect(compartmentCostForItem(item({ compartmentBonus: 4, quantity: 1 }))).toBe(0);
  });

  it('item desprezível não ocupa', () => {
    expect(compartmentCostForItem(item({ negligible: true, quantity: 5 }))).toBe(0);
  });
});

describe('inventory — summarizeCompartments', () => {
  it('Mochila (+4) + 18 shurikens + 1 espada = 2 ocupados, 4 fornecidos, sem penalidade', () => {
    const s = summarizeCompartments([
      item({ compartmentBonus: 4 }), // mochila
      item({ itemsPerCompartment: 18, quantity: 18 }), // 1 comp
      item({ quantity: 1 }), // espada, 1 comp
    ]);
    expect(s.occupied).toBe(2);
    expect(s.provided).toBe(4);
    expect(s.excess).toBe(0);
    expect(s.movementPenalty).toBe(0);
    expect(s.precisionPenalty).toBe(0);
    expect(s.overCapacity).toBe(false);
  });

  it('5 compartimentos ocupados → 2 excedentes → −6m e −2', () => {
    const s = summarizeCompartments([item({ quantity: 5 })]); // 5 armas = 5 comp
    expect(s.occupied).toBe(5);
    expect(s.excess).toBe(2);
    expect(s.movementPenalty).toBe(6);
    expect(s.precisionPenalty).toBe(2);
  });

  it('ocupados acima da capacidade fornecida marca overCapacity', () => {
    const s = summarizeCompartments([
      item({ compartmentBonus: 1 }), // coldre +1
      item({ quantity: 3 }), // 3 comp
    ]);
    expect(s.provided).toBe(1);
    expect(s.occupied).toBe(3);
    expect(s.overCapacity).toBe(true);
  });
});

describe('inventory — applyMovementPenalty', () => {
  it('aplica penalidade respeitando o piso de 10m', () => {
    const s = summarizeCompartments([item({ quantity: 5 })]); // -6m
    expect(applyMovementPenalty(15, s)).toBe(10); // 15-6=9 → piso 10
    expect(applyMovementPenalty(20, s)).toBe(14); // 20-6=14
  });

  it('sem excedente não muda o deslocamento', () => {
    const s = summarizeCompartments([item({ quantity: 2 })]);
    expect(applyMovementPenalty(15, s)).toBe(15);
  });
});
