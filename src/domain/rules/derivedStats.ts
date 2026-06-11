import type { Attributes, CombatSkillBases } from '../types';
import { especialistaBonus, type EspecialistaCategory } from './especialista';

export type CombatSkillInput = {
  attributes: Attributes;
  bases: CombatSkillBases;
  /**
   * Códigos das aptidões adquiridas pelo personagem, já achatados — uma
   * Especialista (medianas) entra como "especialista_medianas". Ex: "acuidade".
   */
  aptitudeCodes: ReadonlyArray<string>;
};

export type CCOptions = {
  /**
   * Categoria de Especialista da arma empunhada (ver `especialista.ts`).
   * Habilita +1 de precisão quando o personagem tem `especialista_<categoria>`.
   */
  especialistaCategory?: EspecialistaCategory | null;
  /**
   * Arma aceita a aptidão Acuidade (Destreza no lugar de Força na precisão de
   * CC). Default `true` — sem contexto de arma assumimos a melhor hipótese (o
   * editor mostra o CC "ideal"). O mapper da ficha passa o valor real por arma
   * (`acceptsAcuidade`, derivado de categoria leve / `compatibleAptitudes`).
   */
  acceptsAcuidade?: boolean;
};

export type CDOptions = {
  /** Categoria de Especialista da arma de distância empunhada. */
  especialistaCategory?: EspecialistaCategory | null;
};

/**
 * Combate Corporal — usa Força por padrão, ou Destreza com Acuidade quando a
 * arma aceita (`acceptsAcuidade`). Especialista soma +1 quando a categoria da
 * arma bate com uma das categorias compradas pelo personagem.
 *
 * Spec: arcana-forge-spec/04-RULES-ENGINE.md §"Habilidades de Combate".
 */
export function calculateCC(input: CombatSkillInput, opts: CCOptions = {}): number {
  const { attributes, bases, aptitudeCodes } = input;
  const { especialistaCategory, acceptsAcuidade = true } = opts;

  // `acuidade_homebrew` é a variante caseira que também afeta o dano; pra
  // precisão de CC ela se comporta igual à Acuidade (substitui Força por Destreza).
  const hasAcuidade =
    aptitudeCodes.includes('acuidade') || aptitudeCodes.includes('acuidade_homebrew');
  const attribute = hasAcuidade && acceptsAcuidade ? attributes.des : attributes.for;

  return bases.cc + attribute + especialistaBonus(aptitudeCodes, especialistaCategory);
}

/**
 * Combate à Distância — base + Destreza. Especialista também vale em CC ou CD
 * (Livro Básico): armas de disparo/arremesso somam +1 quando a categoria bate.
 */
export function calculateCD(input: CombatSkillInput, opts: CDOptions = {}): number {
  return (
    input.bases.cd +
    input.attributes.des +
    especialistaBonus(input.aptitudeCodes, opts.especialistaCategory)
  );
}

export function calculateESQ(input: CombatSkillInput): number {
  const reflexosBonus = input.aptitudeCodes.includes('reflexos') ? 1 : 0;
  return input.bases.esq + input.attributes.agi + reflexosBonus;
}

export function calculateLM(input: CombatSkillInput): number {
  const intuicaoBonus = input.aptitudeCodes.includes('intuicao') ? 1 : 0;
  return input.bases.lm + input.attributes.per + intuicaoBonus;
}

/**
 * Vitalidade máxima — Livro Básico:  10 + 3×Vig + 5×NC.
 */
export function calculateMaxVitality(vigor: number, nc: number): number {
  return 10 + 3 * vigor + 5 * nc;
}

/**
 * Chakra máximo — Livro Básico:  10 + 3×Esp.
 */
export function calculateMaxChakra(espirito: number): number {
  return 10 + 3 * espirito;
}

/** Cura natural por noite (8h de descanso). */
export function vitalityRecoveryPerNight(vigor: number): number {
  return 10 + 2 * vigor;
}

export function chakraRecoveryPerNight(espirito: number): number {
  return 5 + 2 * espirito;
}
