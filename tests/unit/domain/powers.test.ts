import { describe, expect, it } from 'vitest';
import {
  calculateAptitudeCost,
  calculateTotalPowerCost,
  validatePowersAndAptitudes,
} from '@/domain/rules/powers';
import { getFreePowerLevelsFromOrigin } from '@/domain/rules/helpers';
import { satsukiNc6 } from './fixtures/satsuki-nc6';

describe('powers — calculateTotalPowerCost', () => {
  it('Satsuki: hyouton 3 + suiton 2 (-1 free) + fuuton 1 (-1 free) = 4', () => {
    const free = getFreePowerLevelsFromOrigin(satsukiNc6);
    const cost = calculateTotalPowerCost(satsukiNc6.powers, free);
    expect(cost).toBe(4); // 3 + 1 + 0
  });

  it('poder sem níveis grátis: custo = level', () => {
    expect(calculateTotalPowerCost([{ code: 'katon', level: 3 }], {})).toBe(3);
  });

  it('níveis grátis maiores que o investido não geram crédito', () => {
    // fuuton level 1, mas o personagem tem 2 níveis grátis: max(0, 1 - 2) = 0
    const cost = calculateTotalPowerCost([{ code: 'fuuton', level: 1 }], { fuuton: 2 });
    expect(cost).toBe(0);
  });
});

describe('powers — calculateAptitudeCost', () => {
  it('só aptidões pagas contam', () => {
    expect(calculateAptitudeCost(satsukiNc6.aptitudes)).toBe(4); // 2 pagas × 2pts
  });

  it('todas grátis = 0', () => {
    expect(
      calculateAptitudeCost([
        { code: 'a', isFreeFromOrigin: true },
        { code: 'b', isFreeFromOrigin: true },
      ]),
    ).toBe(0);
  });

  it('FREE_STARTING_APTITUDES (3) desconta as N primeiras pagas — Satsuki sai grátis', () => {
    // Satsuki tem 2 pagas. Com freeStartingCount=3, ambas viram grátis.
    expect(calculateAptitudeCost(satsukiNc6.aptitudes, 3)).toBe(0);
  });

  it('freeStartingCount=3 com 5 pagas: 2 viram billable = 4 pts', () => {
    const apts = Array.from({ length: 5 }, (_, i) => ({
      code: `apt_${i}`,
      isFreeFromOrigin: false,
    }));
    expect(calculateAptitudeCost(apts, 3)).toBe(4);
  });

  it('freeStartingCount NAO consome aptidões de origem', () => {
    // 3 de origem + 2 pagas, freeStartingCount=3 → as 2 pagas viram grátis (0 pts)
    const apts = [
      { code: 'a', isFreeFromOrigin: true },
      { code: 'b', isFreeFromOrigin: true },
      { code: 'c', isFreeFromOrigin: true },
      { code: 'd', isFreeFromOrigin: false },
      { code: 'e', isFreeFromOrigin: false },
    ];
    expect(calculateAptitudeCost(apts, 3)).toBe(0);
  });
});

describe('powers — validatePowersAndAptitudes', () => {
  it('Satsuki NC 6: cabe no orçamento 8 (4 poder + 4 aptidão)', () => {
    const result = validatePowersAndAptitudes({
      characterPowers: satsukiNc6.powers,
      aptitudes: satsukiNc6.aptitudes,
      freeLevelsByPower: getFreePowerLevelsFromOrigin(satsukiNc6),
      nc: 6,
    });
    expect(result.ok).toBe(true);
  });

  it('poder acima do limite NC: rejeita', () => {
    // NC 6, limite = 3. hyouton 4 → erro.
    const result = validatePowersAndAptitudes({
      characterPowers: [{ code: 'hyouton', level: 4 }],
      aptitudes: [],
      freeLevelsByPower: {},
      nc: 6,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/excede limite/);
  });

  it('total acima do orçamento: rejeita', () => {
    // 5 aptidões pagas × 2 = 10 pts. NC 6 só dá 8.
    const result = validatePowersAndAptitudes({
      characterPowers: [],
      aptitudes: [
        { code: 'a', isFreeFromOrigin: false },
        { code: 'b', isFreeFromOrigin: false },
        { code: 'c', isFreeFromOrigin: false },
        { code: 'd', isFreeFromOrigin: false },
        { code: 'e', isFreeFromOrigin: false },
      ],
      freeLevelsByPower: {},
      nc: 6,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/orçamento/);
  });

  it('nível negativo é rejeitado', () => {
    const result = validatePowersAndAptitudes({
      characterPowers: [{ code: 'hyouton', level: -1 }],
      aptitudes: [],
      freeLevelsByPower: {},
      nc: 6,
    });
    expect(result.ok).toBe(false);
  });

  it('nível não-inteiro é rejeitado', () => {
    const result = validatePowersAndAptitudes({
      characterPowers: [{ code: 'hyouton', level: 2.5 }],
      aptitudes: [],
      freeLevelsByPower: {},
      nc: 6,
    });
    expect(result.ok).toBe(false);
  });
});

describe('helpers — getFreeAptitudesFromOrigin', () => {
  it('retorna a lista do clã', async () => {
    const { getFreeAptitudesFromOrigin } = await import('@/domain/rules/helpers');
    expect(
      getFreeAptitudesFromOrigin({
        clan: { code: 'yuki', freeAptitudes: ['acuidade', 'especialista_katana'] },
      }),
    ).toEqual(['acuidade', 'especialista_katana']);
  });

  it('sem clã retorna lista vazia', async () => {
    const { getFreeAptitudesFromOrigin } = await import('@/domain/rules/helpers');
    expect(getFreeAptitudesFromOrigin({})).toEqual([]);
  });

  it('clã sem freeAptitudes retorna lista vazia', async () => {
    const { getFreeAptitudesFromOrigin } = await import('@/domain/rules/helpers');
    expect(getFreeAptitudesFromOrigin({ clan: { code: 'x' } })).toEqual([]);
  });
});

describe('helpers — getFreePowerLevelsFromOrigin', () => {
  it('soma kekkei + clan grátis', () => {
    const result = getFreePowerLevelsFromOrigin({
      clan: { code: 'yuki', freePowers: [{ code: 'hyouton', level: 1 }] },
      kekkeiGenkai: {
        code: 'hyouton',
        freePowerLevelsByElement: { fuuton: 1, suiton: 1 },
      },
    });
    expect(result).toEqual({ fuuton: 1, suiton: 1, hyouton: 1 });
  });

  it('sem clan/kekkei retorna objeto vazio', () => {
    expect(getFreePowerLevelsFromOrigin({})).toEqual({});
  });

  it('clan sobreposto a kekkei acumula', () => {
    const result = getFreePowerLevelsFromOrigin({
      clan: { code: 'x', freePowers: [{ code: 'hyouton', level: 2 }] },
      kekkeiGenkai: {
        code: 'hyouton',
        freePowerLevelsByElement: { hyouton: 1 },
      },
    });
    expect(result.hyouton).toBe(3);
  });
});
