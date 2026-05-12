import type { CharacterCore } from '@/domain/types';

/**
 * Personagem de referência usado pelo motor e pelos testes.
 *
 * Satsuki Yuki NC 6 — caso real validado contra o Livro Básico:
 *   Vitalidade  : 10 + 3×5 + 5×6 = 55
 *   Chakra      : 10 + 3×3      = 19
 *   CC c/ katana: 5 + 6 (Acuidade) + 1 (Especialista) = 12
 *
 * Spec: arcana-forge-spec/04-RULES-ENGINE.md §"Testes do motor".
 */
export const satsukiNc6: CharacterCore = {
  campaignLevel: 6,
  attributes: { for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 },
  bases: { cc: 5, cd: 3, esq: 3, lm: 1 },
  pericias: {
    acrobacia: 2,
    atletismo: 2,
    escapar: 2,
    furtividade: 2,
    prestidigitacao: 2,
    procurar: 2,
    prontidao: 2,
    rastrear: 2,
  },
  aptitudes: [
    { code: 'especialista_katana', isFreeFromOrigin: true },
    { code: 'acuidade', isFreeFromOrigin: true },
    { code: 'ataque_poderoso', isFreeFromOrigin: true },
    { code: 'velocista', isFreeFromOrigin: false },
    { code: 'lutar_as_cegas', isFreeFromOrigin: false },
  ],
  powers: [
    { code: 'hyouton', level: 3 },
    { code: 'suiton', level: 2 },
    { code: 'fuuton', level: 1 },
  ],
  clan: { code: 'yuki' },
  kekkeiGenkai: {
    code: 'hyouton',
    mainPowerCode: 'hyouton',
    freePowerLevelsByElement: { fuuton: 1, suiton: 1 },
  },
  currentVitality: 55,
  currentChakra: 19,
  socialCarisma: 0,
  socialManipulacao: 0,
};

/**
 * Bases padrão (3+3+3+3) — útil quando o teste não precisa do remanejamento.
 */
export const STANDARD_BASES = { cc: 3, cd: 3, esq: 3, lm: 3 } as const;
