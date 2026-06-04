import type { Attributes, CombatSkillBases } from '../types';

export type WeaponCategory = 'leve' | 'mediana' | 'longa' | 'pesada' | 'arremesso';

export type CombatSkillInput = {
  attributes: Attributes;
  bases: CombatSkillBases;
  /** Códigos das aptidões adquiridas pelo personagem. Ex: "acuidade". */
  aptitudeCodes: ReadonlyArray<string>;
};

export type CCOptions = {
  weaponCategory?: WeaponCategory;
  /** Identificador de arma específica para checar Especialista (ex: "katana"). */
  weaponKind?: string;
};

/**
 * Armas com permissão EXPLÍCITA do Livro Básico 4.1b para receber o benefício
 * da aptidão Acuidade — ALÉM das armas de categoria "leve", que recebem
 * automaticamente pela própria definição da categoria (Livro Básico, cap.
 * Equipamentos: "Toda arma leve pode receber o benefício da aptidão Acuidade").
 *
 * A lista abaixo é taxativa: vem de cada entrada de arma do livro que carrega
 * a frase "A aptidão Acuidade se aplica a X". Inferência por similaridade
 * (ex.: tanto, rapier) **NÃO** é RAW e está fora.
 *
 * Páginas de origem aproximadas (Livro Básico 4.1b):
 *   - Aian Nakkuru, Bastão, Chicote, Chokutō, Florete, Katana, Leque Gigante,
 *     Ninja-Tō, Wakizashi → capítulo Equipamentos (p. ~130-135)
 *   - Espada de Chakra Branco → capítulo Aptidões Especiais (p. ~160)
 *   - Braço de Chakra → poder ninpou específico (p. ~220)
 *
 * Quando o seed de equipments (F2.3) entregar a tabela `equipments`, mover
 * essa lista para uma flag `acceptsAcuidade: boolean` no JSONB do equipment e
 * remover daqui — o motor passa a consultar o equipamento em vez de um set
 * estático. Até lá, código nominal serve como única fonte de verdade local.
 *
 * Daisho rule (Especialista (Katana) também aplica em Wakizashi) é tratada
 * separadamente abaixo, não nesta lista.
 */
const ACUIDADE_NAMED_WEAPONS: ReadonlySet<string> = new Set([
  'aian_nakkuru',
  'bastao',
  'chicote', // mediana
  'chokuto', // longa
  'florete',
  'katana', // mediana
  'leque_gigante', // longa
  'ninja_to',
  'wakizashi',
  'espada_chakra_branco',
  'braco_chakra',
]);

/**
 * Combate Corporal — usa Força por padrão, ou Destreza com Acuidade quando a
 * arma permite (categorias `leve` e `arremesso`). Especialista de uma categoria
 * específica soma +1 ao empunhar a arma certa. Daisho rule (katana ↔ wakizashi)
 * é aplicada automaticamente.
 *
 * Spec: arcana-forge-spec/04-RULES-ENGINE.md §"Habilidades de Combate".
 */
export function calculateCC(input: CombatSkillInput, opts: CCOptions = {}): number {
  const { attributes, bases, aptitudeCodes } = input;
  const { weaponCategory, weaponKind } = opts;

  // `acuidade_homebrew` é a variante caseira que também afeta o dano; pra
  // precisão de CC ela se comporta igual à Acuidade (substitui Força por Destreza).
  const hasAcuidade =
    aptitudeCodes.includes('acuidade') || aptitudeCodes.includes('acuidade_homebrew');
  // RAW (Livro Básico 4.1b, aptidão Acuidade):
  //   - Toda arma de categoria "leve" recebe Acuidade automaticamente.
  //   - Armas além de leve só recebem se o texto da arma disser explicitamente
  //     ("A aptidão Acuidade se aplica a X") — codificado em ACUIDADE_NAMED_WEAPONS.
  //   - Sem opts assumimos a default do editor (arma leve genérica).
  // "Arremesso" como categoria-blanket NÃO é RAW: o livro fala apenas em
  // "armas de arremesso que podem ser usadas no corpo-a-corpo (como kunai)",
  // que devem ser marcadas como leves no equipment.
  const allowsAcuidade =
    weaponCategory == null ||
    weaponCategory === 'leve' ||
    (weaponKind != null && ACUIDADE_NAMED_WEAPONS.has(weaponKind));

  const attribute = hasAcuidade && allowsAcuidade ? attributes.des : attributes.for;

  let aptitudeBonus = 0;
  if (weaponKind) {
    const especialistaCode = `especialista_${weaponKind}`;
    if (aptitudeCodes.includes(especialistaCode)) aptitudeBonus += 1;

    // Daisho rule (Livro Básico): Especialista (Katana) também aplica em
    // wakizashi quando empunhada via Ambidestria.
    if (
      weaponKind === 'wakizashi' &&
      aptitudeCodes.includes('especialista_katana') &&
      !aptitudeCodes.includes('especialista_wakizashi')
    ) {
      aptitudeBonus += 1;
    }
  }

  return bases.cc + attribute + aptitudeBonus;
}

export function calculateCD(input: CombatSkillInput): number {
  return input.bases.cd + input.attributes.des;
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
