import type { CharacterCore } from '../types';
import { ATTRIBUTE_KEYS } from '../types';
import { findAttributesAboveMax, findAttributesBelowMin } from './attributeLimits';
import { validateCombatBases } from './combatBases';
import { calculateMaxChakra, calculateMaxVitality } from './derivedStats';
import { getFreePowerLevelsFromOrigin } from './helpers';
import { validatePericiaBudget } from './skills';
import { validatePowersAndAptitudes } from './powers';
import { getSocialLimit } from './attributeLimits';

export type ValidationCategory =
  | 'attributes'
  | 'pericias'
  | 'powers'
  | 'aptitudes'
  | 'combat'
  | 'energy'
  | 'socials';

export type ValidationError = {
  category: ValidationCategory;
  field?: string;
  message: string;
};

export type ValidationWarning = {
  category: ValidationCategory;
  message: string;
};

export type FichaValidationReport = {
  ok: boolean;
  errors: ReadonlyArray<ValidationError>;
  warnings: ReadonlyArray<ValidationWarning>;
};

/**
 * Validação completa de uma ficha. Agrega todos os módulos de regra e produz
 * um relatório consumível pela UI (badges, banners, modais).
 */
export function validateFullCharacter(character: CharacterCore): FichaValidationReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Atributos
  const below = findAttributesBelowMin(character.attributes, character.campaignLevel);
  for (const b of below) {
    errors.push({
      category: 'attributes',
      field: b.key,
      message: `${b.key.toUpperCase()} abaixo do mínimo (${b.current}/${b.required}).`,
    });
  }
  const above = findAttributesAboveMax(character.attributes, character.campaignLevel);
  for (const a of above) {
    errors.push({
      category: 'attributes',
      field: a.key,
      message: `${a.key.toUpperCase()} acima do máximo (${a.current}/${a.max}).`,
    });
  }
  for (const key of ATTRIBUTE_KEYS) {
    const value = character.attributes[key];
    if (!Number.isInteger(value) || value < 0) {
      errors.push({
        category: 'attributes',
        field: key,
        message: `${key.toUpperCase()} inválido: ${value}.`,
      });
    }
  }

  // 2. Bases de combate
  const baseRes = validateCombatBases(character.bases);
  if (!baseRes.ok) {
    errors.push({ category: 'combat', message: baseRes.error });
  }

  // 3. Perícias
  const pericRes = validatePericiaBudget(character.pericias, character.campaignLevel);
  if (!pericRes.ok) {
    errors.push({ category: 'pericias', message: pericRes.error });
  }

  // 4. Poderes + aptidões
  const freeLevels = getFreePowerLevelsFromOrigin(character);
  const powerRes = validatePowersAndAptitudes({
    characterPowers: character.powers,
    aptitudes: character.aptitudes,
    freeLevelsByPower: freeLevels,
    nc: character.campaignLevel,
  });
  if (!powerRes.ok) {
    errors.push({ category: 'powers', message: powerRes.error });
  }

  // 5. Sociais
  const socialLimit = getSocialLimit(character.campaignLevel);
  if (character.socialCarisma > socialLimit) {
    errors.push({
      category: 'socials',
      field: 'carisma',
      message: `Carisma excede limite (${character.socialCarisma}/${socialLimit}).`,
    });
  }
  if (character.socialManipulacao > socialLimit) {
    errors.push({
      category: 'socials',
      field: 'manipulacao',
      message: `Manipulação excede limite (${character.socialManipulacao}/${socialLimit}).`,
    });
  }

  // 6. Energias correntes vs máximas
  const maxVit = calculateMaxVitality(character.attributes.vig, character.campaignLevel);
  const maxChk = calculateMaxChakra(character.attributes.esp);
  if (character.currentVitality > maxVit) {
    errors.push({
      category: 'energy',
      field: 'vitality',
      message: `Vitalidade atual > máxima (${character.currentVitality}/${maxVit}).`,
    });
  }
  if (character.currentChakra > maxChk) {
    errors.push({
      category: 'energy',
      field: 'chakra',
      message: `Chakra atual > máximo (${character.currentChakra}/${maxChk}).`,
    });
  }
  if (character.currentChakra < 0) {
    errors.push({
      category: 'energy',
      field: 'chakra',
      message: 'Chakra atual não pode ser negativo.',
    });
  }

  // Warnings: status de saúde
  if (character.currentVitality <= 0 && character.currentVitality > -11) {
    warnings.push({
      category: 'energy',
      message: 'Personagem está fora de combate / inconsciente.',
    });
  }
  if (character.currentVitality <= -11 && character.currentVitality > -21) {
    warnings.push({ category: 'energy', message: 'Personagem está agonizando.' });
  }
  if (character.currentVitality <= -21) {
    warnings.push({ category: 'energy', message: 'Personagem está morto.' });
  }

  return { ok: errors.length === 0, errors, warnings };
}
