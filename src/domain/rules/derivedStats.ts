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
 * Armas finesse: aceitam Acuidade mesmo fora das categorias "leve" e
 * "arremesso". Inclui katana e variantes Daisho (wakizashi, tanto), espadas
 * curtas e perfurantes leves. Tratado como conjunto fechado pelo motor —
 * armas custom não estão aqui (ficam regidas pela categoria).
 */
const ACUIDADE_ELIGIBLE_KINDS: ReadonlySet<string> = new Set([
  'katana',
  'wakizashi',
  'tanto',
  'rapier',
  'florete',
  'kunai',
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

  const hasAcuidade = aptitudeCodes.includes('acuidade');
  // Acuidade aceita:
  //   - sem opts (assume leve no editor)
  //   - categoria leve ou arremesso
  //   - armas finesse específicas (katana, wakizashi, tanto, ...) independente
  //     da categoria — Livro Básico marca essas como finesse.
  const allowsAcuidade =
    weaponCategory == null ||
    weaponCategory === 'leve' ||
    weaponCategory === 'arremesso' ||
    (weaponKind != null && ACUIDADE_ELIGIBLE_KINDS.has(weaponKind));

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
