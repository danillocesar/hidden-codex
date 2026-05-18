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

/**
 * Efeito (jutsu) aprendido vinculado a um poder. Cada nivel de poder concede
 * 1 slot — entao um Katon nivel 3 tera 3 `CharacterEffectRef` com
 * `powerCode: 'katon'`. Persistido em `CharacterJutsu` no banco.
 */
export type CharacterEffectRef = {
  powerCode: string;
  effectCode: string;
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
 * "Core" shape consumido pelo motor — nao inclui campos do banco como id,
 * userId, timestamps. Permite testar o motor sem depender do Prisma.
 *
 * Pode ser derivado de um row Prisma + relacoes via mapper em src/server/queries/.
 */
export type CharacterCore = {
  campaignLevel: number;
  attributes: Attributes;
  bases: CombatSkillBases;
  pericias: Readonly<Record<string, number>>;
  aptitudes: ReadonlyArray<CharacterAptitudeRef>;
  powers: ReadonlyArray<CharacterPowerRef>;
  /**
   * Codes de effects (jutsus/tecnicas) conhecidos pelo personagem.
   * Usado em pre-requisitos effects:[code] (ex: Susanoo requer Tsukuyomi+Amaterasu).
   * Opcional para retro-compatibilidade com fichas antigas.
   */
  learnedEffects?: ReadonlyArray<string>;
  /**
   * Flags narrativas marcadas pelo Mestre (ex: evento_traumatico, controle_total,
   * sobrevivido_ao_juuin_jutsu). Usado em pre-req narrative que nao pode ser
   * derivado mecanicamente. Quando o flag esta presente, o pre-req narrativo passa.
   */
  narrativeFlags?: ReadonlyArray<string>;
  clan?: ClanRef;
  kekkeiGenkai?: KekkeiGenkaiRef;
  currentVitality: number;
  currentChakra: number;
  socialCarisma: number;
  socialManipulacao: number;
};

/**
 * Resultado padrao de uma validacao do motor. Erros sao leitura humana
 * (ja em pt-BR) para serem renderizados direto no toast/badge.
 */
export type ValidationResult = { ok: true } | { ok: false; error: string };
