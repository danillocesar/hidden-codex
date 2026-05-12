import { describe, expect, it } from 'vitest';
import { validateFullCharacter } from '@/domain/rules/validation';
import { satsukiNc6 } from './fixtures/satsuki-nc6';
import type { CharacterCore } from '@/domain/types';

describe('validation — validateFullCharacter (Satsuki NC 6 caso real)', () => {
  it('Satsuki passa em todas as validações', () => {
    const report = validateFullCharacter(satsukiNc6);
    if (!report.ok) {
      // logs útil em caso de fixture mudar
      console.error('validate errors:', report.errors);
    }
    expect(report.ok).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('detecta For acima do max', () => {
    const bad: CharacterCore = {
      ...satsukiNc6,
      attributes: { ...satsukiNc6.attributes, for: 99 },
    };
    const report = validateFullCharacter(bad);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.category === 'attributes')).toBe(true);
  });

  it('detecta bases de combate inválidas', () => {
    const bad: CharacterCore = {
      ...satsukiNc6,
      bases: { cc: 9, cd: 1, esq: 1, lm: 1 }, // soma 12 mas remanej > 2
    };
    const report = validateFullCharacter(bad);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.category === 'combat')).toBe(true);
  });

  it('detecta perícia acima do limite', () => {
    const bad: CharacterCore = {
      ...satsukiNc6,
      pericias: { acrobacia: 99 },
    };
    const report = validateFullCharacter(bad);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.category === 'pericias')).toBe(true);
  });

  it('detecta poder acima do limite NC', () => {
    const bad: CharacterCore = {
      ...satsukiNc6,
      powers: [{ code: 'hyouton', level: 99 }],
    };
    const report = validateFullCharacter(bad);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.category === 'powers')).toBe(true);
  });

  it('detecta Carisma acima do limite', () => {
    const bad: CharacterCore = { ...satsukiNc6, socialCarisma: 99 };
    const report = validateFullCharacter(bad);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.category === 'socials')).toBe(true);
  });

  it('detecta vitalidade atual > máxima', () => {
    const bad: CharacterCore = { ...satsukiNc6, currentVitality: 999 };
    const report = validateFullCharacter(bad);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.category === 'energy')).toBe(true);
  });

  it('detecta chakra negativo', () => {
    const bad: CharacterCore = { ...satsukiNc6, currentChakra: -5 };
    const report = validateFullCharacter(bad);
    expect(report.ok).toBe(false);
  });

  it('warning: personagem inconsciente quando vit ≤ 0 e > -11', () => {
    const downed: CharacterCore = { ...satsukiNc6, currentVitality: -5 };
    const report = validateFullCharacter(downed);
    expect(report.warnings.some((w) => /inconsciente/i.test(w.message))).toBe(true);
  });

  it('warning: agonizando entre -11 e -20', () => {
    const dying: CharacterCore = { ...satsukiNc6, currentVitality: -15 };
    const report = validateFullCharacter(dying);
    expect(report.warnings.some((w) => /agonizando/i.test(w.message))).toBe(true);
  });

  it('warning: morto quando ≤ -21', () => {
    const dead: CharacterCore = { ...satsukiNc6, currentVitality: -25 };
    const report = validateFullCharacter(dead);
    expect(report.warnings.some((w) => /morto/i.test(w.message))).toBe(true);
  });

  it('atributo não-inteiro é flagado como inválido', () => {
    const bad: CharacterCore = {
      ...satsukiNc6,
      attributes: { ...satsukiNc6.attributes, for: 1.5 },
    };
    const report = validateFullCharacter(bad);
    expect(report.ok).toBe(false);
  });

  it('Manipulação acima do limite é detectada', () => {
    const bad: CharacterCore = { ...satsukiNc6, socialManipulacao: 99 };
    const report = validateFullCharacter(bad);
    expect(report.errors.some((e) => e.field === 'manipulacao')).toBe(true);
  });

  it('exatamente no limite de vitalidade é OK', () => {
    const exact: CharacterCore = { ...satsukiNc6, currentVitality: 55 };
    const report = validateFullCharacter(exact);
    expect(report.ok).toBe(true);
  });
});
