import { describe, expect, it } from 'vitest';
import { getLevelUpDelta, getSocialBonusOnLevelUp, validateLevelUp } from '@/domain/rules/leveling';
import { satsukiNc6 } from './fixtures/satsuki-nc6';
import type { CharacterCore } from '@/domain/types';

describe('leveling — getLevelUpDelta', () => {
  it('NC 6 → NC 7: +6 atr, +4 per, +2 pod', () => {
    const delta = getLevelUpDelta(6, 7);
    expect(delta.attrPointsGained).toBe(6);
    expect(delta.pericaPointsGained).toBe(4);
    expect(delta.powerPointsGained).toBe(2);
    expect(delta.minAttributeDelta).toBe(1);
    expect(delta.rankChanged).toBe(true);
    expect(delta.newRank).toBe('CHUUNIN');
    expect(delta.socialBonus).toBe(2); // NC 7 + min subiu
  });

  it('NC 6 → NC 6: zero deltas', () => {
    const delta = getLevelUpDelta(6, 6);
    expect(delta.attrPointsGained).toBe(0);
    expect(delta.socialBonus).toBe(0);
  });

  it('NC 5 → NC 6: min não muda, socialBonus 0 (e NC < 7)', () => {
    const delta = getLevelUpDelta(5, 6);
    expect(delta.minAttributeDelta).toBe(0);
    expect(delta.socialBonus).toBe(0);
  });

  it('NC 9 → NC 10: rank muda pra JOUNIN_ESPECIAL', () => {
    const delta = getLevelUpDelta(9, 10);
    expect(delta.rankChanged).toBe(true);
    expect(delta.newRank).toBe('JOUNIN_ESPECIAL');
  });

  it('NC ao contrário lança erro', () => {
    expect(() => getLevelUpDelta(8, 5)).toThrow(/não pode diminuir/);
  });
});

describe('leveling — getSocialBonusOnLevelUp', () => {
  it('NC < 7 nunca dá bônus', () => {
    expect(getSocialBonusOnLevelUp(4, 6)).toBe(0);
  });
  it('NC ≥ 7 com aumento de mínimo dá 2', () => {
    expect(getSocialBonusOnLevelUp(6, 7)).toBe(2);
  });
  it('NC ≥ 7 sem aumento de mínimo dá 0', () => {
    // NC 7 → NC 8: min permanece 2
    expect(getSocialBonusOnLevelUp(7, 8)).toBe(0);
  });
});

describe('leveling — validateLevelUp', () => {
  function makeTarget(overrides: Partial<CharacterCore>): CharacterCore {
    return { ...satsukiNc6, ...overrides };
  }

  it('NC 6 → NC 7 com For 1→2, Int 1→2 (cumpre mínimo) é OK', () => {
    const to = makeTarget({
      campaignLevel: 7,
      attributes: { for: 2, des: 6, agi: 6, per: 2, int: 2, vig: 5, esp: 3 },
    });
    const result = validateLevelUp(satsukiNc6, to);
    expect(result.ok).toBe(true);
  });

  it('NC 6 → NC 7 sem subir For/Int mantém mínimos abaixo → erro', () => {
    const to = makeTarget({ campaignLevel: 7 }); // mantém For=1, Int=1 (min NC 7 = 2)
    const result = validateLevelUp(satsukiNc6, to);
    expect(result.ok).toBe(false);
  });

  it('gasta mais atributos do que ganhou → erro', () => {
    const to = makeTarget({
      campaignLevel: 7,
      attributes: { for: 5, des: 7, agi: 6, per: 3, int: 2, vig: 5, esp: 3 },
    });
    const result = validateLevelUp(satsukiNc6, to);
    expect(result.ok).toBe(false);
  });

  it('atributo acima do max NC → erro', () => {
    const to = makeTarget({
      campaignLevel: 7,
      attributes: { for: 2, des: 8, agi: 6, per: 2, int: 2, vig: 5, esp: 3 }, // 8 > 7
    });
    const result = validateLevelUp(satsukiNc6, to);
    expect(result.ok).toBe(false);
  });

  it('diminuir NC: erro', () => {
    const to = makeTarget({ campaignLevel: 5 });
    const result = validateLevelUp(satsukiNc6, to);
    expect(result.ok).toBe(false);
  });

  it('diminuir um atributo individual no level up: erro', () => {
    const to = makeTarget({
      campaignLevel: 7,
      attributes: { for: 2, des: 5, agi: 6, per: 2, int: 2, vig: 5, esp: 3 }, // des caiu
    });
    const result = validateLevelUp(satsukiNc6, to);
    expect(result.ok).toBe(false);
  });

  it('pontos não gastos é tolerado (livro permite acúmulo)', () => {
    // 6 → 7 daria +6 atr, mas só usei +2 (For e Int).
    const to = makeTarget({
      campaignLevel: 7,
      attributes: { for: 2, des: 6, agi: 6, per: 2, int: 2, vig: 5, esp: 3 },
    });
    const result = validateLevelUp(satsukiNc6, to);
    expect(result.ok).toBe(true);
  });
});
