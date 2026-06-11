/**
 * Regras de elemento que afetam o cálculo de dano.
 *
 * Alguns elementos concedem um bônus fixo de **dano base** a TODOS os seus
 * efeitos (Livro Básico p. 105). Esse bônus é parte do dano base — logo, é
 * dividido junto quando uma regra divide o dano (ex.: Canhão sem chakra) e não
 * se confunde com bônus por-ataque (Ataque Poderoso).
 *
 * Fonte: Livro Básico — "Dano Adicional: Todo Efeito Fuuton recebe +2 de dano
 * base." (p. 105); a mesma regra existe para Katon (p. 107).
 */

/** Bônus de dano base por código de poder/elemento. Ausente = 0. */
export const ELEMENT_DAMAGE_BONUS: Readonly<Record<string, number>> = {
  fuuton: 2,
  // katon: 2, // Livro Básico p. 107 — mesma regra; habilitar quando confirmado.
};

/**
 * Bônus de dano base do elemento de um poder (0 quando o poder não concede
 * nenhum). Tolerante a code nulo/desconhecido.
 */
export function getElementDamageBonus(powerCode: string | null | undefined): number {
  if (!powerCode) return 0;
  return ELEMENT_DAMAGE_BONUS[powerCode] ?? 0;
}
