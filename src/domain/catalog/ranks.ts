import type { ShinobiRank } from '../types';

/**
 * Rotulos pt-BR dos postos shinobi (camada de UI). Fonte unica pra evitar
 * mapas duplicados espalhados por components.
 */
export const SHINOBI_RANK_LABELS: Record<ShinobiRank, string> = {
  ESTUDANTE: 'Estudante',
  GENIN: 'Genin',
  CHUUNIN: 'Chuunin',
  JOUNIN_ESPECIAL: 'Jounin Especial',
  JOUNIN: 'Jounin',
  JOUNIN_ELITE: 'Jounin de Elite',
  SANNIN_KAGE: 'Sannin / Kage',
};
