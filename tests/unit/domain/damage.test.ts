import { describe, expect, it } from 'vitest';
import {
  applyCriticalEffects,
  calculateDamageBreakdown,
  calculateMultiAttackDamage,
  getDamageGrade,
} from '@/domain/rules/damage';

describe('damage — calculateDamageBreakdown', () => {
  it('CC com Tachi (Satsuki, RAW Acuidade NÃO afeta dano)', () => {
    // For=1, weapon=+2, RAW → halfEsp = ⌈1/2⌉ = 1, dda = 2, total = 3
    const breakdown = calculateDamageBreakdown({
      damageType: 'cc',
      attackerForce: 1,
      attackerDexterity: 6,
      attackerEspirito: 3,
      weaponDamage: 2,
    });
    expect(breakdown.components.dda).toBe(2);
    expect(breakdown.components.halfEsp).toBe(1);
    expect(breakdown.components.nivel).toBe(0);
    expect(breakdown.components.outro).toBe(0);
    expect(breakdown.total).toBe(3);
    expect(breakdown.byGrade).toEqual({ grade1: 3, grade2: 6, grade3: 9, grade4: 12 });
  });

  it('CC com Ataque Poderoso soma +1 a outro', () => {
    const breakdown = calculateDamageBreakdown({
      damageType: 'cc',
      attackerForce: 4,
      attackerDexterity: 4,
      attackerEspirito: 3,
      weaponDamage: 2,
      ataquePoderoso: true,
    });
    expect(breakdown.components.outro).toBe(1);
    // halfEsp = ⌈4/2⌉ = 2; total = 2 + 2 + 0 + 1 = 5
    expect(breakdown.total).toBe(5);
  });

  it('CD arremesso usa Destreza', () => {
    const breakdown = calculateDamageBreakdown({
      damageType: 'cd_thrown',
      attackerForce: 1,
      attackerDexterity: 6,
      attackerEspirito: 3,
      weaponDamage: 1,
    });
    // halfEsp = ⌈6/2⌉ = 3; total = 1 + 3 = 4
    expect(breakdown.total).toBe(4);
  });

  it('Canhão (Gekkōken nv 3) = 6 total e 24 no grau 4', () => {
    const breakdown = calculateDamageBreakdown({
      damageType: 'ninpou_canhao',
      attackerForce: 1,
      attackerDexterity: 6,
      attackerEspirito: 3,
      powerLevel: 3,
    });
    expect(breakdown.components.nivel).toBe(6);
    expect(breakdown.total).toBe(6);
    expect(breakdown.byGrade.grade4).toBe(24);
  });

  it('Ninpou padrão: ⌈Esp/2⌉ + nivel + bônus', () => {
    const breakdown = calculateDamageBreakdown({
      damageType: 'ninpou_standard',
      attackerForce: 1,
      attackerDexterity: 1,
      attackerEspirito: 5,
      powerLevel: 2,
      otherBonus: 1,
    });
    // halfEsp ⌈5/2⌉ = 3; nivel=2; outro=1; total = 6
    expect(breakdown.total).toBe(6);
  });

  it('valor negativo bruto é clampado para 0', () => {
    const breakdown = calculateDamageBreakdown({
      damageType: 'cc',
      attackerForce: 0,
      attackerDexterity: 0,
      attackerEspirito: 0,
      weaponDamage: 0,
      otherBonus: -10,
    });
    expect(breakdown.total).toBe(0);
  });

  it('otherBonus + ataquePoderoso somam ambos', () => {
    const breakdown = calculateDamageBreakdown({
      damageType: 'cc',
      attackerForce: 4,
      attackerDexterity: 4,
      attackerEspirito: 3,
      weaponDamage: 0,
      ataquePoderoso: true,
      otherBonus: 2,
    });
    expect(breakdown.components.outro).toBe(3);
  });
});

describe('damage — getDamageGrade', () => {
  it('3 ou menos = falha crítica (grade 0)', () => {
    expect(getDamageGrade(3)).toBe(0);
    expect(getDamageGrade(2)).toBe(0);
  });
  it('4-8 = grau 1', () => {
    expect(getDamageGrade(4)).toBe(1);
    expect(getDamageGrade(8)).toBe(1);
  });
  it('9-11 = grau 2', () => {
    expect(getDamageGrade(9)).toBe(2);
    expect(getDamageGrade(11)).toBe(2);
  });
  it('12-14 = grau 3', () => {
    expect(getDamageGrade(12)).toBe(3);
    expect(getDamageGrade(14)).toBe(3);
  });
  it('15-16 = crítico (grau 4)', () => {
    expect(getDamageGrade(15)).toBe(4);
    expect(getDamageGrade(16)).toBe(4);
  });
  it('range crítico custom: [14, 16]', () => {
    expect(getDamageGrade(14, [14, 16])).toBe(4);
    expect(getDamageGrade(13, [14, 16])).toBe(3);
  });
});

describe('damage — utilities', () => {
  it('calculateMultiAttackDamage divide e arredonda pra cima', () => {
    expect(calculateMultiAttackDamage(5, 2)).toBe(3);
    expect(calculateMultiAttackDamage(6, 2)).toBe(3);
    expect(calculateMultiAttackDamage(7, 3)).toBe(3);
    expect(calculateMultiAttackDamage(8, 3)).toBe(3);
    expect(calculateMultiAttackDamage(9, 3)).toBe(3);
  });

  it('applyCriticalEffects acumula sangrando', () => {
    expect(applyCriticalEffects(0, 1)).toBe(1);
    expect(applyCriticalEffects(2, 3)).toBe(5);
    expect(applyCriticalEffects(0)).toBe(1);
  });
});
