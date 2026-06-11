import { describe, expect, it } from 'vitest';
import { applyOriginBenefits } from '@/lib/character/applyOriginBenefits';

describe('applyOriginBenefits', () => {
  it('Yuki + Hyouton concede +1 Fuuton e +1 Suiton, mainPower=hyouton', () => {
    const result = applyOriginBenefits({
      clan: {
        code: 'yuki',
        benefits: {
          kekkeiGenkai: 'hyouton',
          restrictedAptitudes: ['selos_especiais', 'congelamento'],
          restrictedPowers: ['hyouton'],
        },
      },
      kekkeiGenkai: {
        code: 'hyouton',
        benefits: {
          mainPowerCode: 'hyouton',
          freePowerLevelsByElement: { fuuton: 1, suiton: 1 },
          restrictedElements: ['hyouton', 'suiton', 'fuuton'],
        },
      },
      village: {
        code: 'kiri',
        benefits: { freeAptitudes: [], associatedClans: ['yuki', 'hoshigaki', 'houzuki'] },
      },
    });

    expect(result.freePowerLevels).toEqual({ fuuton: 1, suiton: 1 });
    expect(result.kekkeiGenkaiMainPowerCode).toBe('hyouton');
    expect(result.effectiveKekkeiGenkaiCode).toBe('hyouton');
    // Cla Yuki nao concede aptidoes gratuitas — restrictedAptitudes NAO entra.
    expect(result.freeAptitudeCodes).toEqual([]);
  });

  it('cla Yuki sem KG explicito deriva KG=hyouton via benefits.kekkeiGenkai', () => {
    const result = applyOriginBenefits({
      clan: {
        code: 'yuki',
        benefits: { kekkeiGenkai: 'hyouton', restrictedPowers: ['hyouton'] },
      },
      kekkeiGenkai: null,
      village: null,
    });

    expect(result.effectiveKekkeiGenkaiCode).toBe('hyouton');
    // Sem KG carregado, nao temos benefits do KG — sem niveis gratis.
    expect(result.freePowerLevels).toEqual({});
    expect(result.kekkeiGenkaiMainPowerCode).toBeNull();
  });

  it('KG explicito tem prioridade sobre KG derivada do cla', () => {
    const result = applyOriginBenefits({
      clan: { code: 'yuki', benefits: { kekkeiGenkai: 'hyouton' } },
      kekkeiGenkai: {
        code: 'sharingan',
        benefits: { mainPowerCode: 'sharingan' },
      },
      village: null,
    });

    expect(result.effectiveKekkeiGenkaiCode).toBe('sharingan');
    expect(result.kekkeiGenkaiMainPowerCode).toBe('sharingan');
  });

  it('personagem sem cla nem KG retorna beneficios vazios', () => {
    const result = applyOriginBenefits({
      clan: null,
      kekkeiGenkai: null,
      village: { code: 'konoha', benefits: { freeAptitudes: [] } },
    });

    expect(result.freeAptitudeCodes).toEqual([]);
    expect(result.freePowerLevels).toEqual({});
    expect(result.kekkeiGenkaiMainPowerCode).toBeNull();
    expect(result.effectiveKekkeiGenkaiCode).toBeNull();
  });

  it('uniao de freeAptitudes de vila + KG.linkedAptitudes (dedup + sort)', () => {
    const result = applyOriginBenefits({
      clan: null,
      kekkeiGenkai: {
        code: 'fake_kg',
        benefits: { linkedAptitudes: ['zeta', 'alpha'] },
      },
      village: {
        code: 'fake_village',
        benefits: { freeAptitudes: ['alpha', 'beta'] },
      },
    });

    expect(result.freeAptitudeCodes).toEqual(['alpha', 'beta', 'zeta']);
  });

  it('benefits JSON malformado nao quebra (defensive parsing)', () => {
    const result = applyOriginBenefits({
      clan: { code: 'x', benefits: 'string-invalida' as unknown as null },
      kekkeiGenkai: { code: 'y', benefits: 42 as unknown as null },
      village: { code: 'z', benefits: null },
    });

    expect(result).toEqual({
      freeAptitudeCodes: [],
      freePowerLevels: {},
      kekkeiGenkaiMainPowerCode: null,
      effectiveKekkeiGenkaiCode: 'y',
    });
  });

  it('freePowerLevelsByElement com valor invalido (0/negativo/non-int) e ignorado', () => {
    const result = applyOriginBenefits({
      clan: null,
      kekkeiGenkai: {
        code: 'kg',
        benefits: {
          freePowerLevelsByElement: { fuuton: 1, suiton: 0, raiton: -2, doton: 1.5, valida: 3 },
        },
      },
      village: null,
    });

    expect(result.freePowerLevels).toEqual({ fuuton: 1, valida: 3 });
  });
});
