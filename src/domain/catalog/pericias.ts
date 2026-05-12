import type { AttributeKey } from '../types';

/**
 * Atributos aceitos como base de uma perícia. Os 7 primários **mais** atributos
 * sociais. Por enquanto só Carisma (`car`) aparece, em Obter Informação.
 * Manipulação (`man`) entra quando perícias do Guia Avançado forem seedadas.
 */
export type PericiaAttribute = AttributeKey | 'car' | 'man';

export type PericiaDef = {
  code: string;
  name: string;
  /** Atributo ligado — primário OU social. */
  attribute: PericiaAttribute;
  /**
   * Marcada com [x] no livro. Não pode ser USADA sem ao menos 1 ponto
   * investido — fica "sem treino".
   */
  trained: boolean;
  /**
   * Marcada com [x][x]. Requer aptidão especial pra ser COMPRADA em qualquer
   * nível. Ex.: Venefício requer Químico.
   */
  doubleTrained: boolean;
  /**
   * Acrobacia, Atletismo e Furtividade exigem liberdade de movimentos — usar
   * armadura aplica penalidade cumulativa nestes testes.
   */
  armorPenalty: boolean;
  /** Ordem canônica de exibição (1..20). */
  order: number;
  shortDescription: string;
};

/**
 * Perícias do Livro Básico 4.1b (lista fechada de 20 entradas).
 *
 * Mantenha em sincronia com `prisma/seed-data/pericias.json`. O motor lê desta
 * constante para resolver cálculos rápidos sem ida ao banco; o banco mantém a
 * mesma lista como fonte de UI/admin lookups.
 */
export const PERICIAS: ReadonlyArray<PericiaDef> = [
  {
    code: 'acrobacia',
    name: 'Acrobacia',
    attribute: 'agi',
    trained: false,
    doubleTrained: false,
    armorPenalty: true,
    order: 1,
    shortDescription:
      'Andar na corda bamba, cair sem se machucar, cambalhotas, equilíbrio, levantar-se rapidamente.',
  },
  {
    code: 'arte',
    name: 'Arte',
    attribute: 'int',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 2,
    shortDescription:
      'Criação de esculturas, pinturas, desenhos, livros, contos ou poesias. Escolhe-se um estilo no primeiro nível.',
  },
  {
    code: 'atletismo',
    name: 'Atletismo',
    attribute: 'for',
    trained: false,
    doubleTrained: false,
    armorPenalty: true,
    order: 3,
    shortDescription: 'Corrida, escalada, natação, saltos. Façanhas físicas que dependem de Força.',
  },
  {
    code: 'ciencias_naturais',
    name: 'Ciências Naturais',
    attribute: 'int',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 4,
    shortDescription: 'Conhecimento de Biologia, Herbalismo e Geografia.',
  },
  {
    code: 'concentracao',
    name: 'Concentração',
    attribute: 'int',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 5,
    shortDescription:
      'Manter atenção sob distrações: dano, clima, movimentos bruscos. Crítica para sustentar técnicas.',
  },
  {
    code: 'cultura',
    name: 'Cultura',
    attribute: 'int',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 6,
    shortDescription:
      'Conhecimento geral do mundo: história, religião, nobreza, jutsus, vilas, líderes, clãs.',
  },
  {
    code: 'disfarce',
    name: 'Disfarce',
    attribute: 'int',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 7,
    shortDescription: 'Mudar a aparência para parecer outra pessoa.',
  },
  {
    code: 'escapar',
    name: 'Escapar',
    attribute: 'des',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 8,
    shortDescription: 'Escapar de cordas, redes, algemas ou da manobra Agarrar.',
  },
  {
    code: 'furtividade',
    name: 'Furtividade',
    attribute: 'agi',
    trained: false,
    doubleTrained: false,
    armorPenalty: true,
    order: 9,
    shortDescription:
      'Esconder-se, mover sem barulho, sumir na multidão. Resistido por Prontidão, Procurar ou Rastrear.',
  },
  {
    code: 'intuir_intencoes',
    name: 'Intuir Intenções',
    attribute: 'per',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 10,
    shortDescription:
      'Perceber se alguém está mentindo, intenções ocultas, sentimentos não-ditos.',
  },
  {
    code: 'lidar_com_animais',
    name: 'Lidar com Animais',
    attribute: 'per',
    trained: true,
    doubleTrained: false,
    armorPenalty: false,
    order: 11,
    shortDescription:
      'Conduzir cavalos, treinar cães, domesticar animais selvagens. Requer treinamento.',
  },
  {
    code: 'mecanismos',
    name: 'Mecanismos',
    attribute: 'int',
    trained: true,
    doubleTrained: false,
    armorPenalty: false,
    order: 12,
    shortDescription:
      'Desabilitar, reativar ou sabotar dispositivos mecânicos: fechaduras, armadilhas, veículos. Requer treinamento.',
  },
  {
    code: 'medicina',
    name: 'Medicina',
    attribute: 'int',
    trained: true,
    doubleTrained: false,
    armorPenalty: false,
    order: 13,
    shortDescription:
      'Tratar feridos, estabilizar moribundos, identificar e tratar doenças. Requer treinamento.',
  },
  {
    code: 'obter_informacao',
    name: 'Obter Informação',
    attribute: 'car',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 14,
    shortDescription:
      'Fazer contatos, ouvir rumores, descobrir informações específicas. Atributo social.',
  },
  {
    code: 'ocultismo',
    name: 'Ocultismo',
    attribute: 'int',
    trained: true,
    doubleTrained: false,
    armorPenalty: false,
    order: 15,
    shortDescription:
      'Conhecimento de informações secretas: técnicas proibidas, segredos de clãs. Requer treinamento.',
  },
  {
    code: 'prestidigitacao',
    name: 'Prestidigitação',
    attribute: 'des',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 16,
    shortDescription:
      'Mãos rápidas: roubar, esconder objetos, malabarismo, fintar com técnicas. Realizar selos de mão.',
  },
  {
    code: 'procurar',
    name: 'Procurar',
    attribute: 'per',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 17,
    shortDescription:
      'Vasculhar área para encontrar algo escondido: objetos, pessoas, portas secretas, armadilhas.',
  },
  {
    code: 'prontidao',
    name: 'Prontidão',
    attribute: 'per',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 18,
    shortDescription:
      'Estado de alerta: notar emboscadas, percebimento passivo, reagir a Furtividade.',
  },
  {
    code: 'rastrear',
    name: 'Rastrear',
    attribute: 'per',
    trained: false,
    doubleTrained: false,
    armorPenalty: false,
    order: 19,
    shortDescription:
      'Seguir pegadas, encontrar caminho de quem passou, achar criatura por rastros.',
  },
  {
    code: 'venefico',
    name: 'Venefício',
    attribute: 'int',
    trained: true,
    doubleTrained: true,
    armorPenalty: false,
    order: 20,
    shortDescription:
      'Criar, identificar e usar venenos. Requer aptidão Químico para ser comprada.',
  },
];

export const PERICIA_CODES: ReadonlyArray<string> = PERICIAS.map((p) => p.code);

export function getPericiaByCode(code: string): PericiaDef | undefined {
  return PERICIAS.find((p) => p.code === code);
}

/** Type guard: atributo é um dos 7 primários (não-social). */
export function isPrimaryAttribute(attr: PericiaAttribute): attr is AttributeKey {
  return attr !== 'car' && attr !== 'man';
}
