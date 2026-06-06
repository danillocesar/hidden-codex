'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { createCharacterInputSchema, type CreateCharacterInput } from '@/schemas/character/create';
import { resolveAndValidateCharacterInput } from './_shared';
import type { CreateCharacterResult } from './create';

/**
 * Server action de EDICAO de personagem — reusa o wizard de criacao. Recebe o
 * mesmo payload do `createCharacter`, refaz toda a validacao via
 * `resolveAndValidateCharacterInput` e atualiza a ficha em transacao.
 *
 * O wizard em modo edicao gerencia apenas o "build" do personagem (identidade,
 * atributos, bases, pericias, aptidoes, poderes, efeitos). Campos de estado de
 * jogo e relacoes geridas em outras telas sao PRESERVADOS:
 *   - currentVitality/currentChakra: mantidos e apenas clampados ao novo maximo
 *     (vitalidade pode ir negativa; chakra minimo 0).
 *   - biography, rank, tendency, size, social*, uiState, ryos, isPublicOnProfile.
 *   - relacoes: inventory (gerido na ficha, com compartimentos), jutsus, images,
 *     diaryEntries, shareLinks. O `input.inventory` e IGNORADO de proposito.
 *
 * Pericias/aptidoes/poderes sao 100% derivados do wizard → estrategia
 * delete-all-then-recreate dentro da transacao.
 */
export async function updateCharacter(
  characterId: string,
  rawInput: unknown,
): Promise<CreateCharacterResult> {
  const session = await getCurrentUser();
  if (!session) {
    return { ok: false, error: 'Sessao expirada. Faca login novamente.' };
  }

  // Re-fetch + ownership. Pega as energias atuais pra clamp pos-edicao.
  const existing = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: { currentVitality: true, currentChakra: true },
  });
  if (!existing) {
    return { ok: false, error: 'Ficha nao encontrada.' };
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
    maxVitality,
    maxChakra,
    effectsByPower,
  } = resolution.resolved;

  const attrs = input.attributes;

  // Preservar dano de jogo: so reduz se exceder o novo maximo. Vitalidade SEM
  // piso (pode ir negativa = morto); chakra com piso 0.
  const currentVitality = Math.min(existing.currentVitality, maxVitality);
  const currentChakra = Math.max(0, Math.min(existing.currentChakra, maxChakra));

  const data: Prisma.CharacterUpdateInput = {
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
    currentVitality,
    currentChakra,
    // FKs de origem como set-or-null (cobrem troca e remocao de cla/vila/KG).
    clan: clan ? { connect: { id: clan.id } } : { disconnect: true },
    village: village ? { connect: { id: village.id } } : { disconnect: true },
    kekkeiGenkai:
      benefits.effectiveKekkeiGenkaiCode && kekkeiGenkai
        ? { connect: { id: kekkeiGenkai.id } }
        : { disconnect: true },
    learnedEffects: effectsByPower as Prisma.InputJsonValue,
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
  };

  await prisma.$transaction([
    // delete-all-then-recreate dos derivados do wizard.
    prisma.characterPericia.deleteMany({ where: { characterId } }),
    prisma.characterAptitude.deleteMany({ where: { characterId } }),
    prisma.characterPower.deleteMany({ where: { characterId } }),
    prisma.character.update({ where: { id: characterId }, data }),
  ]);

  revalidatePath('/dashboard');
  revalidatePath(`/characters/${characterId}`);
  return { ok: true, characterId };
}
