import { describe, expect, it } from 'vitest';
import {
  calculateCanhaoDamage,
  calculateChakraCost,
  calculateNinpouBaseDamage,
  calculateRange,
  commonPowerRange,
  commonPowerDifficulty,
  commonPowerSize,
} from '@/domain/rules/jutsus';

describe('jutsus — comum do poder', () => {
  it('alcance Médio = 10 + 2×Esp (Esp 1 → 12m)', () => {
    expect(commonPowerRange(1)).toBe(12);
    expect(commonPowerRange(3)).toBe(16);
    expect(commonPowerRange(0)).toBe(10);
  });

  it('dificuldade = 9 + nível + ⌈Esp/2⌉', () => {
    // Esp 3, nível 2: 9 + (2 + 2) = 13
    expect(commonPowerDifficulty(3, 2)).toBe(13);
    // Esp 1, nível 1: 9 + (1 + 1) = 11
    expect(commonPowerDifficulty(1, 1)).toBe(11);
  });

  it('tamanho (Escala Grande) = 1m por nível de Espírito', () => {
    expect(commonPowerSize(4)).toBe(4);
  });
});

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
