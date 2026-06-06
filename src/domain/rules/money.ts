import type { ShinobiRank } from '../types';
import { getLevelRow } from './pointsBudget';

/**
 * Dinheiro inicial (Ryos) por posto shinobi.
 *
 * RAW — Livro Basico p.126 ("Dinheiro Inicial"): a quantia inicial depende do
 * nivel shinobi. O Ryo e a moeda padrao do sistema. ESTUDANTE nao aparece na
 * tabela do livro (personagens iniciam Genin); mantemos o baseline Genin pra
 * cobrir o type exaustivamente.
 */
export const STARTING_RYOS_BY_RANK: Record<ShinobiRank, number> = {
  ESTUDANTE: 100,
  GENIN: 100,
  CHUUNIN: 1_000,
  JOUNIN_ESPECIAL: 5_000,
  JOUNIN: 13_000,
  JOUNIN_ELITE: 36_000,
  SANNIN_KAGE: 88_000,
};

/**
 * Ryos iniciais sugeridos para um NC — resolvidos pelo posto shinobi da tabela
 * de niveis. Acima de NC 20 a tabela extrapola como Sannin/Kage.
 */
export function getStartingRyos(nc: number): number {
  return STARTING_RYOS_BY_RANK[getLevelRow(nc).shinobiRank];
}
