import { describe, expect, it } from 'vitest';
import {
  getAttrBudget,
  getLevelRow,
  getPericaBudget,
  getPowerBudget,
} from '@/domain/rules/pointsBudget';

describe('pointsBudget — tabela de evolução', () => {
  it('rejeita NC abaixo do mínimo', () => {
    expect(() => getLevelRow(3)).toThrow(/mínimo é 4/);
    expect(() => getLevelRow(0)).toThrow();
    expect(() => getLevelRow(-1)).toThrow();
  });

  it('rejeita NC não-inteiro', () => {
    expect(() => getLevelRow(5.5)).toThrow(/inválido/);
    expect(() => getLevelRow(NaN)).toThrow();
  });

  it('NC 4 = Genin, 12 atributos, 8 perícias, 4 poder', () => {
    const row = getLevelRow(4);
    expect(row.shinobiRank).toBe('GENIN');
    expect(row.attrPoints).toBe(12);
    expect(row.pericaPoints).toBe(8);
    expect(row.powerPoints).toBe(4);
    expect(row.minAttribute).toBe(0);
  });

  it('NC 6 (Satsuki) = 24 atr, 16 per, 8 pod, min 1', () => {
    const row = getLevelRow(6);
    expect(row.attrPoints).toBe(24);
    expect(row.pericaPoints).toBe(16);
    expect(row.powerPoints).toBe(8);
    expect(row.minAttribute).toBe(1);
  });

  it('NC 12 = Jounin', () => {
    expect(getLevelRow(12).shinobiRank).toBe('JOUNIN');
    expect(getLevelRow(12).attrPoints).toBe(60);
  });

  it('NC 20 = max da tabela', () => {
    const row = getLevelRow(20);
    expect(row.attrPoints).toBe(108);
    expect(row.pericaPoints).toBe(72);
    expect(row.powerPoints).toBe(40);
    expect(row.shinobiRank).toBe('SANNIN_KAGE');
  });

  it('NC 21 extrapola: +6 atr / +4 per / +2 pod sobre NC 20', () => {
    const row = getLevelRow(21);
    expect(row.attrPoints).toBe(114); // 108 + 6
    expect(row.pericaPoints).toBe(76); // 72 + 4
    expect(row.powerPoints).toBe(42); // 40 + 2
    expect(row.shinobiRank).toBe('SANNIN_KAGE');
  });

  it('NC 25 extrapola continuamente', () => {
    const row = getLevelRow(25);
    expect(row.attrPoints).toBe(108 + 5 * 6);
    expect(row.pericaPoints).toBe(72 + 5 * 4);
    expect(row.powerPoints).toBe(40 + 5 * 2);
    // minAttribute teto = 20
    expect(row.minAttribute).toBeLessThanOrEqual(20);
  });

  it('NC extremo (100) não estoura teto de minAttribute', () => {
    const row = getLevelRow(100);
    expect(row.minAttribute).toBeLessThanOrEqual(20);
  });

  it('atalhos retornam mesmos valores que getLevelRow', () => {
    expect(getAttrBudget(7)).toBe(getLevelRow(7).attrPoints);
    expect(getPericaBudget(7)).toBe(getLevelRow(7).pericaPoints);
    expect(getPowerBudget(7)).toBe(getLevelRow(7).powerPoints);
  });
});
