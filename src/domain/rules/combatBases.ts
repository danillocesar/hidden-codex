import type { CombatSkillBases, ValidationResult } from '../types';
import { COMBAT_SKILLS, INITIAL_COMBAT_BASES_SUM, MAX_REMANEJAMENTO } from '../catalog/combatSkills';

const INITIAL_BASES: CombatSkillBases = {
  cc: 3,
  cd: 3,
  esq: 3,
  lm: 3,
};

/**
 * Valida o remanejamento das bases de combate.
 *
 * Regra do livro: bases iniciais somam 12 (3+3+3+3) e o jogador pode mover
 * até 2 pontos entre quaisquer bases — tanto o total movido pra cima quanto o
 * total movido pra baixo são limitados a 2.
 *
 * Mensagens de erro são em pt-BR (vão direto pra UI sem tradução).
 */
export function validateCombatBases(bases: CombatSkillBases): ValidationResult {
  const sum = bases.cc + bases.cd + bases.esq + bases.lm;
  if (sum !== INITIAL_COMBAT_BASES_SUM) {
    return {
      ok: false,
      error: `Soma das bases de combate deve ser ${INITIAL_COMBAT_BASES_SUM} (atual: ${sum}).`,
    };
  }

  let movedFrom = 0;
  let movedTo = 0;
  for (const skill of COMBAT_SKILLS) {
    const delta = bases[skill.code] - INITIAL_BASES[skill.code];
    if (delta < 0) movedFrom += Math.abs(delta);
    if (delta > 0) movedTo += delta;
    if (bases[skill.code] < 0) {
      return {
        ok: false,
        error: `Base de ${skill.name} não pode ser negativa.`,
      };
    }
  }

  if (movedFrom > MAX_REMANEJAMENTO || movedTo > MAX_REMANEJAMENTO) {
    return {
      ok: false,
      error: `Máximo de ${MAX_REMANEJAMENTO} pontos podem ser remanejados entre bases.`,
    };
  }

  return { ok: true };
}

export const INITIAL_BASES_REF = INITIAL_BASES;
