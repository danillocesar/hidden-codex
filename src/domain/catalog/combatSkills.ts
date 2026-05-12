import type { AttributeKey, CombatSkillKey } from '../types';

export type CombatSkillDef = {
  code: CombatSkillKey;
  name: string;
  abbreviation: string;
  kanji: string;
  order: number;
  /** Valor base padrão (3 em todas, soma 12, remanejamento permite até ±2). */
  defaultBase: number;
  /** Atributo padrão do cálculo. */
  baseAttribute: AttributeKey;
  /**
   * Atributo alternativo permitido por aptidão (ex.: CC com Acuidade usa Des).
   * `null` quando não há alternativa.
   */
  alternateAttribute: AttributeKey | null;
  /** Código da aptidão que destrava o atributo alternativo. */
  alternateAttributeRequiresAptitude?: string;
  shortDescription: string;
  description: string;
  /** Fórmula textual exibida em tooltip. */
  formula: string;
  /**
   * Que tipos de ataque essa habilidade defende contra — útil pra UI
   * mostrar "ESQ defende contra CC e CD" na ficha.
   */
  defendsAgainst: ReadonlyArray<string>;
};

/**
 * As 4 habilidades de combate — Shinobi no Sho 4.1b, Livro Básico (p. 19-20).
 *
 * Valores base remanejáveis (até 2 pontos podem ser movidos entre elas), mas o
 * atributo ligado é fixo. Como o motor já tem `INITIAL_BASES_REF` e
 * `MAX_REMANEJAMENTO`, mantenho aqui só os defaults agregados.
 *
 * Mantenha em sincronia com `prisma/seed-data/combat-skills.json`.
 */
export const COMBAT_SKILLS: ReadonlyArray<CombatSkillDef> = [
  {
    code: 'cc',
    name: 'Combate Corporal',
    abbreviation: 'CC',
    kanji: '近接',
    order: 1,
    defaultBase: 3,
    baseAttribute: 'for',
    alternateAttribute: 'des',
    alternateAttributeRequiresAptitude: 'acuidade',
    shortDescription: 'Habilidade para ataques desarmados ou com armas corpo-a-corpo.',
    description:
      'Combate Corporal (CC) é a precisão do personagem em ataques físicos próximos: socos, chutes, armas brancas, golpes desarmados, e técnicas de toque. O atributo padrão é Força, mas pode ser substituído por Destreza através da aptidão Acuidade (com restrições por categoria de arma).',
    formula: 'base + (Força ou Destreza com Acuidade) + bônus de aptidões',
    defendsAgainst: [],
  },
  {
    code: 'cd',
    name: 'Combate à Distância',
    abbreviation: 'CD',
    kanji: '遠隔',
    order: 2,
    defaultBase: 3,
    baseAttribute: 'des',
    alternateAttribute: null,
    shortDescription:
      'Habilidade para ataques de longa distância: arremesso, arco, jutsus tipo Canhão.',
    description:
      'Combate à Distância (CD) é a precisão do personagem em ataques realizados a distância: arremesso de shurikens e kunais, uso de arcos e besta, e também a maioria dos jutsus elementais ofensivos (Canhão, Sopro). O atributo base é sempre Destreza.',
    formula: 'base + Destreza + bônus de aptidões',
    defendsAgainst: [],
  },
  {
    code: 'esq',
    name: 'Esquiva',
    abbreviation: 'ESQ',
    kanji: '回避',
    order: 3,
    defaultBase: 3,
    baseAttribute: 'agi',
    alternateAttribute: null,
    shortDescription: 'Defesa instintiva. Reação para escapar de ataques físicos.',
    description:
      'Esquiva (ESQ) mede o reflexo do personagem para desviar de ataques, seja conscientemente (movendo-se para fora da linha) ou instintivamente (esquivando de uma avalanche de pedras, por exemplo). É a defesa primária contra ataques físicos. Base em Agilidade.',
    formula: 'base + Agilidade + bônus (ex: Reflexos +1)',
    defendsAgainst: ['CC', 'CD'],
  },
  {
    code: 'lm',
    name: 'Ler Movimento',
    abbreviation: 'LM',
    kanji: '読動',
    order: 4,
    defaultBase: 3,
    baseAttribute: 'per',
    alternateAttribute: null,
    shortDescription:
      'Capacidade de prever e reagir a ataques com poderes defensivos elaborados.',
    description:
      'Ler Movimento (LM) mede a capacidade do personagem em prever e acompanhar os movimentos ofensivos do adversário, possibilitando reações mais elaboradas usando poderes defensivos (manobras de previsão). Geralmente usado em conjunto com técnicas defensivas; muitas Manobras de Previsão não são reações instantâneas, mas ações defensivas que consomem ações do turno. Base em Percepção.',
    formula: 'base + Percepção + bônus (ex: Intuição +1)',
    defendsAgainst: ['jutsus ofensivos', 'técnicas com previsão'],
  },
];

/** Soma total das bases iniciais — usada na validação de remanejamento. */
export const INITIAL_COMBAT_BASES_SUM = 12 as const;

/** Máximo de pontos que podem ser movidos entre bases. */
export const MAX_REMANEJAMENTO = 2 as const;

export function getCombatSkillByCode(code: CombatSkillKey): CombatSkillDef {
  const skill = COMBAT_SKILLS.find((s) => s.code === code);
  if (!skill) throw new Error(`Habilidade de combate desconhecida: ${code}`);
  return skill;
}
