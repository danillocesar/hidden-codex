'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { createCharacterInputSchema, type CreateCharacterInput } from '@/schemas/character/create';
import { resolveAndValidateCharacterInput } from './_shared';

export type CreateCharacterResult =
  | { ok: true; characterId: string }
  | { ok: false; error: string; fields?: Record<string, string[]> };

/**
 * Server action do wizard P0.2 — recebe o payload validado pelo client, refaz
 * a validacao com Zod + motor de regras, aplica beneficios de origem (cla/KG/
 * vila) e persiste em transacao Prisma.
 *
 * A resolucao de origem + validacao semantica vive em `resolveAndValidateCharacterInput`
 * (`_shared.ts`), compartilhada com `updateCharacter`. Erros de regra de RPG
 * voltam como `{ ok: false, error }` (mensagem em pt-BR pra UI). Erros de auth
 * resolvem em redirect pro login.
 */
export async function createCharacter(rawInput: unknown): Promise<CreateCharacterResult> {
  const session = await getCurrentUser();
  if (!session) {
    redirect('/login');
  }

  const parsed = createCharacterInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados invalidos.',
      fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const input: CreateCharacterInput = parsed.data;

  const resolution = await resolveAndValidateCharacterInput(input);
  if (!resolution.ok) {
    return { ok: false, error: resolution.error };
  }
  const {
    clan,
    village,
    kekkeiGenkai,
    benefits,
    finalAptitudes,
    finalPowers,
    aptitudeIdByCode,
    powerIdByCode,
    equipmentIdByCode,
    maxVitality,
    maxChakra,
    effectsByPower,
  } = resolution.resolved;

  const attrs = input.attributes;

  // ── Persistir em transacao ──────────────────────────────────────────────
  const characterCreate: Prisma.CharacterCreateInput = {
    user: { connect: { id: session.user.id } },
    name: input.identity.name.trim(),
    age: input.identity.age ?? null,
    gender: input.identity.gender?.trim() || null,
    campaignLevel: input.identity.campaignLevel,
    customVillageName: input.identity.customVillageName?.trim() || null,
    customClanName: input.identity.customClanName?.trim() || null,
    portraitUrl: input.identity.portraitUrl ?? null,
    attrFor: attrs.for,
    attrDes: attrs.des,
    attrAgi: attrs.agi,
    attrPer: attrs.per,
    attrInt: attrs.int,
    attrVig: attrs.vig,
    attrEsp: attrs.esp,
    baseCc: input.bases.cc,
    baseCd: input.bases.cd,
    baseEsq: input.bases.esq,
    baseLm: input.bases.lm,
    currentVitality: maxVitality,
    currentChakra: maxChakra,
    ...(clan ? { clan: { connect: { id: clan.id } } } : {}),
    ...(village ? { village: { connect: { id: village.id } } } : {}),
    ...(benefits.effectiveKekkeiGenkaiCode && kekkeiGenkai
      ? { kekkeiGenkai: { connect: { id: kekkeiGenkai.id } } }
      : {}),
    pericias: {
      create: Object.entries(input.pericias)
        .filter(([, points]) => points > 0)
        .map(([periciaCode, points]) => ({ periciaCode, points })),
    },
    aptitudes: {
      create: finalAptitudes.map((a) => ({
        aptitudeId: aptitudeIdByCode.get(a.code)!,
        parameter: a.parameter ?? null,
        isFreeFromOrigin: a.isFreeFromOrigin,
      })),
    },
    powers: {
      create: finalPowers.map((p) => ({
        powerId: powerIdByCode.get(p.code)!,
        level: p.level,
      })),
    },
    // Efeitos aprendidos persistidos como Record<powerCode, effectCode[]>.
    // NAO criamos CharacterJutsu aqui — essa tabela fica para jutsus reais
    // criados pelo usuario numa fase futura.
    learnedEffects: effectsByPower as Prisma.InputJsonValue,
    inventory: {
      create: input.inventory.map((item) => ({
        equipmentId: equipmentIdByCode.get(item.equipmentCode)!,
        quantity: item.quantity,
        equipped: item.equipped,
        notes: item.notes?.trim() || null,
      })),
    },
  };

  const created = await prisma.character.create({
    data: characterCreate,
    select: { id: true },
  });

  revalidatePath('/dashboard');
  return { ok: true, characterId: created.id };
}
