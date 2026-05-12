import { describe, expect, it } from 'vitest';
import {
  calculateCanhaoDamage,
  calculateChakraCost,
  calculateNinpouBaseDamage,
  calculateRange,
} from '@/domain/rules/jutsus';

describe('jutsus — calculateChakraCost', () => {
  it('Canhão Hyouton nv 3: base 1 + perLevel 1 → 4', () => {
    expect(calculateChakraCost({ base: 1, perLevel: 1 }, 3)).toBe(4);
  });

  it('sem perLevel: usa só base', () => {
    expect(calculateChakraCost({ base: 2 }, 5)).toBe(2);
  });

  it('multiplier dobra o custo', () => {
    expect(calculateChakraCost({ base: 1, perLevel: 1 }, 3, { multiplier: 2 })).toBe(8);
  });

  it('additive soma extra', () => {
    expect(calculateChakraCost({ base: 1, perLevel: 1 }, 3, { additive: 2 })).toBe(6);
  });

  it('arredonda fração pra cima', () => {
    // base=1.5, perLevel=0.5, level=1 → 2.0 → 2
    // base=1, perLevel=1, level=1, multiplier=1.5 → 3, arredonda pra cima
    expect(calculateChakraCost({ base: 1, perLevel: 1 }, 1, { multiplier: 1.5 })).toBe(3);
  });

  it('shape vazio retorna 0', () => {
    expect(calculateChakraCost({}, 5)).toBe(0);
  });
});

describe('jutsus — calculateRange', () => {
  it('base 10 + 2×Esp (Esp 3) = 16', () => {
    expect(calculateRange({ base: 10, perEsp: 2 }, 3)).toBe(16);
  });

  it('Esp 0 retorna apenas a base', () => {
    expect(calculateRange({ base: 5, perEsp: 2 }, 0)).toBe(5);
  });

  it('shape vazio = 0', () => {
    expect(calculateRange({}, 5)).toBe(0);
  });
});

describe('jutsus — fórmulas de dano', () => {
  it('Canhão = 2 × nível do poder', () => {
    expect(calculateCanhaoDamage(3)).toBe(6);
    expect(calculateCanhaoDamage(1)).toBe(2);
  });

  it('Ninpou padrão = ⌈Esp/2⌉ + nível usado', () => {
    // Esp 3 → ⌈1.5⌉ = 2; +nível 3 = 5
    expect(calculateNinpouBaseDamage(3, 3)).toBe(5);
    // Esp 4 → 2; +nível 2 = 4
    expect(calculateNinpouBaseDamage(4, 2)).toBe(4);
  });
});
