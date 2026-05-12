import { describe, expect, it } from 'vitest';
import { clamp, roundDown, roundUp } from '@/domain/rules/math';

describe('math helpers', () => {
  describe('roundUp', () => {
    it('arredonda fração positiva pra cima', () => {
      expect(roundUp(3.1)).toBe(4);
      expect(roundUp(3.5)).toBe(4);
      expect(roundUp(3.9)).toBe(4);
    });
    it('mantém inteiros', () => {
      expect(roundUp(5)).toBe(5);
      expect(roundUp(0)).toBe(0);
    });
    it('arredonda negativos em direção ao zero', () => {
      // Math.ceil(-3.5) === -3
      expect(roundUp(-3.5)).toBe(-3);
    });
  });

  describe('roundDown', () => {
    it('arredonda fração pra baixo', () => {
      expect(roundDown(3.9)).toBe(3);
      expect(roundDown(3.1)).toBe(3);
      expect(roundDown(2.5)).toBe(2);
    });
    it('NC 7 / 2 = 3 (limite de poder NC 7)', () => {
      expect(roundDown(7 / 2)).toBe(3);
    });
  });

  describe('clamp', () => {
    it('mantém valores dentro do range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it('clampa abaixo do mínimo', () => {
      expect(clamp(-3, 0, 10)).toBe(0);
    });
    it('clampa acima do máximo', () => {
      expect(clamp(99, 0, 10)).toBe(10);
    });
    it('clampa em bordas exatas', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });
});
