import { describe, expect, it } from 'vitest';
import {
  findAttributesAboveMax,
  findAttributesBelowMin,
  getAttributeLimits,
  getPericaLimit,
  getPowerLimit,
  getSocialLimit,
} from '@/domain/rules/attributeLimits';

describe('attributeLimits', () => {
  describe('getAttributeLimits', () => {
    it('NC 4: min 0, max 4', () => {
      expect(getAttributeLimits(4)).toEqual({ min: 0, max: 4 });
    });
    it('NC 6 (Satsuki): min 1, max 6', () => {
      expect(getAttributeLimits(6)).toEqual({ min: 1, max: 6 });
    });
    it('NC 12: min 4, max 12', () => {
      expect(getAttributeLimits(12)).toEqual({ min: 4, max: 12 });
    });
  });

  describe('getPowerLimit (round DOWN — exceção da regra)', () => {
    it('NC 4 = 2', () => expect(getPowerLimit(4)).toBe(2));
    it('NC 6 = 3', () => expect(getPowerLimit(6)).toBe(3));
    it('NC 7 = 3 (ímpar arredonda pra baixo)', () => expect(getPowerLimit(7)).toBe(3));
    it('NC 8 = 4', () => expect(getPowerLimit(8)).toBe(4));
    it('NC 20 = 10', () => expect(getPowerLimit(20)).toBe(10));
  });

  it('getPericaLimit segue mesma regra do poder', () => {
    expect(getPericaLimit(6)).toBe(3);
    expect(getPericaLimit(7)).toBe(3);
  });

  it('getSocialLimit segue mesma regra', () => {
    expect(getSocialLimit(6)).toBe(3);
    expect(getSocialLimit(11)).toBe(5);
  });

  describe('findAttributesBelowMin', () => {
    it('detecta atributos abaixo do mínimo NC 7 (min 2)', () => {
      const result = findAttributesBelowMin(
        { for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 },
        7,
      );
      const keys = result.map((r) => r.key);
      expect(keys).toContain('for');
      expect(keys).toContain('int');
      expect(keys).not.toContain('des');
      expect(keys).not.toContain('per');
    });

    it('NC 6: Satsuki (mínimo 1) — todos ok', () => {
      const result = findAttributesBelowMin(
        { for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 },
        6,
      );
      expect(result).toHaveLength(0);
    });
  });

  describe('findAttributesAboveMax', () => {
    it('detecta atributo acima do NC máximo', () => {
      const result = findAttributesAboveMax(
        { for: 1, des: 10, agi: 6, per: 2, int: 1, vig: 5, esp: 3 },
        6,
      );
      expect(result.map((r) => r.key)).toEqual(['des']);
      expect(result[0]?.current).toBe(10);
      expect(result[0]?.max).toBe(6);
    });

    it('NC 20: tudo dentro do limite', () => {
      const result = findAttributesAboveMax(
        { for: 20, des: 20, agi: 20, per: 20, int: 20, vig: 20, esp: 20 },
        20,
      );
      expect(result).toHaveLength(0);
    });
  });
});
