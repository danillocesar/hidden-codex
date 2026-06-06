import { describe, expect, it } from 'vitest';
import {
  validateStepById,
  type WizardStepId,
} from '@/app/(app)/characters/new/wizardValidation';
import type { WizardState } from '@/app/(app)/characters/new/wizardState';
import type { WizardCatalogs } from '@/server/queries/wizardCatalogs';

const CATALOGS = {} as WizardCatalogs;

/**
 * WizardState minimo no NC 7 (min de atributo = 2, budget de atributo = 30,
 * budget de pericia = 20). Atributos somam 14 (todos no min) → bem abaixo do
 * budget; pericias vazias. Serve pra exercitar o under-spend.
 */
function baseState(): WizardState {
  return {
    step: 0,
    identity: {
      name: 'Teste',
      age: null,
      gender: null,
      campaignLevel: 7,
      villageCode: null,
      customVillageName: null,
      clanCode: null,
      customClanName: null,
      kekkeiGenkaiCode: null,
      portraitUrl: null,
    },
    attributes: { for: 2, des: 2, agi: 2, per: 2, int: 2, vig: 2, esp: 2 },
    bases: { cc: 3, cd: 3, esq: 3, lm: 3 },
    pericias: {},
    powers: [],
    effectsByPower: {},
    aptitudes: [],
    inventory: [],
  };
}

const validate = (id: WizardStepId, state: WizardState, allowBanking: boolean) =>
  validateStepById(id, state, CATALOGS, allowBanking);

describe('validateStepById — banking (level-up/edit)', () => {
  it('atributos sub-gastos BLOQUEIAM na criacao (allowBanking=false)', () => {
    const result = validate('attributes', baseState(), false);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('Distribua todos os pontos'))).toBe(true);
  });

  it('atributos sub-gastos sao OK com banking (level-up/edit)', () => {
    const result = validate('attributes', baseState(), true);
    expect(result.isValid).toBe(true);
  });

  it('atributos acima do max ainda bloqueiam mesmo com banking', () => {
    const state = baseState();
    state.attributes.for = 8; // max no NC 7 e 7
    expect(validate('attributes', state, true).isValid).toBe(false);
  });

  it('atributos abaixo do min ainda bloqueiam mesmo com banking', () => {
    const state = baseState();
    state.attributes.for = 1; // min no NC 7 e 2
    expect(validate('attributes', state, true).isValid).toBe(false);
  });

  it('estourar o budget de atributos bloqueia mesmo com banking', () => {
    const state = baseState();
    // 7 atributos no max (7) = 49 > budget 30.
    state.attributes = { for: 7, des: 7, agi: 7, per: 7, int: 7, vig: 7, esp: 7 };
    expect(validate('attributes', state, true).isValid).toBe(false);
  });

  it('pericias sub-gastas bloqueiam na criacao mas passam com banking', () => {
    expect(validate('pericias', baseState(), false).isValid).toBe(false);
    expect(validate('pericias', baseState(), true).isValid).toBe(true);
  });
});
