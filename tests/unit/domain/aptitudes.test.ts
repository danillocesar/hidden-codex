import { describe, expect, it } from 'vitest';
import {
  checkAptitudePrerequisites,
  hasAptitude,
  splitParameterizedAptitude,
} from '@/domain/rules/aptitudes';
import { satsukiNc6 } from './fixtures/satsuki-nc6';
import type { CharacterCore } from '@/domain/types';

/**
 * Fixture extra: Sasuke NC 10 com Mangekyou Sharingan, varios efeitos
 * aprendidos. Usado pra testar pre-reqs avancados (effects, mutuallyExclusive,
 * alternatives, parametrizadas, narrative).
 */
const sasukeMangekyouNc10: CharacterCore = {
  campaignLevel: 10,
  attributes: { for: 4, des: 6, agi: 7, per: 16, int: 8, vig: 8, esp: 10 },
  bases: { cc: 5, cd: 4, esq: 4, lm: 5 },
  pericias: {
    acrobacia: 6,
    atletismo: 4,
    medicina: 4,
    prestidigitacao: 8,
    procurar: 3,
    prontidao: 4,
    rastrear: 3,
  },
  aptitudes: [
    { code: 'sharingan', isFreeFromOrigin: true },
    { code: 'nidan_sharingan', isFreeFromOrigin: false },
    { code: 'sandan_sharingan', isFreeFromOrigin: false },
    { code: 'mangekyou_sharingan', isFreeFromOrigin: false },
    { code: 'fascinar', isFreeFromOrigin: false },
    { code: 'ilusao_profunda', isFreeFromOrigin: false },
    { code: 'perito', parameter: 'medicina', isFreeFromOrigin: false },
    { code: 'usar_arma', parameter: 'katana', isFreeFromOrigin: false },
    { code: 'ataque_poderoso', isFreeFromOrigin: false },
  ],
  powers: [
    { code: 'katon', level: 8 },
    { code: 'ninpou', level: 6 },
    { code: 'mangekyou_sharingan', level: 10 },
  ],
  learnedEffects: ['tsukuyomi', 'amaterasu', 'kagutsuchi'],
  narrativeFlags: ['evento_traumatico', 'controle_total'],
  clan: { code: 'uchiha' },
  kekkeiGenkai: { code: 'sharingan' },
  currentVitality: 80,
  currentChakra: 40,
  socialCarisma: 0,
  socialManipulacao: 0,
};

describe('aptitudes - checkAptitudePrerequisites (legado)', () => {
  it('Satsuki cumpre Acuidade (Des 3)', () => {
    const result = checkAptitudePrerequisites({ attributes: { des: 3 } }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('Satsuki NAO cumpre Forca 3 (For=1)', () => {
    const result = checkAptitudePrerequisites({ attributes: { for: 3 } }, satsukiNc6);
    expect(result.allMet).toBe(false);
    expect(result.checks[0]?.met).toBe(false);
  });

  it('Ambidestria requer CC 12 - Satsuki tem CC base 11, falha', () => {
    const result = checkAptitudePrerequisites({ combatSkills: { cc: 12 } }, satsukiNc6);
    expect(result.allMet).toBe(false);
  });

  it('CC 11 e cumprido', () => {
    const result = checkAptitudePrerequisites({ combatSkills: { cc: 11 } }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('pre-req de pericia: Acrobacia 5', () => {
    const result = checkAptitudePrerequisites({ pericias: { acrobacia: 5 } }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('pre-req de pericia inexistente retorna 0 - falha', () => {
    const result = checkAptitudePrerequisites({ pericias: { medicina: 3 } }, satsukiNc6);
    expect(result.allMet).toBe(false);
  });

  it('pre-req de poder: hyouton 3', () => {
    const result = checkAptitudePrerequisites({ powers: { hyouton: 3 } }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('pre-req de outra aptidao: tem ataque_poderoso', () => {
    const result = checkAptitudePrerequisites(
      { aptitudes: ['ataque_poderoso'] },
      satsukiNc6,
    );
    expect(result.allMet).toBe(true);
  });

  it('pre-req kekkei genkai bate', () => {
    const result = checkAptitudePrerequisites({ kekkeiGenkai: ['hyouton'] }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('pre-req cla bate', () => {
    const result = checkAptitudePrerequisites({ clans: ['yuki'] }, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('combinacao OK retorna allMet true e checks separados', () => {
    const result = checkAptitudePrerequisites(
      { attributes: { des: 3 }, powers: { hyouton: 1 } },
      satsukiNc6,
    );
    expect(result.allMet).toBe(true);
    expect(result.checks).toHaveLength(2);
  });

  it('combinacao parcial: pelo menos 1 falha - allMet false', () => {
    const result = checkAptitudePrerequisites(
      { attributes: { des: 3, for: 5 } },
      satsukiNc6,
    );
    expect(result.allMet).toBe(false);
    expect(result.checks.filter((c) => c.met)).toHaveLength(1);
    expect(result.checks.filter((c) => !c.met)).toHaveLength(1);
  });

  it('prereq vazio e trivialmente met', () => {
    const result = checkAptitudePrerequisites({}, satsukiNc6);
    expect(result.allMet).toBe(true);
    expect(result.checks).toHaveLength(0);
  });

  it('codigo de pericia desconhecido tratado como nivel 0', () => {
    const result = checkAptitudePrerequisites({ pericias: { xpto: 1 } }, satsukiNc6);
    expect(result.allMet).toBe(false);
  });
});

describe('aptitudes - vocabulario expandido (SCHEMA-PATTERNS section 2 + section 3)', () => {
  describe('splitParameterizedAptitude', () => {
    it('split simples: perito_medicina', () => {
      expect(splitParameterizedAptitude('perito_medicina')).toEqual({
        base: 'perito',
        parameter: 'medicina',
      });
    });

    it('parametro com underscore: usar_arma_leque_gigante', () => {
      expect(splitParameterizedAptitude('usar_arma_leque_gigante')).toEqual({
        base: 'usar_arma',
        parameter: 'leque_gigante',
      });
    });

    it('prefixo mais longo ganha: usar_armaduras_pesadas', () => {
      expect(splitParameterizedAptitude('usar_armaduras_pesadas')).toEqual({
        base: 'usar_armaduras',
        parameter: 'pesadas',
      });
    });

    it('code que nao bate com base conhecida retorna null', () => {
      expect(splitParameterizedAptitude('ataque_poderoso')).toBeNull();
    });

    it('code igual a base sem parametro retorna null', () => {
      expect(splitParameterizedAptitude('perito')).toBeNull();
    });
  });

  describe('hasAptitude (parametrizadas)', () => {
    it('match exato', () => {
      expect(hasAptitude('ataque_poderoso', sasukeMangekyouNc10.aptitudes)).toBe(true);
    });

    it('match parametrizado: perito_medicina bate em {perito, medicina}', () => {
      expect(hasAptitude('perito_medicina', sasukeMangekyouNc10.aptitudes)).toBe(true);
    });

    it('parametrizado errado: perito_atletismo nao bate', () => {
      expect(hasAptitude('perito_atletismo', sasukeMangekyouNc10.aptitudes)).toBe(false);
    });

    it('parametrizado: usar_arma_katana bate', () => {
      expect(hasAptitude('usar_arma_katana', sasukeMangekyouNc10.aptitudes)).toBe(true);
    });

    it('aptidao inexistente retorna false', () => {
      expect(hasAptitude('xpto', sasukeMangekyouNc10.aptitudes)).toBe(false);
    });
  });

  describe('attributes_one_of', () => {
    it('passa se UM atributo cumpre', () => {
      const result = checkAptitudePrerequisites(
        { attributes_one_of: { for: 20, des: 5 } },
        satsukiNc6,
      );
      expect(result.allMet).toBe(true);
    });

    it('falha se NENHUM atributo cumpre', () => {
      const result = checkAptitudePrerequisites(
        { attributes_one_of: { for: 20, int: 20 } },
        satsukiNc6,
      );
      expect(result.allMet).toBe(false);
    });
  });

  describe('aptitudes_one_of', () => {
    it('passa se UMA aptidao presente', () => {
      const result = checkAptitudePrerequisites(
        { aptitudes_one_of: ['xpto', 'ataque_poderoso'] },
        satsukiNc6,
      );
      expect(result.allMet).toBe(true);
    });

    it('falha se NENHUMA presente', () => {
      const result = checkAptitudePrerequisites(
        { aptitudes_one_of: ['xpto', 'yzz'] },
        satsukiNc6,
      );
      expect(result.allMet).toBe(false);
    });
  });

  describe('powers_one_of', () => {
    it('passa se UM power cumpre (Record)', () => {
      const result = checkAptitudePrerequisites(
        { powers_one_of: { ninpou: 5, hibon_ninpou: 5 } },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('aceita formato array (nivel 1 implicito)', () => {
      const result = checkAptitudePrerequisites(
        { powers_one_of: ['katon', 'suiton'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('falha se nenhum atende', () => {
      const result = checkAptitudePrerequisites(
        { powers_one_of: { hyouton: 5, suiton: 5 } },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(false);
    });
  });

  describe('clans_one_of', () => {
    it('passa se cla listado bate', () => {
      const result = checkAptitudePrerequisites(
        { clans_one_of: ['uchiha', 'senju'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('falha se cla diferente', () => {
      const result = checkAptitudePrerequisites(
        { clans_one_of: ['hyuuga', 'aburame'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(false);
    });
  });

  describe('effects (techniques aprendidas)', () => {
    it('Susanoo: par Tsukuyomi+Amaterasu aprendidos - met', () => {
      const result = checkAptitudePrerequisites(
        { effects: ['tsukuyomi', 'amaterasu'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('Susanoo: faltando 1 effect - falha', () => {
      const result = checkAptitudePrerequisites(
        { effects: ['kamui_curto', 'kamui_longo'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(false);
    });

    it('char sem learnedEffects: qualquer effect falha', () => {
      const result = checkAptitudePrerequisites(
        { effects: ['tsukuyomi'] },
        satsukiNc6,
      );
      expect(result.allMet).toBe(false);
    });
  });

  describe('narrative', () => {
    it('flag presente - met', () => {
      const result = checkAptitudePrerequisites(
        { narrative: 'evento_traumatico' },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
      expect(result.checks[0]?.manualReview).toBeFalsy();
    });

    it('flag ausente - nao met + manualReview true', () => {
      const result = checkAptitudePrerequisites(
        { narrative: 'sobrevivido_ao_juuin_jutsu' },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(false);
      expect(result.checks[0]?.manualReview).toBe(true);
    });
  });

  describe('mutuallyExclusiveWith', () => {
    it('char NAO tem a aptidao excluida - met', () => {
      const result = checkAptitudePrerequisites(
        { mutuallyExclusiveWith: ['senjutsu'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('char TEM a aptidao excluida - falha', () => {
      const result = checkAptitudePrerequisites(
        { mutuallyExclusiveWith: ['sharingan'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(false);
    });
  });

  describe('incompatibleWith', () => {
    it('mesma semantica de mutuallyExclusiveWith', () => {
      const result = checkAptitudePrerequisites(
        { incompatibleWith: ['ataque_poderoso'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(false);
    });
  });

  describe('alternatives', () => {
    it('Senjutsu Satsuki: nenhum caminho passa - falha', () => {
      const result = checkAptitudePrerequisites(
        {
          alternatives: [
            {
              name: 'kuchiyose',
              powers: { kuchiyose: 8 },
              aptitudes: ['resistencia_maior_vigor'],
            },
            { name: 'mokuton', powers: { mokuton: 8 } },
          ],
        },
        satsukiNc6,
      );
      expect(result.allMet).toBe(false);
    });

    it('Susanoo: 1 das 3 alternativas passa', () => {
      const result = checkAptitudePrerequisites(
        {
          alternatives: [
            { name: 'tsukuyomi_amaterasu', effects: ['tsukuyomi', 'amaterasu'] },
            { name: 'kagutsuchi_amaterasu', effects: ['kagutsuchi', 'amaterasu'] },
            { name: 'kamui', effects: ['kamui_curto', 'kamui_longo'] },
          ],
        },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('alternatives: uma impossivel + uma cumprivel - passa', () => {
      const result = checkAptitudePrerequisites(
        {
          alternatives: [
            { name: 'impossivel', attributes: { for: 30 } },
            { name: 'cumprivel', powers: { katon: 5 } },
          ],
        },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });
  });

  describe('cenarios reais da Fase 7', () => {
    it('Mangekyou: clan + aptidao + atributo + narrative - Sasuke passa', () => {
      const result = checkAptitudePrerequisites(
        {
          clans: ['uchiha'],
          aptitudes: ['sandan_sharingan'],
          attributes: { per: 16 },
          narrative: 'evento_traumatico',
        },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('Hipnose Sharingan: 3 aptidoes - Sasuke passa', () => {
      const result = checkAptitudePrerequisites(
        {
          clans: ['uchiha'],
          aptitudes: ['sandan_sharingan', 'fascinar', 'ilusao_profunda'],
        },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('Kagutsuchi: Mangekyou + Amaterasu effect + Katon 8 - Sasuke passa', () => {
      const result = checkAptitudePrerequisites(
        {
          aptitudes: ['mangekyou_sharingan'],
          effects: ['amaterasu'],
          powers: { katon: 8 },
        },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('Inyu Shomestu: perito_medicina parametrizado - Sasuke passa', () => {
      const result = checkAptitudePrerequisites(
        { aptitudes: ['perito_medicina'] },
        sasukeMangekyouNc10,
      );
      expect(result.allMet).toBe(true);
    });

    it('Inyu Shomestu: Satsuki sem perito_medicina - falha', () => {
      const result = checkAptitudePrerequisites(
        { aptitudes: ['perito_medicina'] },
        satsukiNc6,
      );
      expect(result.allMet).toBe(false);
    });
  });
});
