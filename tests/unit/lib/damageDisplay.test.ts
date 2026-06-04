import { describe, expect, it } from 'vitest';
import { calculateDamageBreakdown } from '@/domain/rules/damage';
import { halveBreakdown, withTotal } from '@/lib/character/damageDisplay';

describe('damageDisplay', () => {
  it('withTotal reescala total e recomputa os graus', () => {
    const base = calculateDamageBreakdown({
      damageType: 'ninpou_canhao',
      attackerForce: 1,
      attackerDexterity: 1,
      attackerEspirito: 3,
      powerLevel: 3,
    });
    // base total = 6
    const scaled = withTotal(base, 2);
    expect(scaled.total).toBe(2);
    expect(scaled.byGrade).toEqual({ grade1: 2, grade2: 4, grade3: 6, grade4: 8 });
  });

  it('withTotal nunca fica negativo', () => {
    const base = calculateDamageBreakdown({
      damageType: 'cc',
      attackerForce: 0,
      attackerDexterity: 0,
      attackerEspirito: 0,
      weaponDamage: 0,
    });
    expect(withTotal(base, -5).total).toBe(0);
  });

  it('halveBreakdown divide o dano pela metade arredondando pra CIMA (Canhão sem chakra)', () => {
    // Canhão nv 3 = 6 → metade = 3
    const six = calculateDamageBreakdown({
      damageType: 'ninpou_canhao',
      attackerForce: 1,
      attackerDexterity: 1,
      attackerEspirito: 3,
      powerLevel: 3,
    });
    expect(halveBreakdown(six).total).toBe(3);

    // Canhão nv 2 = 4 → metade = 2
    const four = calculateDamageBreakdown({
      damageType: 'ninpou_canhao',
      attackerForce: 1,
      attackerDexterity: 1,
      attackerEspirito: 3,
      powerLevel: 2,
    });
    expect(halveBreakdown(four).total).toBe(2);

    // total ímpar (5) → ⌈5/2⌉ = 3 (round up, RAW)
    const five = calculateDamageBreakdown({
      damageType: 'ninpou_standard',
      attackerForce: 1,
      attackerDexterity: 1,
      attackerEspirito: 5,
      powerLevel: 2,
      otherBonus: 0,
    });
    // ⌈5/2⌉=3 + nivel 2 = 5
    expect(five.total).toBe(5);
    expect(halveBreakdown(five).total).toBe(3);
  });
});
