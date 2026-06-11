import { describe, expect, it } from 'vitest';
import { mapViewModelToWizardState } from '@/lib/character/mapViewModelToWizardState';
import { createCharacterInputSchema } from '@/schemas/character/create';
import type { CharacterViewModel } from '@/lib/character/mapPrismaToCore';

/**
 * Constroi um CharacterViewModel minimo cobrindo apenas os campos que o mapper
 * de hidratacao le. Casts pontuais evitam montar os Maps de `lookup` (irrelevantes
 * pra este mapper).
 */
function buildViewModel(overrides: {
  core?: Partial<CharacterViewModel['core']>;
  display?: Partial<CharacterViewModel['display']>;
}): CharacterViewModel {
  const core = {
    campaignLevel: 6,
    attributes: { for: 4, des: 3, agi: 3, per: 2, int: 2, vig: 5, esp: 5 },
    bases: { cc: 3, cd: 3, esq: 3, lm: 3 },
    pericias: { acrobacia: 3, atletismo: 2 },
    aptitudes: [
      { code: 'reflexos_de_combate', parameter: undefined, isFreeFromOrigin: false },
      { code: 'congelamento', parameter: undefined, isFreeFromOrigin: true },
      { code: 'usar_arma', parameter: 'katana', isFreeFromOrigin: false },
    ],
    powers: [
      { code: 'hyouton', level: 4 },
      { code: 'fuuton', level: 1 },
    ],
    learnedEffects: ['canhao_de_gelo'],
    narrativeFlags: [],
    clan: { code: 'yuki' },
    kekkeiGenkai: { code: 'hyouton' },
    currentVitality: 30,
    currentChakra: 25,
    socialCarisma: 0,
    socialManipulacao: 0,
    ...overrides.core,
  } as CharacterViewModel['core'];

  const display = {
    id: 'char-1',
    name: 'Satsuki Yuki',
    age: 16,
    gender: 'Feminino',
    rank: 'GENIN',
    size: 'MEDIUM',
    tendency: null,
    biography: 'bio',
    portraitUrl: null,
    isOwner: true,
    clanName: 'Yuki',
    clanCode: 'yuki',
    villageName: 'Kirigakure',
    villageCode: 'kiri',
    kekkeiGenkaiName: 'Hyouton',
    kekkeiGenkaiCode: 'hyouton',
    freePowerLevels: { fuuton: 1, suiton: 1 },
    freeAptitudeCodes: ['congelamento'],
    sectionCovers: {},
    sectionCoverPositions: {},
    sectionCoverZooms: {},
    fichaBackground: null,
    images: [],
    uiState: {},
    inventory: [],
    equippedWeapons: [],
    jutsus: [],
    effectsByPowerCode: {
      hyouton: [{ code: 'canhao_de_gelo', name: 'Canhão de Gelo', minLevel: 1, scaling: true }],
    },
    ...overrides.display,
  } as unknown as CharacterViewModel['display'];

  return { core, display, lookup: {} as CharacterViewModel['lookup'] };
}

describe('mapViewModelToWizardState', () => {
  it('produz um input valido pelo schema de criacao (round-trip)', () => {
    const input = mapViewModelToWizardState(buildViewModel({}));
    const parsed = createCharacterInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('exclui aptidoes gratis da origem e mantem as pagas (sem double-count)', () => {
    const input = mapViewModelToWizardState(buildViewModel({}));
    const codes = input.aptitudes.map((a) => a.code);
    expect(codes).toContain('reflexos_de_combate');
    expect(codes).toContain('usar_arma');
    expect(codes).not.toContain('congelamento'); // free → re-adicionada server-side
  });

  it('preserva parametro de aptidao parametrizada', () => {
    const input = mapViewModelToWizardState(buildViewModel({}));
    const arma = input.aptitudes.find((a) => a.code === 'usar_arma');
    expect(arma?.parameter).toBe('katana');
  });

  it('mantem o nivel TOTAL dos poderes (nao subtrai niveis gratis)', () => {
    const input = mapViewModelToWizardState(buildViewModel({}));
    expect(input.powers).toEqual([
      { code: 'hyouton', level: 4 },
      { code: 'fuuton', level: 1 },
    ]);
  });

  it('reconstroi effectsByPower a partir de effectsByPowerCode', () => {
    const input = mapViewModelToWizardState(buildViewModel({}));
    expect(input.effectsByPower).toEqual({ hyouton: ['canhao_de_gelo'] });
  });

  it('deixa o inventario de fora (gerido na ficha)', () => {
    const input = mapViewModelToWizardState(buildViewModel({}));
    expect(input.inventory).toEqual([]);
  });

  it('cla canonico → customClanName null; cla custom → code null + nome preenchido', () => {
    const canonical = mapViewModelToWizardState(buildViewModel({}));
    expect(canonical.identity.clanCode).toBe('yuki');
    expect(canonical.identity.customClanName).toBeNull();

    const custom = mapViewModelToWizardState(
      buildViewModel({
        display: { clanCode: null, clanName: 'Clã Inventado' },
      }),
    );
    expect(custom.identity.clanCode).toBeNull();
    expect(custom.identity.customClanName).toBe('Clã Inventado');
    // Sem ambos setados (schema proibe) — validacao deve passar.
    expect(createCharacterInputSchema.safeParse(custom).success).toBe(true);
  });

  it('vila custom → code null + customVillageName preenchido', () => {
    const custom = mapViewModelToWizardState(
      buildViewModel({
        display: { villageCode: null, villageName: 'Vila X' },
      }),
    );
    expect(custom.identity.villageCode).toBeNull();
    expect(custom.identity.customVillageName).toBe('Vila X');
  });
});
