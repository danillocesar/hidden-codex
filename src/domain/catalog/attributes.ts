import type { AttributeKey } from '../types';

export type AttributeDef = {
  code: AttributeKey;
  name: string;
  shortName: string;
  description: string;
};

/**
 * Os 7 atributos primários — Shinobi no Sho 4.1b, Livro Básico.
 * Spec: arcana-forge-spec/04-RULES-ENGINE.md.
 */
export const ATTRIBUTES: ReadonlyArray<AttributeDef> = [
  { code: 'for', name: 'Força', shortName: 'FOR', description: 'Poder físico bruto, capacidade de carga e dano corporal.' },
  { code: 'des', name: 'Destreza', shortName: 'DES', description: 'Precisão, coordenação manual, ataques à distância.' },
  { code: 'agi', name: 'Agilidade', shortName: 'AGI', description: 'Velocidade de reação, esquiva, deslocamento.' },
  { code: 'per', name: 'Percepção', shortName: 'PER', description: 'Sentidos, intuição, ler movimento.' },
  { code: 'int', name: 'Intelecto', shortName: 'INT', description: 'Raciocínio, conhecimento técnico, estratégia.' },
  { code: 'vig', name: 'Vigor', shortName: 'VIG', description: 'Resistência física, vitalidade, fôlego.' },
  { code: 'esp', name: 'Espírito', shortName: 'ESP', description: 'Reserva de chakra, força de vontade, ninpou.' },
];
