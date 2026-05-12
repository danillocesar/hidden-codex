import { describe, expect, it } from 'vitest';
import { checkAptitudePrerequisites } from '@/domain/rules/aptitudes';
import { satsukiNc6 } from './fixtures/satsuki-nc6';

describe('aptitudes — checkAptitudePrerequisites', () => {
  it('Satsuki cumpre Acuidade (Des 3)', () => {
    const result = checkAptitudePrerequisites({ attributes: { des: 3 } }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('Satsuki NÃO cumpre Força 3 (For=1)', () => {
    const result = checkAptitudePrerequisites({ attributes: { for: 3 } }, satsukiNc6);
    expect(result.allMet).toBe(false);
    expect(result.checks[0]?.met).toBe(false);
  });

  it('Ambidestria requer CC 12 — Satsuki tem CC base 11 (sem arma), falha', () => {
    // calculateCC default sem arma usa Acuidade leve = des(6) + base(5) = 11
    const result = checkAptitudePrerequisites({ combatSkills: { cc: 12 } }, satsukiNc6);
    expect(result.allMet).toBe(false);
  });

  it('CC 11 é cumprido', () => {
    const result = checkAptitudePrerequisites({ combatSkills: { cc: 11 } }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('pré-req de perícia: Acrobacia 5 (Satsuki tem 5)', () => {
    const result = checkAptitudePrerequisites({ pericias: { acrobacia: 5 } }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('pré-req de perícia inexistente no PJ retorna 0 → falha', () => {
    const result = checkAptitudePrerequisites({ pericias: { curar: 3 } }, satsukiNc6);
    expect(result.allMet).toBe(false);
  });

  it('pré-req de poder: hyouton 3 (Satsuki tem)', () => {
    const result = checkAptitudePrerequisites({ powers: { hyouton: 3 } }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('pré-req de outra aptidão: tem ataque_poderoso', () => {
    const result = checkAptitudePrerequisites(
      { aptitudes: ['ataque_poderoso'] },
      satsukiNc6,
    );
    expect(result.allMet).toBe(true);
  });

  it('pré-req kekkei genkai bate', () => {
    const result = checkAptitudePrerequisites({ kekkeiGenkai: ['hyouton'] }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('pré-req clã bate', () => {
    const result = checkAptitudePrerequisites({ clans: ['yuki'] }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('combinação OK retorna allMet true e checks separados', () => {
    const result = checkAptitudePrerequisites(
      { attributes: { des: 3 }, powers: { hyouton: 1 } },
      satsukiNc6,
    );
    expect(result.allMet).toBe(true);
    expect(result.checks).toHaveLength(2);
  });

  it('combinação parcial: pelo menos 1 falha → allMet false', () => {
    const result = checkAptitudePrerequisites(
      { attributes: { des: 3, for: 5 } }, // Força 5 falha (For=1)
      satsukiNc6,
    );
    expect(result.allMet).toBe(false);
    expect(result.checks.filter((c) => c.met)).toHaveLength(1);
    expect(result.checks.filter((c) => !c.met)).toHaveLength(1);
  });

  it('prereq vazio é trivialmente met', () => {
    const result = checkAptitudePrerequisites({}, satsukiNc6);
    expect(result.allMet).toBe(true);
    expect(result.checks).toHaveLength(0);
  });

  it('código de perícia desconhecido tratado como nível 0', () => {
    const result = checkAptitudePrerequisites({ pericias: { xpto: 1 } }, satsukiNc6);
    expect(result.allMet).toBe(false);
  });
});
