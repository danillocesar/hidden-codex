import { describe, it, expect } from 'vitest';
import { getStartingRyos, STARTING_RYOS_BY_RANK } from '@/domain/rules/money';

describe('getStartingRyos', () => {
  it('Genin (NC 4-6) recebe 100 Ryos', () => {
    expect(getStartingRyos(4)).toBe(100);
    expect(getStartingRyos(5)).toBe(100);
    expect(getStartingRyos(6)).toBe(100);
  });

  it('Chuunin (NC 7-9) recebe 1.000 Ryos', () => {
    expect(getStartingRyos(7)).toBe(1_000);
    expect(getStartingRyos(9)).toBe(1_000);
  });

  it('Jounin Especial (NC 10-11) recebe 5.000 Ryos', () => {
    expect(getStartingRyos(10)).toBe(5_000);
    expect(getStartingRyos(11)).toBe(5_000);
  });

  it('Jounin (NC 12-14) recebe 13.000 Ryos', () => {
    expect(getStartingRyos(12)).toBe(13_000);
    expect(getStartingRyos(14)).toBe(13_000);
  });

  it('Jounin de Elite (NC 15-17) recebe 36.000 Ryos', () => {
    expect(getStartingRyos(15)).toBe(36_000);
    expect(getStartingRyos(17)).toBe(36_000);
  });

  it('Sannin/Kage (NC 18-20) recebe 88.000 Ryos', () => {
    expect(getStartingRyos(18)).toBe(88_000);
    expect(getStartingRyos(20)).toBe(88_000);
  });

  it('extrapola acima de NC 20 como Sannin/Kage', () => {
    expect(getStartingRyos(25)).toBe(88_000);
  });

  it('o mapa cobre todos os postos com valores positivos', () => {
    for (const value of Object.values(STARTING_RYOS_BY_RANK)) {
      expect(value).toBeGreaterThan(0);
    }
  });
});
