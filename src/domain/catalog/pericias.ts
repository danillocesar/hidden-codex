import type { AttributeKey } from '../types';

export type PericiaDef = {
  code: string;
  name: string;
  attribute: AttributeKey;
  requiresTraining: boolean;
  /** Livro Básico restringe Venefício na criação NC 4 — flag para wizard. */
  forbiddenAtNc4?: boolean;
};

/**
 * Perícias do sistema (Livro Básico 4.1b).
 *
 * Lista CORE — completar conforme seedagem do livro (F2.3). Por enquanto
 * coloco as ~18 essenciais que aparecem nas fichas de exemplo. Códigos em
 * snake_case sem acentos para servirem como chaves estáveis.
 */
export const PERICIAS: ReadonlyArray<PericiaDef> = [
  { code: 'acrobacia', name: 'Acrobacia', attribute: 'agi', requiresTraining: false },
  { code: 'atletismo', name: 'Atletismo', attribute: 'for', requiresTraining: false },
  { code: 'cavalgar', name: 'Cavalgar', attribute: 'agi', requiresTraining: false },
  { code: 'curar', name: 'Curar', attribute: 'int', requiresTraining: true },
  { code: 'enganar', name: 'Enganar', attribute: 'int', requiresTraining: false },
  { code: 'escapar', name: 'Escapar', attribute: 'des', requiresTraining: false },
  { code: 'furtividade', name: 'Furtividade', attribute: 'agi', requiresTraining: false },
  { code: 'intimidacao', name: 'Intimidação', attribute: 'for', requiresTraining: false },
  { code: 'investigacao', name: 'Investigação', attribute: 'int', requiresTraining: false },
  { code: 'natacao', name: 'Natação', attribute: 'for', requiresTraining: false },
  { code: 'oficio', name: 'Ofício', attribute: 'int', requiresTraining: true },
  { code: 'prestidigitacao', name: 'Prestidigitação', attribute: 'des', requiresTraining: false },
  { code: 'procurar', name: 'Procurar', attribute: 'per', requiresTraining: false },
  { code: 'prontidao', name: 'Prontidão', attribute: 'per', requiresTraining: false },
  { code: 'rastrear', name: 'Rastrear', attribute: 'per', requiresTraining: false },
  { code: 'sobrevivencia', name: 'Sobrevivência', attribute: 'per', requiresTraining: false },
  { code: 'sociabilizar', name: 'Sociabilizar', attribute: 'int', requiresTraining: false },
  { code: 'venenificio', name: 'Venefício', attribute: 'int', requiresTraining: true, forbiddenAtNc4: true },
];

export const PERICIA_CODES = PERICIAS.map((p) => p.code);

export function getPericiaByCode(code: string): PericiaDef | undefined {
  return PERICIAS.find((p) => p.code === code);
}
