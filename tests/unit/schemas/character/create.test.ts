import { describe, expect, it } from 'vitest';
import { createCharacterInputSchema } from '@/schemas/character/create';

const validSatsukiInput = {
  identity: {
    name: 'Satsuki Yuki',
    age: 16,
    gender: 'feminino',
    campaignLevel: 6,
    villageCode: 'kiri',
    customVillageName: null,
    clanCode: 'yuki',
    customClanName: null,
    kekkeiGenkaiCode: 'hyouton',
  },
  attributes: { for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 },
  bases: { cc: 5, cd: 3, esq: 3, lm: 1 },
  pericias: {
    acrobacia: 2,
    atletismo: 2,
    escapar: 2,
    furtividade: 2,
    prestidigitacao: 2,
    procurar: 2,
    prontidao: 2,
    rastrear: 2,
  },
  powers: [
    { code: 'hyouton', level: 3 },
    { code: 'suiton', level: 2 },
    { code: 'fuuton', level: 1 },
  ],
  aptitudes: [
    { code: 'especialista_katana' },
    { code: 'acuidade' },
    { code: 'ataque_poderoso' },
    { code: 'velocista' },
    { code: 'lutar_as_cegas' },
  ],
};

describe('createCharacterInputSchema', () => {
  it('aceita input canonico de Satsuki NC 6', () => {
    const parsed = createCharacterInputSchema.safeParse(validSatsukiInput);
    expect(parsed.success).toBe(true);
  });

  it('rejeita NC abaixo de 4', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      identity: { ...validSatsukiInput.identity, campaignLevel: 3 },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita NC acima do cap', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      identity: { ...validSatsukiInput.identity, campaignLevel: 31 },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita nome vazio', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      identity: { ...validSatsukiInput.identity, name: '   ' },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita pericia desconhecida', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      pericias: { ...validSatsukiInput.pericias, periciaInventada: 3 },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita ter villageCode E customVillageName ao mesmo tempo', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      identity: {
        ...validSatsukiInput.identity,
        villageCode: 'konoha',
        customVillageName: 'Vila do Sol',
      },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita ter clanCode E customClanName ao mesmo tempo', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      identity: {
        ...validSatsukiInput.identity,
        clanCode: 'yuki',
        customClanName: 'Cla Inventado',
      },
    });
    expect(parsed.success).toBe(false);
  });

  it('aceita customVillageName quando villageCode e null', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      identity: {
        ...validSatsukiInput.identity,
        villageCode: null,
        customVillageName: 'Vila do Sol',
      },
    });
    expect(parsed.success).toBe(true);
  });

  it('aceita personagem sem cla, KG e vila', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      identity: {
        name: 'Ronin sem origem',
        age: 30,
        gender: null,
        campaignLevel: 4,
        villageCode: null,
        customVillageName: null,
        clanCode: null,
        customClanName: null,
        kekkeiGenkaiCode: null,
      },
      powers: [],
      aptitudes: [],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita poder com nivel 0', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      powers: [{ code: 'hyouton', level: 0 }],
    });
    expect(parsed.success).toBe(false);
  });

  it('aceita aptidao parametrizada (perito_medicina)', () => {
    const parsed = createCharacterInputSchema.safeParse({
      ...validSatsukiInput,
      aptitudes: [{ code: 'perito', parameter: 'medicina' }],
    });
    expect(parsed.success).toBe(true);
  });
});
