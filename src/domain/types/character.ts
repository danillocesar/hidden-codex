import type { Attributes, CombatSkillBases } from './attributes';

export type ShinobiRank =
  | 'ESTUDANTE'
  | 'GENIN'
  | 'CHUUNIN'
  | 'JOUNIN_ESPECIAL'
  | 'JOUNIN'
  | 'JOUNIN_ELITE'
  | 'SANNIN_KAGE';

export type CharacterAptitudeRef = {
  code: string;
  parameter?: string;
  isFreeFromOrigin: boolean;
};

export type CharacterPowerRef = {
  code: string;
  level: number;
};

export type ClanRef = {
  code: string;
  freeAptitudes?: string[];
  freePowers?: { code: string; level: number }[];
};

export type KekkeiGenkaiRef = {
  code: string;
  mainPowerCode?: string;
  freePowerLevelsByElement?: Record<string, number>;
};

/**
 * "Core" shape consumido pelo motor — não inclui campos do banco como `id`,
 * `userId`, timestamps. Permite testar o motor sem depender do Prisma.
 *
 * Pode ser derivado de um row Prisma + relações via mapper em `src/server/queries/`.
 */
export type CharacterCore = {
  campaignLevel: number;
  attributes: Attributes;
  bases: CombatSkillBases;
  pericias: Readonly<Record<string, number>>;
  aptitudes: ReadonlyArray<CharacterAptitudeRef>;
  powers: ReadonlyArray<CharacterPowerRef>;
  clan?: ClanRef;
  kekkeiGenkai?: KekkeiGenkaiRef;
  currentVitality: number;
  currentChakra: number;
  socialCarisma: number;
  socialManipulacao: number;
};

/**
 * Resultado padrão de uma validação do motor. Erros são leitura humana
 * (já em pt-BR) para serem renderizados direto no toast/badge.
 */
export type ValidationResult = { ok: true } | { ok: false; error: string };
