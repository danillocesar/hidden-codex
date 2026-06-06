/**
 * Valida cada step do wizard de criacao retornando uma lista plana de
 * problemas. Cada step usa motor de regras (validateCombatBases, budgets,
 * limites) — sem duplicar regra de RPG.
 *
 * Saida e consumida pelo WizardClient pra:
 *   - Habilitar/desabilitar botao "Proximo"
 *   - Mostrar lista visivel de pendencias abaixo do step
 *   - Indicar status (ok/erro) no StepProgress
 */

import { ATTRIBUTE_KEYS } from '@/domain/types';
import { getAttributeLimits } from '@/domain/rules/attributeLimits';
import { getAttrBudget } from '@/domain/rules/pointsBudget';
import { validateCombatBases } from '@/domain/rules/combatBases';
import { sumPericiaPoints, validatePericiaBudget } from '@/domain/rules/skills';
import {
  FREE_STARTING_APTITUDES,
  validatePowersAndAptitudes,
} from '@/domain/rules/powers';
import { getPericaBudget } from '@/domain/rules/pointsBudget';
import { validateEffectSelection, type EffectDef } from '@/domain/rules/effects';
import type { CharacterCore } from '@/domain/types';
import {
  applyOriginBenefits,
  getEffectiveFreePowerLevels,
} from '@/lib/character/applyOriginBenefits';
import type {
  WizardCatalogs,
  WizardClanOption,
  WizardKekkeiGenkaiOption,
  WizardVillageOption,
} from '@/server/queries/wizardCatalogs';
import type { WizardState } from './wizardState';

export type WizardIssue = { field?: string; message: string };

export type StepValidation = {
  isValid: boolean;
  issues: ReadonlyArray<WizardIssue>;
};

export type WizardOrigin = {
  clan: WizardClanOption | null;
  kekkeiGenkai: WizardKekkeiGenkaiOption | null;
  village: WizardVillageOption | null;
};

function resolveOrigin(
  state: WizardState,
  catalogs: {
    clans: ReadonlyArray<WizardClanOption>;
    villages: ReadonlyArray<WizardVillageOption>;
    kekkeiGenkais: ReadonlyArray<WizardKekkeiGenkaiOption>;
  },
): WizardOrigin {
  return {
    clan: state.identity.clanCode
      ? catalogs.clans.find((c) => c.code === state.identity.clanCode) ?? null
      : null,
    kekkeiGenkai: state.identity.kekkeiGenkaiCode
      ? catalogs.kekkeiGenkais.find((k) => k.code === state.identity.kekkeiGenkaiCode) ?? null
      : null,
    village: state.identity.villageCode
      ? catalogs.villages.find((v) => v.code === state.identity.villageCode) ?? null
      : null,
  };
}

export function validateIdentity(state: WizardState): StepValidation {
  const issues: WizardIssue[] = [];
  const id = state.identity;
  if (id.name.trim().length === 0) {
    issues.push({ field: 'name', message: 'Nome é obrigatorio.' });
  }
  if (id.villageCode && id.customVillageName) {
    issues.push({
      field: 'customVillageName',
      message: 'Limpe a vila canonica antes de usar custom.',
    });
  }
  if (id.clanCode && id.customClanName) {
    issues.push({
      field: 'customClanName',
      message: 'Limpe o cla canonico antes de usar custom.',
    });
  }
  if (id.campaignLevel < 4) {
    issues.push({ field: 'campaignLevel', message: 'NC minimo e 4.' });
  }
  return { isValid: issues.length === 0, issues };
}

/**
 * `allowBanking`: na criacao o jogador e OBRIGADO a gastar tudo; na edicao e no
 * level-up pode guardar pontos (saldo nao gasto e valido). Quando true, sub-
 * gastar nao bloqueia — so estourar o budget ou violar min/max.
 */
export function validateAttributes(state: WizardState, allowBanking = false): StepValidation {
  const issues: WizardIssue[] = [];
  const nc = state.identity.campaignLevel;
  const { min, max } = getAttributeLimits(nc);
  const budget = getAttrBudget(nc);

  for (const key of ATTRIBUTE_KEYS) {
    const value = state.attributes[key];
    if (value < min) {
      issues.push({ field: key, message: `${key.toUpperCase()} abaixo do minimo (${min}).` });
    }
    if (value > max) {
      issues.push({ field: key, message: `${key.toUpperCase()} acima do maximo (${max}).` });
    }
  }
  const sum = ATTRIBUTE_KEYS.reduce((acc, k) => acc + state.attributes[k], 0);
  if (sum > budget) {
    issues.push({
      message: `Atributos: ${sum}/${budget} pontos totais (estourou).`,
    });
  } else if (sum < budget && !allowBanking) {
    issues.push({
      message: `Distribua todos os pontos: ${sum}/${budget} usados (faltam ${budget - sum}).`,
    });
  }

  const basesCheck = validateCombatBases(state.bases);
  if (!basesCheck.ok) issues.push({ field: 'bases', message: basesCheck.error });

  return { isValid: issues.length === 0, issues };
}

export function validatePericias(state: WizardState, allowBanking = false): StepValidation {
  const result = validatePericiaBudget(state.pericias, state.identity.campaignLevel);
  if (!result.ok) {
    return { isValid: false, issues: [{ message: result.error }] };
  }
  const budget = getPericaBudget(state.identity.campaignLevel);
  const spent = sumPericiaPoints(state.pericias);
  if (spent < budget && !allowBanking) {
    return {
      isValid: false,
      issues: [
        {
          message: `Distribua todos os pontos de pericia: ${spent}/${budget} usados (faltam ${budget - spent}).`,
        },
      ],
    };
  }
  return { isValid: true, issues: [] };
}

function buildFinalAptitudes(
  state: WizardState,
  freeAptitudeCodes: ReadonlyArray<string>,
) {
  const userAptitudes = state.aptitudes.map((a) => ({
    code: a.code,
    parameter: a.parameter ?? undefined,
    isFreeFromOrigin: !a.parameter && freeAptitudeCodes.includes(a.code),
  }));
  const listedCodes = new Set(
    userAptitudes.filter((a) => !a.parameter).map((a) => a.code),
  );
  const granted = freeAptitudeCodes
    .filter((code) => !listedCodes.has(code))
    .map((code) => ({ code, isFreeFromOrigin: true }));
  return [...userAptitudes, ...granted];
}

/**
 * Step Poderes: nao exige gastar TUDO (o saldo pode ser usado em aptidoes
 * no proximo step). So bloqueia se ja estourou.
 */
export function validatePowersStep(
  state: WizardState,
  catalogs: {
    clans: ReadonlyArray<WizardClanOption>;
    villages: ReadonlyArray<WizardVillageOption>;
    kekkeiGenkais: ReadonlyArray<WizardKekkeiGenkaiOption>;
  },
): StepValidation {
  const benefits = applyOriginBenefits(resolveOrigin(state, catalogs));
  const freeLevels = getEffectiveFreePowerLevels(benefits, state.powers);
  const result = validatePowersAndAptitudes({
    characterPowers: state.powers,
    aptitudes: buildFinalAptitudes(state, benefits.freeAptitudeCodes),
    freeLevelsByPower: freeLevels,
    nc: state.identity.campaignLevel,
    freeStartingAptitudes: FREE_STARTING_APTITUDES,
  });
  if (!result.ok) return { isValid: false, issues: [{ message: result.error }] };
  return { isValid: true, issues: [] };
}

/**
 * Step Efeitos — cada poder concede N slots (N = nivel do poder). Bloqueia
 * se algum slot esta vazio (RAW: slots obrigatorios), se ha duplicata, ou
 * se pre-req de algum efeito falha. Reusa `validateEffectSelection` do motor.
 */
export function validateEffectsStep(
  state: WizardState,
  catalogs: WizardCatalogs,
): StepValidation {
  if (state.powers.length === 0) {
    return { isValid: true, issues: [] };
  }
  const benefits = applyOriginBenefits(resolveOrigin(state, catalogs));
  const aptitudes = buildFinalAptitudes(state, benefits.freeAptitudeCodes);
  const character: CharacterCore = {
    campaignLevel: state.identity.campaignLevel,
    attributes: state.attributes,
    bases: state.bases,
    pericias: state.pericias,
    aptitudes,
    powers: state.powers,
    learnedEffects: Object.values(state.effectsByPower).flat(),
    narrativeFlags: [],
    clan: state.identity.clanCode ? { code: state.identity.clanCode } : undefined,
    kekkeiGenkai: benefits.effectiveKekkeiGenkaiCode
      ? { code: benefits.effectiveKekkeiGenkaiCode }
      : undefined,
    currentVitality: 0,
    currentChakra: 0,
    socialCarisma: 0,
    socialManipulacao: 0,
  };
  const catalog: EffectDef[] = catalogs.powerEffects.map((e) => ({
    code: e.code,
    name: e.name,
    minLevel: e.minLevel,
    availableFor: e.availableFor,
    rules: e.rules as EffectDef['rules'],
  }));
  const result = validateEffectSelection({
    characterPowers: state.powers,
    selectedByPower: state.effectsByPower,
    catalog,
    character,
  });
  if (!result.ok) return { isValid: false, issues: [{ message: result.error }] };
  return { isValid: true, issues: [] };
}

/**
 * Step Aptidoes — ultimo step do budget de poder. So bloqueia se estourou
 * o budget combinado (poderes pagos + aptidoes pagas). Saldo nao consumido
 * pode ser deixado pra ser gasto em level-up futuro (decisao do jogador).
 */
export function validateAptitudesStep(
  state: WizardState,
  catalogs: {
    clans: ReadonlyArray<WizardClanOption>;
    villages: ReadonlyArray<WizardVillageOption>;
    kekkeiGenkais: ReadonlyArray<WizardKekkeiGenkaiOption>;
  },
): StepValidation {
  const benefits = applyOriginBenefits(resolveOrigin(state, catalogs));
  const freeLevels = getEffectiveFreePowerLevels(benefits, state.powers);
  const aptitudes = buildFinalAptitudes(state, benefits.freeAptitudeCodes);

  const overflow = validatePowersAndAptitudes({
    characterPowers: state.powers,
    aptitudes,
    freeLevelsByPower: freeLevels,
    nc: state.identity.campaignLevel,
    freeStartingAptitudes: FREE_STARTING_APTITUDES,
  });
  if (!overflow.ok) {
    return { isValid: false, issues: [{ message: overflow.error }] };
  }
  return { isValid: true, issues: [] };
}

export type WizardStepId =
  | 'identity'
  | 'attributes'
  | 'pericias'
  | 'aptitudes'
  | 'powers'
  | 'effects'
  | 'inventory'
  | 'summary';

/**
 * Aggregator: valida um step pelo seu `id` (nao pelo indice). Isso desacopla a
 * validacao da ordem/numero de steps — essencial pros modos que omitem steps
 * (edit sem inventario; level-up sem identidade nem inventario).
 *
 * `allowBanking` propaga pra atributos/pericias (criacao gasta tudo; edit e
 * level-up podem guardar saldo).
 */
export function validateStepById(
  id: WizardStepId,
  state: WizardState,
  catalogs: WizardCatalogs,
  allowBanking = false,
): StepValidation {
  switch (id) {
    case 'identity':
      return validateIdentity(state);
    case 'attributes':
      return validateAttributes(state, allowBanking);
    case 'pericias':
      return validatePericias(state, allowBanking);
    case 'aptitudes':
      return validateAptitudesStep(state, catalogs);
    case 'powers':
      return validatePowersStep(state, catalogs);
    case 'effects':
      return validateEffectsStep(state, catalogs);
    default:
      return { isValid: true, issues: [] };
  }
}
