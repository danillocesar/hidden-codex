'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  spendChakra,
  takeDamage,
  heal,
  restoreChakra as restoreChakraRule,
  type DamageStatus,
} from '@/domain/rules/combat';
import { calculateMaxVitality, calculateMaxChakra } from '@/domain/rules/derivedStats';

/**
 * Ações de mesa (Fase 4): usar jutsu, tomar dano, curar, restaurar chakra.
 *
 * Todas são owner-only e **recalculam os máximos no servidor** a partir dos
 * atributos do personagem (defesa em profundidade — o client pode mentir). O
 * número exato debitado/aplicado vem do client (resultado da calculadora), mas
 * é validado como inteiro razoável e os limites (chakra ≥ 0, vit ≤ max) são
 * impostos aqui pelo motor.
 */
export type CombatActionResult =
  | { ok: true; vitality?: number; chakra?: number; status?: DamageStatus }
  | { ok: false; error: string };

/** Campos mínimos do personagem pra recalcular limites e energias atuais. */
const ENERGY_SELECT = {
  id: true,
  currentVitality: true,
  currentChakra: true,
  attrVig: true,
  attrEsp: true,
  campaignLevel: true,
} as const;

type OwnedCharacter = {
  id: string;
  currentVitality: number;
  currentChakra: number;
  attrVig: number;
  attrEsp: number;
  campaignLevel: number;
};

async function loadOwnedCharacter(
  characterId: string,
): Promise<{ ok: true; character: OwnedCharacter } | { ok: false; error: string }> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: 'Nao autenticado.' };

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: ENERGY_SELECT,
  });
  if (!character) return { ok: false, error: 'Ficha nao encontrada.' };
  return { ok: true, character };
}

const useJutsuInput = z.object({
  characterId: z.string().uuid(),
  /** Provenance opcional — confirma que o jutsu pertence à ficha. */
  jutsuId: z.string().uuid().nullable().optional(),
  chakraCost: z.number().int().min(0).max(999),
});

export type UseJutsuInput = z.infer<typeof useJutsuInput>;

/**
 * Debita o custo de chakra de um uso de jutsu. Recusa se o chakra atual for
 * insuficiente (regra `spendChakra`). Não recalcula o custo — confia no valor
 * da calculadora, mas o impõe pelo motor (sem chakra negativo).
 */
export async function useJutsu(raw: UseJutsuInput): Promise<CombatActionResult> {
  const parsed = useJutsuInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const input = parsed.data;

  const loaded = await loadOwnedCharacter(input.characterId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { character } = loaded;

  if (input.jutsuId) {
    const owns = await prisma.characterJutsu.findFirst({
      where: { id: input.jutsuId, characterId: character.id },
      select: { id: true },
    });
    if (!owns) return { ok: false, error: 'Jutsu não pertence a este personagem.' };
  }

  const result = spendChakra(character.currentChakra, input.chakraCost);
  if (!result.ok) return { ok: false, error: result.error };

  await prisma.character.update({
    where: { id: character.id },
    data: { currentChakra: result.newChakra },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true, chakra: result.newChakra };
}

const adjustVitalityInput = z.object({
  characterId: z.string().uuid(),
  /** Negativo = tomar dano; positivo = curar. */
  delta: z.number().int().min(-999).max(999),
  /** Marca o dano como crítico (caller decide aplicar sangrando). */
  isCritical: z.boolean().optional(),
});

export type AdjustVitalityInput = z.infer<typeof adjustVitalityInput>;

/**
 * Aplica dano (delta < 0) ou cura (delta > 0) na vitalidade. Dano usa
 * `takeDamage` (vit pode ir negativa, classifica status); cura usa `heal`
 * (clampa no máximo recalculado). Retorna a nova vitalidade e o status.
 */
export async function adjustVitality(raw: AdjustVitalityInput): Promise<CombatActionResult> {
  const parsed = adjustVitalityInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const input = parsed.data;

  const loaded = await loadOwnedCharacter(input.characterId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { character } = loaded;

  const maxVitality = calculateMaxVitality(character.attrVig, character.campaignLevel);

  let newVitality: number;
  let status: DamageStatus;
  if (input.delta < 0) {
    const result = takeDamage(character.currentVitality, -input.delta, input.isCritical ?? false);
    newVitality = result.newVitality;
    status = result.status;
  } else {
    newVitality = heal(character.currentVitality, maxVitality, input.delta);
    status = 'normal';
  }

  await prisma.character.update({
    where: { id: character.id },
    data: { currentVitality: newVitality },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true, vitality: newVitality, status };
}

const adjustChakraInput = z.object({
  characterId: z.string().uuid(),
  /** Negativo = gastar; positivo = restaurar. */
  delta: z.number().int().min(-999).max(999),
});

export type AdjustChakraInput = z.infer<typeof adjustChakraInput>;

/**
 * Gasta (delta < 0, recusa se insuficiente) ou restaura (delta > 0, clampa no
 * máximo) chakra avulso — usado pela barra de energia fora do fluxo de jutsu.
 */
export async function adjustChakra(raw: AdjustChakraInput): Promise<CombatActionResult> {
  const parsed = adjustChakraInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const input = parsed.data;

  const loaded = await loadOwnedCharacter(input.characterId);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { character } = loaded;

  const maxChakra = calculateMaxChakra(character.attrEsp);

  let newChakra: number;
  if (input.delta < 0) {
    const result = spendChakra(character.currentChakra, -input.delta);
    if (!result.ok) return { ok: false, error: result.error };
    newChakra = result.newChakra;
  } else {
    newChakra = restoreChakraRule(character.currentChakra, maxChakra, input.delta);
  }

  await prisma.character.update({
    where: { id: character.id },
    data: { currentChakra: newChakra },
  });

  revalidatePath(`/characters/${character.id}`);
  return { ok: true, chakra: newChakra };
}
