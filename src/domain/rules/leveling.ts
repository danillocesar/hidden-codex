import type { AttributeKey, Attributes, CharacterCore, ShinobiRank, ValidationResult } from '../types';
import { ATTRIBUTE_KEYS } from '../types';
import { getLevelRow } from './pointsBudget';
import { findAttributesAboveMax, findAttributesBelowMin } from './attributeLimits';

export type LevelUpDelta = {
  fromNc: number;
  toNc: number;
  attrPointsGained: number;
  pericaPointsGained: number;
  powerPointsGained: number;
  minAttributeDelta: number;
  rankChanged: boolean;
  newRank: ShinobiRank;
  socialBonus: number;
};

/**
 * Calcula a diferença de pontos entre dois NCs (sempre `toNc >= fromNc`).
 *
 * `socialBonus`: a partir de NC 7, sempre que o mínimo de atributo aumenta, o
 * personagem recebe 2 pontos para investir em Carisma OU Manipulação
 * (Livro Básico §"Sociais").
 */
export function getLevelUpDelta(fromNc: number, toNc: number): LevelUpDelta {
  if (toNc < fromNc) {
    throw new Error(`NC não pode diminuir (${fromNc} → ${toNc}).`);
  }
  const from = getLevelRow(fromNc);
  const to = getLevelRow(toNc);
  const minDelta = to.minAttribute - from.minAttribute;

  return {
    fromNc,
    toNc,
    attrPointsGained: to.attrPoints - from.attrPoints,
    pericaPointsGained: to.pericaPoints - from.pericaPoints,
    powerPointsGained: to.powerPoints - from.powerPoints,
    minAttributeDelta: minDelta,
    rankChanged: from.shinobiRank !== to.shinobiRank,
    newRank: to.shinobiRank,
    socialBonus: toNc >= 7 && minDelta > 0 ? 2 : 0,
  };
}

export function getSocialBonusOnLevelUp(fromNc: number, toNc: number): number {
  return getLevelUpDelta(fromNc, toNc).socialBonus;
}

function sumAttributeDifference(a: Attributes, b: Attributes): number {
  let total = 0;
  for (const key of ATTRIBUTE_KEYS) {
    const diff = b[key] - a[key];
    if (diff > 0) total += diff;
  }
  return total;
}

/**
 * Valida uma transição de NC. Foco aqui é a coerência da distribuição de
 * pontos novos e respeito dos mínimos/máximos no estado destino — validações
 * mais profundas (poder, perícia, aptidões) ficam no `validateFullCharacter`.
 */
export function validateLevelUp(
  from: CharacterCore,
  to: CharacterCore,
): ValidationResult {
  if (to.campaignLevel < from.campaignLevel) {
    return { ok: false, error: 'NC não pode diminuir.' };
  }

  const delta = getLevelUpDelta(from.campaignLevel, to.campaignLevel);
  const attrSpent = sumAttributeDifference(from.attributes, to.attributes);
  if (attrSpent > delta.attrPointsGained) {
    return {
      ok: false,
      error: `Gastou mais pontos de atributo do que ganhou (${attrSpent}/${delta.attrPointsGained}).`,
    };
  }

  const below = findAttributesBelowMin(to.attributes, to.campaignLevel);
  if (below.length > 0) {
    const names = below.map((b) => b.key.toUpperCase()).join(', ');
    return { ok: false, error: `Atributos abaixo do mínimo NC ${to.campaignLevel}: ${names}.` };
  }

  const above = findAttributesAboveMax(to.attributes, to.campaignLevel);
  if (above.length > 0) {
    const detail = above.map((a) => `${a.key.toUpperCase()} ${a.current}/${a.max}`).join(', ');
    return { ok: false, error: `Atributos acima do máximo: ${detail}.` };
  }

  // Atributos nunca devem ser DIMINUÍDOS no level up (apenas mantidos ou subidos).
  for (const key of ATTRIBUTE_KEYS) {
    if (to.attributes[key as AttributeKey] < from.attributes[key as AttributeKey]) {
      return {
        ok: false,
        error: `Atributo ${key.toUpperCase()} não pode diminuir ao subir NC.`,
      };
    }
  }

  return { ok: true };
}
