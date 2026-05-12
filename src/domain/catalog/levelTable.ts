import type { ShinobiRank } from '../types';

export type LevelRow = {
  campaignLevel: number;
  shinobiRank: ShinobiRank;
  attrPoints: number;
  pericaPoints: number;
  powerPoints: number;
  minAttribute: number;
};

/**
 * Tabela de evolução — Livro Básico 4.1b.
 * Espelha `arcana-forge-spec/04-RULES-ENGINE.md §"Tabela de evolução"`.
 *
 * Personagens iniciam em NC 4 (Genin). Acima de NC 20 há extrapolação contínua
 * (ver `getLevelRow`).
 */
export const LEVEL_TABLE: ReadonlyArray<LevelRow> = [
  { campaignLevel: 4, shinobiRank: 'GENIN', attrPoints: 12, pericaPoints: 8, powerPoints: 4, minAttribute: 0 },
  { campaignLevel: 5, shinobiRank: 'GENIN', attrPoints: 18, pericaPoints: 12, powerPoints: 6, minAttribute: 1 },
  { campaignLevel: 6, shinobiRank: 'GENIN', attrPoints: 24, pericaPoints: 16, powerPoints: 8, minAttribute: 1 },
  { campaignLevel: 7, shinobiRank: 'CHUUNIN', attrPoints: 30, pericaPoints: 20, powerPoints: 10, minAttribute: 2 },
  { campaignLevel: 8, shinobiRank: 'CHUUNIN', attrPoints: 36, pericaPoints: 24, powerPoints: 12, minAttribute: 2 },
  { campaignLevel: 9, shinobiRank: 'CHUUNIN', attrPoints: 42, pericaPoints: 28, powerPoints: 14, minAttribute: 3 },
  { campaignLevel: 10, shinobiRank: 'JOUNIN_ESPECIAL', attrPoints: 48, pericaPoints: 32, powerPoints: 16, minAttribute: 3 },
  { campaignLevel: 11, shinobiRank: 'JOUNIN_ESPECIAL', attrPoints: 54, pericaPoints: 36, powerPoints: 18, minAttribute: 4 },
  { campaignLevel: 12, shinobiRank: 'JOUNIN', attrPoints: 60, pericaPoints: 40, powerPoints: 20, minAttribute: 4 },
  { campaignLevel: 13, shinobiRank: 'JOUNIN', attrPoints: 66, pericaPoints: 44, powerPoints: 22, minAttribute: 5 },
  { campaignLevel: 14, shinobiRank: 'JOUNIN', attrPoints: 72, pericaPoints: 48, powerPoints: 24, minAttribute: 5 },
  { campaignLevel: 15, shinobiRank: 'JOUNIN_ELITE', attrPoints: 78, pericaPoints: 52, powerPoints: 26, minAttribute: 6 },
  { campaignLevel: 16, shinobiRank: 'JOUNIN_ELITE', attrPoints: 84, pericaPoints: 56, powerPoints: 28, minAttribute: 6 },
  { campaignLevel: 17, shinobiRank: 'JOUNIN_ELITE', attrPoints: 90, pericaPoints: 60, powerPoints: 30, minAttribute: 7 },
  { campaignLevel: 18, shinobiRank: 'SANNIN_KAGE', attrPoints: 96, pericaPoints: 64, powerPoints: 32, minAttribute: 7 },
  { campaignLevel: 19, shinobiRank: 'SANNIN_KAGE', attrPoints: 102, pericaPoints: 68, powerPoints: 34, minAttribute: 8 },
  { campaignLevel: 20, shinobiRank: 'SANNIN_KAGE', attrPoints: 108, pericaPoints: 72, powerPoints: 40, minAttribute: 8 },
];

export const MIN_CAMPAIGN_LEVEL = 4 as const;
export const TABLE_MAX_LEVEL = 20 as const;
