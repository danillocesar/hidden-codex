import { roundUp } from './math';

export type DamageType = 'cc' | 'cd_thrown' | 'ninpou_canhao' | 'ninpou_standard';

export type DamageGrade = 0 | 1 | 2 | 3 | 4;

export type DamageBreakdownInput = {
  damageType: DamageType;
  attackerForce: number;
  attackerDexterity: number;
  attackerEspirito: number;
  weaponDamage?: number;
  powerLevel?: number;
  ataquePoderoso?: boolean;
  otherBonus?: number;
  /**
   * Bônus de dano base do elemento (ex.: Fuuton +2). Faz parte do dano base —
   * é somado ao total e contabilizado como componente próprio. Veja
   * `getElementDamageBonus` em `elements.ts`.
   */
  elementDamageBonus?: number;
  /**
   * Regra-casa (homebrew, aptidão "Acuidade (Homebrew)"): no dano de CC, usa
   * metade da Destreza em vez da Força. RAW é sempre Força — só ative quando o
   * caller confirmar que o personagem tem a aptidão e a arma aceita Acuidade.
   */
  ccDamageUsesDex?: boolean;
};

export type DamageBreakdown = {
  components: {
    dda: number;
    halfEsp: number;
    nivel: number;
    /** Bônus de dano base do elemento (Fuuton +2, etc.). */
    elemento: number;
    outro: number;
  };
  total: number;
  byGrade: {
    grade1: number;
    grade2: number;
    grade3: number;
    grade4: number;
  };
};

/**
 * Calculadora central de dano — alimenta o modal de uso de jutsu/arma.
 *
 * Mantemos o nome de coluna "2/ESP" do modal para compatibilidade visual:
 * em CC representa metade da Força, em CD-arremesso metade da Destreza,
 * em Ninpou padrão metade do Espírito. O "Total" é a soma dos componentes;
 * `byGrade` multiplica pelo grau de acerto (1×, 2×, 3×, 4×).
 *
 * **RAW:** Acuidade NÃO afeta dano de CC (Livro Básico). Caso futuro venha a
 * existir flag de regra-casa, essa função aceita um override via parâmetro.
 */
export function calculateDamageBreakdown(opts: DamageBreakdownInput): DamageBreakdown {
  let dda = 0;
  let halfEsp = 0;
  let nivel = 0;
  let outro = 0;

  switch (opts.damageType) {
    case 'cc':
      dda = opts.weaponDamage ?? 0;
      // RAW: Força. Homebrew "Acuidade (Homebrew)": Destreza.
      halfEsp = roundUp((opts.ccDamageUsesDex ? opts.attackerDexterity : opts.attackerForce) / 2);
      break;
    case 'cd_thrown':
      dda = opts.weaponDamage ?? 0;
      halfEsp = roundUp(opts.attackerDexterity / 2);
      break;
    case 'ninpou_canhao':
      nivel = 2 * (opts.powerLevel ?? 0);
      break;
    case 'ninpou_standard':
      halfEsp = roundUp(opts.attackerEspirito / 2);
      nivel = opts.powerLevel ?? 0;
      break;
  }

  // Bônus de dano base do elemento (Fuuton +2, etc.) — só para danos de poder.
  const elemento = opts.damageType.startsWith('ninpou') ? (opts.elementDamageBonus ?? 0) : 0;

  if (opts.ataquePoderoso) outro += 1;
  if (opts.otherBonus) outro += opts.otherBonus;

  const total = Math.max(0, dda + halfEsp + nivel + elemento + outro);

  return {
    components: { dda, halfEsp, nivel, elemento, outro },
    total,
    byGrade: {
      grade1: total * 1,
      grade2: total * 2,
      grade3: total * 3,
      grade4: total * 4,
    },
  };
}

/**
 * Converte o resultado de 2d8 (3..16) em grau de dano.
 * Crítico padrão é [15, 16]; armas/aptidões podem ampliar.
 */
export function getDamageGrade(
  d2d8Result: number,
  criticalRange: readonly [number, number] = [15, 16],
): DamageGrade {
  if (d2d8Result <= 3) return 0;
  if (d2d8Result >= criticalRange[0] && d2d8Result <= criticalRange[1]) return 4;
  if (d2d8Result <= 8) return 1;
  if (d2d8Result <= 11) return 2;
  if (d2d8Result <= 14) return 3;
  return 4;
}

/**
 * Ataque múltiplo: divide o dano base pelo número de hits, arredondando para
 * cima (regra RAW). Cada hit ainda é um teste separado.
 */
export function calculateMultiAttackDamage(damageBase: number, attackCount: 2 | 3): number {
  return roundUp(damageBase / attackCount);
}

/**
 * Acerto crítico aplica condição "sangrando" (1 nível). Hits múltiplos
 * acumulam — função pura para o caller decidir quando aplicar.
 */
export function applyCriticalEffects(currentBleedingLevel: number, criticalCount = 1): number {
  return currentBleedingLevel + criticalCount;
}
