import { describe, expect, it } from 'vitest';
import {
  checkEffectPrerequisites,
  getAvailableEffects,
  validateEffectSelection,
  type EffectDef,
} from '@/domain/rules/effects';
import { satsukiNc6 } from './fixtures/satsuki-nc6';

const CATALOG: ReadonlyArray<EffectDef> = [
  // Universal — disponivel pra varios poderes elementais
  {
    code: 'canhao',
    name: 'Canhao',
    minLevel: 1,
    availableFor: ['hyouton', 'fuuton', 'suiton', 'katon', 'ninpou'],
  },
  {
    code: 'criar_arma',
    name: 'Criar Arma',
    minLevel: 2,
    availableFor: ['hyouton', 'fuuton', 'suiton'],
  },
  {
    code: 'nevoa',
    name: 'Nevoa',
    minLevel: 1,
    availableFor: ['suiton', 'hyouton'],
  },
  // Avancado com prereq de aptidao
  {
    code: 'avancada_gelo',
    name: 'Tecnica Avancada de Gelo',
    minLevel: 3,
    availableFor: ['hyouton'],
    rules: { prerequisites: { aptitudes: ['acuidade'] } },
  },
  // Soh Katon
  {
    code: 'bola_fogo',
    name: 'Bola de Fogo',
    minLevel: 1,
    availableFor: ['katon'],
  },
];

describe('getAvailableEffects', () => {
  it('retorna so efeitos com availableFor incluindo o poder', () => {
    const list = getAvailableEffects(CATALOG, 'katon', 5);
    expect(list.map((e) => e.code)).toEqual(['canhao', 'bola_fogo']);
  });

  it('filtra por minLevel <= nivel do poder', () => {
    const list = getAvailableEffects(CATALOG, 'hyouton', 1);
    expect(list.map((e) => e.code).sort()).toEqual(['canhao', 'nevoa']);
  });

  it('inclui efeitos mais avancados quando nivel sobe', () => {
    const list = getAvailableEffects(CATALOG, 'hyouton', 3);
    expect(list.map((e) => e.code).sort()).toEqual([
      'avancada_gelo',
      'canhao',
      'criar_arma',
      'nevoa',
    ]);
  });

  it('retorna vazio pra poder sem efeitos', () => {
    expect(getAvailableEffects(CATALOG, 'doton', 5)).toEqual([]);
  });
});

describe('checkEffectPrerequisites', () => {
  it('aprova quando nao ha prereq', () => {
    const effect = CATALOG.find((e) => e.code === 'canhao')!;
    const result = checkEffectPrerequisites(effect, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('aprova quando aptidao requirida esta presente', () => {
    const effect = CATALOG.find((e) => e.code === 'avancada_gelo')!;
    // Satsuki tem acuidade
    const result = checkEffectPrerequisites(effect, satsukiNc6);
    expect(result.allMet).toBe(true);
  });

  it('reprova quando aptidao requirida esta ausente', () => {
    const effect: EffectDef = {
      code: 'precisa_quimico',
      name: 'Veneno Especial',
      minLevel: 1,
      availableFor: ['ninpou'],
      rules: { prerequisites: { aptitudes: ['quimico'] } },
    };
    const result = checkEffectPrerequisites(effect, satsukiNc6);
    expect(result.allMet).toBe(false);
  });
});

describe('validateEffectSelection', () => {
  const baseArgs = {
    characterPowers: satsukiNc6.powers,
    catalog: CATALOG,
    character: satsukiNc6,
  };

  it('aprova quando todos os poderes tem N efeitos validos', () => {
    const result = validateEffectSelection({
      ...baseArgs,
      selectedByPower: {
        hyouton: ['canhao', 'nevoa', 'avancada_gelo'],
        suiton: ['canhao', 'nevoa'],
        fuuton: ['canhao'],
      },
    });
    expect(result).toEqual({ ok: true });
  });

  it('reprova quando slots vazios', () => {
    const result = validateEffectSelection({
      ...baseArgs,
      selectedByPower: {
        hyouton: ['canhao', 'nevoa'], // 2 de 3
        suiton: ['canhao', 'nevoa'],
        fuuton: ['canhao'],
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/2\/3/);
  });

  it('reprova quando efeito nao esta no catalogo', () => {
    const result = validateEffectSelection({
      ...baseArgs,
      selectedByPower: {
        hyouton: ['canhao', 'nevoa', 'inexistente'],
        suiton: ['canhao', 'nevoa'],
        fuuton: ['canhao'],
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/inexistente/);
  });

  it('reprova quando efeito nao esta em availableFor do poder', () => {
    const result = validateEffectSelection({
      ...baseArgs,
      selectedByPower: {
        hyouton: ['canhao', 'nevoa', 'bola_fogo'], // bola_fogo so katon
        suiton: ['canhao', 'nevoa'],
        fuuton: ['canhao'],
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/bola_fogo/);
  });

  it('reprova quando minLevel maior que nivel atual do poder', () => {
    const result = validateEffectSelection({
      ...baseArgs,
      selectedByPower: {
        hyouton: ['canhao', 'nevoa', 'avancada_gelo'],
        suiton: ['canhao', 'criar_arma'], // criar_arma exige nivel 2, suiton ta nivel 2 → ok
        fuuton: ['criar_arma'], // criar_arma exige 2, fuuton nivel 1 → erro
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/criar_arma.*nivel >= 2/);
  });

  it('reprova quando duplicata no mesmo poder', () => {
    const result = validateEffectSelection({
      ...baseArgs,
      selectedByPower: {
        hyouton: ['canhao', 'canhao', 'nevoa'],
        suiton: ['canhao', 'nevoa'],
        fuuton: ['canhao'],
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/duplicado/);
  });

  it('reprova quando prereq de efeito falha', () => {
    // Satsuki nao tem aptidao "quimico"
    const catalogWithQuimico: EffectDef[] = [
      ...CATALOG,
      {
        code: 'veneno_canhao',
        name: 'Canhao Toxico',
        minLevel: 1,
        availableFor: ['hyouton'],
        rules: { prerequisites: { aptitudes: ['quimico'] } },
      },
    ];
    const result = validateEffectSelection({
      ...baseArgs,
      catalog: catalogWithQuimico,
      selectedByPower: {
        hyouton: ['canhao', 'nevoa', 'veneno_canhao'],
        suiton: ['canhao', 'nevoa'],
        fuuton: ['canhao'],
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/veneno_canhao/);
  });

  it('aceita poder sem efeitos quando level === 0 (caso de borda)', () => {
    const result = validateEffectSelection({
      characterPowers: [{ code: 'hyouton', level: 0 }],
      selectedByPower: {},
      catalog: CATALOG,
      character: satsukiNc6,
    });
    expect(result).toEqual({ ok: true });
  });
});
