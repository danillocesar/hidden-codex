import { LEVEL_TABLE, MIN_CAMPAIGN_LEVEL, TABLE_MAX_LEVEL, type LevelRow } from '../catalog/levelTable';

/**
 * Retorna a linha da tabela de evolução para um dado NC.
 *
 * Para NC entre 4 e 20 usa a tabela direta. Acima de 20, extrapola seguindo a
 * regra "+6 atributo / +4 perícia / +2 poder por NC" do Livro Básico §
 * "Extensão acima de NC 20".
 *
 * @throws se NC < 4 (criação mínima é 4).
 */
export function getLevelRow(nc: number): LevelRow {
  if (!Number.isFinite(nc) || !Number.isInteger(nc)) {
    throw new Error(`NC inválido: ${nc}. Deve ser inteiro.`);
  }
  if (nc < MIN_CAMPAIGN_LEVEL) {
    throw new Error(`NC mínimo é ${MIN_CAMPAIGN_LEVEL}. Recebido: ${nc}.`);
  }
  if (nc <= TABLE_MAX_LEVEL) {
    const row = LEVEL_TABLE.find((r) => r.campaignLevel === nc);
    if (!row) {
      // Inalcançável dado o range, mas o type-checker do
      // `noUncheckedIndexedAccess` exige o guard.
      throw new Error(`Sem linha na tabela para NC ${nc}.`);
    }
    return row;
  }

  const base = LEVEL_TABLE[LEVEL_TABLE.length - 1]!;
  const delta = nc - TABLE_MAX_LEVEL;
  return {
    campaignLevel: nc,
    shinobiRank: 'SANNIN_KAGE',
    attrPoints: base.attrPoints + delta * 6,
    pericaPoints: base.pericaPoints + delta * 4,
    powerPoints: base.powerPoints + delta * 2,
    minAttribute: Math.min(base.minAttribute + Math.floor(delta / 2), 20),
  };
}

/** Atalhos pra leitura mais limpa. */
export function getAttrBudget(nc: number): number {
  return getLevelRow(nc).attrPoints;
}

export function getPericaBudget(nc: number): number {
  return getLevelRow(nc).pericaPoints;
}

export function getPowerBudget(nc: number): number {
  return getLevelRow(nc).powerPoints;
}
