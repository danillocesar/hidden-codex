/**
 * Aptidão **Especialista** (Livro Básico 4.1b, p. 63).
 *
 * RAW: o personagem escolhe uma CATEGORIA de arma (ou combate desarmado) e
 * ganha +1 de precisão em todos os testes de CC ou CD feitos com armas daquela
 * categoria. A aptidão é repetível — pode ser comprada N vezes, uma categoria
 * por compra. NÃO é cumulativa com Maestria.
 *
 * Modelagem no projeto: cada compra é uma `CharacterAptitude` com
 * `code='especialista'` + `parameter=<categoria>`. Quando o motor recebe os
 * códigos de aptidão "achatados" (via `aptitudes.flatMap`), uma compra vira o
 * código `especialista_<categoria>` — é assim que `especialistaBonus` checa.
 *
 * (Antes da v. RAW, o projeto modelava Especialista por arma específica —
 * `especialista_katana` + regra Daisho. Migrado para categoria em jun/2026;
 * ver SESSION-LOG.)
 */

/**
 * As 9 categorias selecionáveis pela aptidão Especialista. Os códigos batem com
 * `especialista.effects.categoryChoice` do seed (`aptitudes-common-combat.json`).
 */
export const ESPECIALISTA_CATEGORIES = [
  'desarmado',
  'armas_naturais',
  'disparo',
  'arremesso',
  'leves',
  'medianas',
  'longas',
  'pesadas',
  'especiais',
] as const;

export type EspecialistaCategory = (typeof ESPECIALISTA_CATEGORIES)[number];

/** Rótulos pt-BR pra UI (wizard, ficha). */
export const ESPECIALISTA_CATEGORY_LABELS: Record<EspecialistaCategory, string> = {
  desarmado: 'Desarmado',
  armas_naturais: 'Armas naturais',
  disparo: 'Disparo',
  arremesso: 'Arremesso',
  leves: 'Leves',
  medianas: 'Medianas',
  longas: 'Longas',
  pesadas: 'Pesadas',
  especiais: 'Especiais',
};

const CATEGORY_SET = new Set<string>(ESPECIALISTA_CATEGORIES);

export function isEspecialistaCategory(value: string | null | undefined): value is EspecialistaCategory {
  return value != null && CATEGORY_SET.has(value);
}

/**
 * Mapeia o `WeaponCategory` do equipamento (enum do schema) + subtype pra
 * categoria de Especialista. Armas de subtype "especial" caem em `especiais`
 * (categoria própria do livro, paralela a leves/medianas/etc.), independente da
 * categoria física. Categorias utilitárias (munição, explosivo, área,
 * equipamento) e a variável (kusanagi, sem subtype) não têm Especialista → null.
 */
export function especialistaCategoryForWeapon(
  category: string | null | undefined,
  subtype: string | null | undefined,
): EspecialistaCategory | null {
  if (subtype && subtype.toLowerCase() === 'especial') return 'especiais';
  switch (category) {
    case 'DESARMADO':
      return 'desarmado';
    case 'LEVE':
    case 'LEVE_COMPLEMENTAR':
      return 'leves';
    case 'MEDIANA':
      return 'medianas';
    case 'LONGA':
      return 'longas';
    case 'PESADA':
      return 'pesadas';
    case 'ARREMESSO':
      return 'arremesso';
    case 'DISPARO':
      return 'disparo';
    default:
      return null;
  }
}

/**
 * +1 de precisão se o personagem tem Especialista na categoria da arma. Recebe
 * os códigos de aptidão já achatados (`especialista_<categoria>`). Retorna 0
 * quando a arma não tem categoria de Especialista ou o personagem não a comprou.
 */
export function especialistaBonus(
  aptitudeCodes: ReadonlyArray<string>,
  category: EspecialistaCategory | null | undefined,
): number {
  if (!category) return 0;
  return aptitudeCodes.includes(`especialista_${category}`) ? 1 : 0;
}
