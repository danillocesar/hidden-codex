import { describe, expect, it } from 'vitest';
import {
  canDropInCompartment,
  deriveCompartmentSlots,
  isOverCapacity,
  itemCapacity,
  summarizeOccupancy,
} from '@/domain/rules/compartments';

describe('compartments — deriveCompartmentSlots', () => {
  it('coldre +1 vira 1 slot com nome do item', () => {
    const slots = deriveCompartmentSlots([{ id: 'a', name: 'Coldre', compartmentBonus: 1 }]);
    expect(slots).toEqual([{ id: 'a#0', storageItemId: 'a', index: 0, title: 'Coldre' }]);
  });

  it('mochila +4 vira 4 slots numerados', () => {
    const slots = deriveCompartmentSlots([{ id: 'm', name: 'Mochila', compartmentBonus: 4 }]);
    expect(slots.map((s) => s.id)).toEqual(['m#0', 'm#1', 'm#2', 'm#3']);
    expect(slots.map((s) => s.title)).toEqual(['Mochila #1', 'Mochila #2', 'Mochila #3', 'Mochila #4']);
  });
});

describe('compartments — itemCapacity', () => {
  it('cheia quando sozinho', () => {
    expect(itemCapacity(18, false)).toBe(18);
    expect(itemCapacity(10, false)).toBe(10);
  });
  it('metade (round down) quando compartilhado', () => {
    expect(itemCapacity(18, true)).toBe(9);
    expect(itemCapacity(10, true)).toBe(5);
    expect(itemCapacity(15, true)).toBe(7);
  });
});

describe('compartments — canDropInCompartment', () => {
  const kunai = { id: 'k', mixable: true };
  const shuriken = { id: 's', mixable: true };
  const espada = { id: 'e', mixable: false };

  it('compartimento vazio aceita qualquer item', () => {
    expect(canDropInCompartment(espada, [])).toEqual({ ok: true });
  });

  it('dois mescláveis podem dividir (kunai + shuriken)', () => {
    expect(canDropInCompartment(shuriken, [kunai])).toEqual({ ok: true });
  });

  it('não mescla com item não-mesclável', () => {
    expect(canDropInCompartment(kunai, [espada]).ok).toBe(false);
    expect(canDropInCompartment(espada, [kunai]).ok).toBe(false);
  });

  it('compartimento com 2 itens está cheio', () => {
    expect(canDropInCompartment({ id: 'x', mixable: true }, [kunai, shuriken]).ok).toBe(false);
  });

  it('reordenar o mesmo item é permitido', () => {
    expect(canDropInCompartment(kunai, [kunai]).ok).toBe(true);
  });
});

describe('compartments — isOverCapacity', () => {
  it('18 shurikens sozinho cabe (≤18)', () => {
    expect(isOverCapacity(18, 18, false)).toBe(false);
    expect(isOverCapacity(18, 19, false)).toBe(true);
  });
  it('mesclado: 9 shurikens cabe, 10 estoura', () => {
    expect(isOverCapacity(18, 9, true)).toBe(false);
    expect(isOverCapacity(18, 10, true)).toBe(true);
  });
});

describe('compartments — summarizeOccupancy', () => {
  it('2 preenchidos + 1 arma solta = 3 ocupados, sem penalidade', () => {
    const s = summarizeOccupancy({ provided: 4, filledSlots: 2, looseOccupying: 1 });
    expect(s.occupied).toBe(3);
    expect(s.excess).toBe(0);
    expect(s.movementPenalty).toBe(0);
  });

  it('5 ocupados → 2 excedentes → −6m e −2', () => {
    const s = summarizeOccupancy({ provided: 5, filledSlots: 3, looseOccupying: 2 });
    expect(s.occupied).toBe(5);
    expect(s.excess).toBe(2);
    expect(s.movementPenalty).toBe(6);
    expect(s.precisionPenalty).toBe(2);
  });
});
