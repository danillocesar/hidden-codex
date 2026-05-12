import { describe, expect, it } from 'vitest';
import { heal, restoreChakra, spendChakra, takeDamage } from '@/domain/rules/combat';

describe('combat — spendChakra', () => {
  it('gasto normal', () => {
    const result = spendChakra(19, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.newChakra).toBe(16);
      expect(result.exhausted).toBe(false);
    }
  });

  it('gasto exato esgota', () => {
    const result = spendChakra(3, 3);
    if (result.ok) {
      expect(result.newChakra).toBe(0);
      expect(result.exhausted).toBe(true);
    }
  });

  it('chakra insuficiente devolve erro', () => {
    const result = spendChakra(2, 5);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/insuficiente/);
  });

  it('custo negativo rejeitado', () => {
    const result = spendChakra(10, -1);
    expect(result.ok).toBe(false);
  });

  it('custo zero é permitido', () => {
    const result = spendChakra(5, 0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.newChakra).toBe(5);
  });
});

describe('combat — takeDamage status thresholds', () => {
  it('vit > 0 = normal', () => {
    expect(takeDamage(55, 30).status).toBe('normal');
  });
  it('vit 0 = fora de combate', () => {
    expect(takeDamage(5, 5).status).toBe('outOfCombat');
  });
  it('vit -1 a -10 = inconsciente', () => {
    expect(takeDamage(5, 10).status).toBe('unconscious');
    expect(takeDamage(5, 15).status).toBe('unconscious');
  });
  it('vit -11 a -20 = agonizando', () => {
    expect(takeDamage(5, 16).status).toBe('dying');
    expect(takeDamage(5, 25).status).toBe('dying');
  });
  it('vit ≤ -21 = morto', () => {
    expect(takeDamage(5, 26).status).toBe('dead');
    expect(takeDamage(5, 100).status).toBe('dead');
  });

  it('bleeding setado em crítico', () => {
    expect(takeDamage(50, 10, true).bleeding).toBe(true);
    expect(takeDamage(50, 10).bleeding).toBe(false);
  });

  it('dano negativo é tratado como no-op', () => {
    const result = takeDamage(50, -5);
    expect(result.newVitality).toBe(50);
  });
});

describe('combat — heal', () => {
  it('cura mas respeita o máximo', () => {
    expect(heal(40, 55, 20)).toBe(55);
    expect(heal(40, 55, 5)).toBe(45);
  });
  it('cura negativa é tratada como 0', () => {
    expect(heal(40, 55, -10)).toBe(40);
  });
});

describe('combat — restoreChakra', () => {
  it('restaura mas respeita o máximo', () => {
    expect(restoreChakra(10, 19, 5)).toBe(15);
    expect(restoreChakra(15, 19, 10)).toBe(19);
  });
  it('valor negativo é tratado como 0', () => {
    expect(restoreChakra(10, 19, -5)).toBe(10);
  });
});
