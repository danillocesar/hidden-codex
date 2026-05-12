import type { AttributeKey, CombatSkillKey } from '../types';

export type CombatSkillDef = {
  code: CombatSkillKey;
  name: string;
  attribute: AttributeKey;
  initialBase: number;
};

/**
 * As 4 habilidades de combate do sistema. Bases iniciais somam 12.
 * Remanejamento permitido: até 2 pontos podem ser movidos entre elas.
 */
export const COMBAT_SKILLS: ReadonlyArray<CombatSkillDef> = [
  { code: 'cc', name: 'Combate Corporal', attribute: 'for', initialBase: 3 },
  { code: 'cd', name: 'Combate à Distância', attribute: 'des', initialBase: 3 },
  { code: 'esq', name: 'Esquiva', attribute: 'agi', initialBase: 3 },
  { code: 'lm', name: 'Ler Movimento', attribute: 'per', initialBase: 3 },
];

export const INITIAL_COMBAT_BASES_SUM = 12 as const;
export const MAX_REMANEJAMENTO = 2 as const;
