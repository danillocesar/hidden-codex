import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────
const getCurrentUser = vi.fn();
vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: () => getCurrentUser(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const characterFindFirst = vi.fn();
const characterUpdate = vi.fn();
const jutsuFindFirst = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    character: {
      findFirst: (args: unknown) => characterFindFirst(args),
      update: (args: unknown) => characterUpdate(args),
    },
    characterJutsu: {
      findFirst: (args: unknown) => jutsuFindFirst(args),
    },
  },
}));

import { adjustChakra, adjustVitality, useJutsu } from '@/server/actions/characters/combat';

const CHAR_ID = '11111111-1111-1111-1111-111111111111';
const JUTSU_ID = '22222222-2222-2222-2222-222222222222';
// Satsuki-like: Vig 1, Esp 3, NC 6 → maxVit = 10+3+30 = 43, maxChk = 10+9 = 19
const BASE_CHAR = {
  id: CHAR_ID,
  currentVitality: 43,
  currentChakra: 19,
  attrVig: 1,
  attrEsp: 3,
  campaignLevel: 6,
};

beforeEach(() => {
  getCurrentUser.mockReset();
  characterFindFirst.mockReset();
  characterUpdate.mockReset();
  jutsuFindFirst.mockReset();
  getCurrentUser.mockResolvedValue({ user: { id: 'user-1' } });
  characterFindFirst.mockResolvedValue({ ...BASE_CHAR });
  characterUpdate.mockResolvedValue({});
  jutsuFindFirst.mockResolvedValue({ id: JUTSU_ID });
});

describe('useJutsu', () => {
  it('debita o custo de chakra e retorna o novo total', async () => {
    const res = await useJutsu({ characterId: CHAR_ID, jutsuId: JUTSU_ID, chakraCost: 3 });
    expect(res).toEqual({ ok: true, chakra: 16 });
    expect(characterUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { currentChakra: 16 } }),
    );
  });

  it('recusa quando o chakra é insuficiente', async () => {
    characterFindFirst.mockResolvedValue({ ...BASE_CHAR, currentChakra: 2 });
    const res = await useJutsu({ characterId: CHAR_ID, chakraCost: 3 });
    expect(res.ok).toBe(false);
    expect(characterUpdate).not.toHaveBeenCalled();
  });

  it('recusa quando não autenticado', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await useJutsu({ characterId: CHAR_ID, chakraCost: 1 });
    expect(res).toEqual({ ok: false, error: 'Nao autenticado.' });
  });

  it('recusa quando o jutsu não pertence à ficha', async () => {
    jutsuFindFirst.mockResolvedValue(null);
    const res = await useJutsu({ characterId: CHAR_ID, jutsuId: JUTSU_ID, chakraCost: 1 });
    expect(res.ok).toBe(false);
    expect(characterUpdate).not.toHaveBeenCalled();
  });

  it('valida input (custo negativo)', async () => {
    const res = await useJutsu({ characterId: CHAR_ID, chakraCost: -1 });
    expect(res.ok).toBe(false);
  });
});

describe('adjustVitality', () => {
  it('aplica dano e classifica status normal', async () => {
    const res = await adjustVitality({ characterId: CHAR_ID, delta: -8 });
    expect(res).toEqual({ ok: true, vitality: 35, status: 'normal' });
  });

  it('dano fatal classifica como morto', async () => {
    characterFindFirst.mockResolvedValue({ ...BASE_CHAR, currentVitality: 5 });
    const res = await adjustVitality({ characterId: CHAR_ID, delta: -30 });
    expect(res).toEqual({ ok: true, vitality: -25, status: 'dead' });
  });

  it('cura clampa no máximo recalculado (43)', async () => {
    characterFindFirst.mockResolvedValue({ ...BASE_CHAR, currentVitality: 40 });
    const res = await adjustVitality({ characterId: CHAR_ID, delta: 20 });
    expect(res).toEqual({ ok: true, vitality: 43, status: 'normal' });
  });
});

describe('adjustChakra', () => {
  it('gasta chakra avulso', async () => {
    const res = await adjustChakra({ characterId: CHAR_ID, delta: -5 });
    expect(res).toEqual({ ok: true, chakra: 14 });
  });

  it('recusa gasto insuficiente', async () => {
    characterFindFirst.mockResolvedValue({ ...BASE_CHAR, currentChakra: 2 });
    const res = await adjustChakra({ characterId: CHAR_ID, delta: -5 });
    expect(res.ok).toBe(false);
    expect(characterUpdate).not.toHaveBeenCalled();
  });

  it('restaura clampando no máximo (19)', async () => {
    characterFindFirst.mockResolvedValue({ ...BASE_CHAR, currentChakra: 15 });
    const res = await adjustChakra({ characterId: CHAR_ID, delta: 10 });
    expect(res).toEqual({ ok: true, chakra: 19 });
  });
});
