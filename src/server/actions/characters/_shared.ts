import { prisma } from '@/lib/prisma';
import {
  applyOriginBenefits,
  getEffectiveFreePowerLevels,
  type OriginBenefits,
} from '@/lib/character/applyOriginBenefits';
import type { CreateCharacterInput } from '@/schemas/character/create';
import type { CharacterAptitudeRef, CharacterCore, CharacterPowerRef } from '@/domain/types';
import { ATTRIBUTE_KEYS } from '@/domain/types';
import { validateCombatBases } from '@/domain/rules/combatBases';
import { findAttributesAboveMax, findAttributesBelowMin } from '@/domain/rules/attributeLimits';
import { getAttrBudget } from '@/domain/rules/pointsBudget';
import { validatePericiaBudget } from '@/domain/rules/skills';
import { FREE_STARTING_APTITUDES, validatePowersAndAptitudes } from '@/domain/rules/powers';
import { checkAptitudePrerequisites } from '@/domain/rules/aptitudes';
import { validateEffectSelection, type EffectDef } from '@/domain/rules/effects';
import { calculateMaxChakra, calculateMaxVitality } from '@/domain/rules/derivedStats';

type OriginRow = { id: string; code: string; benefits: unknown } | null;

/**
 * Dados resolvidos e validados de um input de personagem, prontos pra montar
 * o payload Prisma — compartilhados entre `createCharacter` e `updateCharacter`.
 *
 * As contagens de aptidoes/poderes ja incluem os beneficios grátis da origem
 * (cla/KG/vila). IDs de catalogo ja resolvidos pra evitar segundo round-trip.
 */
export type ResolvedCharacterInput = {
  clan: OriginRow;
  kekkeiGenkai: OriginRow;
  village: OriginRow;
  benefits: OriginBenefits;
  finalAptitudes: ReadonlyArray<CharacterAptitudeRef>;
  finalPowers: ReadonlyArray<CharacterPowerRef>;
  aptitudeIdByCode: Map<string, string>;
  powerIdByCode: Map<string, string>;
  equipmentIdByCode: Map<string, string>;
  maxVitality: number;
  maxChakra: number;
  /** Record<powerCode, effectCode[]> validado, pronto pra persistir como JSON. */
  effectsByPower: Record<string, string[]>;
};

export type ResolveResult =
  | { ok: false; error: string }
  | { ok: true; resolved: ResolvedCharacterInput };

/**
 * Resolve origem (cla/KG/vila), aplica beneficios grátis, roda TODA a validacao
 * de regras de RPG (limites de atributo, budgets, bases, pre-reqs de aptidao/
 * poder, selecao de efeitos) e resolve os IDs de catalogo. Nao toca no banco
 * de escrita — apenas leitura de catalogos.
 *
 * Camadas de validacao (defesa em profundidade): o Zod parse fica em cada
 * action (create/update); este helper cobre a validacao SEMANTICA.
 */
export async function resolveAndValidateCharacterInput(
  input: CreateCharacterInput,
): Promise<ResolveResult> {
  // ── 1. Resolver origem (cla, KG, vila) ──────────────────────────────────
  const [clan, kekkeiGenkai, village] = await Promise.all([
    input.identity.clanCode
      ? prisma.clan.findUnique({
          where: { code: input.identity.clanCode },
          select: { id: true, code: true, benefits: true },
        })
      : Promise.resolve(null),
    input.identity.kekkeiGenkaiCode
      ? prisma.kekkeiGenkai.findUnique({
          where: { code: input.identity.kekkeiGenkaiCode },
          select: { id: true, code: true, benefits: true },
        })
      : Promise.resolve(null),
    input.identity.villageCode
      ? prisma.village.findUnique({
          where: { code: input.identity.villageCode },
          select: { id: true, code: true, benefits: true },
        })
      : Promise.resolve(null),
  ]);

  if (input.identity.clanCode && !clan) {
    return { ok: false, error: `Cla "${input.identity.clanCode}" nao encontrado.` };
  }
  if (input.identity.kekkeiGenkaiCode && !kekkeiGenkai) {
    return {
      ok: false,
      error: `Kekkei Genkai "${input.identity.kekkeiGenkaiCode}" nao encontrada.`,
    };
  }
  if (input.identity.villageCode && !village) {
    return { ok: false, error: `Vila "${input.identity.villageCode}" nao encontrada.` };
  }

  const benefits = applyOriginBenefits({ clan, kekkeiGenkai, village });

  // ── 2. Resolver aptidoes e poderes finais (input + concedidos) ──────────
  const freeAptitudeSet = new Set(benefits.freeAptitudeCodes);
  const userAptitudeRefs: CharacterAptitudeRef[] = input.aptitudes.map((a) => ({
    code: a.code,
    parameter: a.parameter ?? undefined,
    // Se o code coincide com um free, marcamos como free pra nao cobrar.
    isFreeFromOrigin: !a.parameter && freeAptitudeSet.has(a.code),
  }));

  // Adiciona aptidoes grátis que o usuario nao listou explicitamente.
  const listedCodes = new Set(userAptitudeRefs.filter((a) => !a.parameter).map((a) => a.code));
  const grantedAptitudeRefs: CharacterAptitudeRef[] = [];
  for (const code of benefits.freeAptitudeCodes) {
    if (!listedCodes.has(code)) {
      grantedAptitudeRefs.push({ code, isFreeFromOrigin: true });
    }
  }
  const finalAptitudes: ReadonlyArray<CharacterAptitudeRef> = [
    ...userAptitudeRefs,
    ...grantedAptitudeRefs,
  ];

  const finalPowers: ReadonlyArray<CharacterPowerRef> = input.powers.map((p) => ({
    code: p.code,
    level: p.level,
  }));

  // ── 3. Validacoes via motor ─────────────────────────────────────────────
  const nc = input.identity.campaignLevel;
  const attrs = input.attributes;

  const below = findAttributesBelowMin(attrs, nc);
  if (below.length > 0) {
    const list = below
      .map((b) => `${b.key.toUpperCase()} ${b.current} < min ${b.required}`)
      .join(', ');
    return { ok: false, error: `Atributos abaixo do minimo do NC ${nc}: ${list}.` };
  }
  const above = findAttributesAboveMax(attrs, nc);
  if (above.length > 0) {
    const list = above.map((a) => `${a.key.toUpperCase()} ${a.current} > max ${a.max}`).join(', ');
    return { ok: false, error: `Atributos acima do maximo do NC ${nc}: ${list}.` };
  }

  // `attrPoints` da tabela RAW (Livro Basico) e o TOTAL de pontos de atributo
  // a distribuir, INCLUINDO o min auto-preenchido. Ex.: NC 6 = 24 totais.
  const attrBudget = getAttrBudget(nc);
  const attrSum = ATTRIBUTE_KEYS.reduce((acc, k) => acc + attrs[k], 0);
  if (attrSum > attrBudget) {
    return {
      ok: false,
      error: `Total de pontos em atributos excede o orcamento (${attrSum}/${attrBudget}).`,
    };
  }

  const basesCheck = validateCombatBases(input.bases);
  if (!basesCheck.ok) return { ok: false, error: basesCheck.error };

  const periciaCheck = validatePericiaBudget(input.pericias, nc);
  if (!periciaCheck.ok) return { ok: false, error: periciaCheck.error };

  const effectiveFreeLevels = getEffectiveFreePowerLevels(benefits, finalPowers);
  const powerCheck = validatePowersAndAptitudes({
    characterPowers: finalPowers,
    aptitudes: finalAptitudes,
    freeLevelsByPower: effectiveFreeLevels,
    nc,
    freeStartingAptitudes: FREE_STARTING_APTITUDES,
  });
  if (!powerCheck.ok) return { ok: false, error: powerCheck.error };

  // ── 4. Pre-requisitos das aptidoes PAGAS (free aptitudes nao revalidam) ─
  const characterForPrereqCheck: CharacterCore = {
    campaignLevel: nc,
    attributes: attrs,
    bases: input.bases,
    pericias: input.pericias,
    aptitudes: finalAptitudes,
    powers: finalPowers,
    learnedEffects: [],
    narrativeFlags: [],
    clan: clan ? { code: clan.code } : undefined,
    kekkeiGenkai: benefits.effectiveKekkeiGenkaiCode
      ? { code: benefits.effectiveKekkeiGenkaiCode }
      : undefined,
    currentVitality: 0,
    currentChakra: 0,
    socialCarisma: 0,
    socialManipulacao: 0,
  };

  const paidAptitudes = finalAptitudes.filter((a) => !a.isFreeFromOrigin);
  if (paidAptitudes.length > 0) {
    const paidCodes = paidAptitudes.map((a) => a.code);
    const dbAptitudes = await prisma.aptitude.findMany({
      where: { code: { in: paidCodes } },
      select: { code: true, prerequisites: true },
    });
    const byCode = new Map(dbAptitudes.map((a) => [a.code, a]));
    for (const ref of paidAptitudes) {
      const def = byCode.get(ref.code);
      if (!def) {
        return {
          ok: false,
          error: `Aptidao "${ref.code}" nao encontrada no catalogo.`,
        };
      }
      const result = checkAptitudePrerequisites(
        (def.prerequisites ?? {}) as Parameters<typeof checkAptitudePrerequisites>[0],
        characterForPrereqCheck,
      );
      if (!result.allMet) {
        const missing = result.checks
          .filter((c) => !c.met && !c.manualReview)
          .map((c) => c.detail)
          .join('; ');
        return {
          ok: false,
          error: `Pre-requisitos faltantes pra aptidao ${def.code}: ${missing || '(narrativo)'}.`,
        };
      }
    }
  }

  // Pre-requisitos dos PODERES (vivem em `power.rules.prerequisites` e seguem
  // o mesmo vocabulario canonico das aptidoes).
  if (finalPowers.length > 0) {
    const powerCodes = finalPowers.map((p) => p.code);
    const dbPowers = await prisma.power.findMany({
      where: { code: { in: powerCodes } },
      select: { code: true, rules: true },
    });
    const powerByCode = new Map(dbPowers.map((p) => [p.code, p]));
    for (const ref of finalPowers) {
      const def = powerByCode.get(ref.code);
      if (!def) continue; // ja validamos existencia abaixo via select de id
      const rules = (def.rules ?? {}) as Record<string, unknown>;
      const prereqs = (rules.prerequisites ?? {}) as Parameters<
        typeof checkAptitudePrerequisites
      >[0];
      if (Object.keys(prereqs).length === 0) continue;
      const result = checkAptitudePrerequisites(prereqs, characterForPrereqCheck);
      if (!result.allMet) {
        const missing = result.checks
          .filter((c) => !c.met && !c.manualReview)
          .map((c) => c.detail)
          .join('; ');
        return {
          ok: false,
          error: `Pre-requisitos faltantes pro poder ${def.code}: ${missing || '(narrativo)'}.`,
        };
      }
    }
  }

  // ── 4b. Validar selecao de efeitos (slots por poder) ────────────────────
  const allEffectCodes = Array.from(new Set(Object.values(input.effectsByPower).flat()));
  const effectRows = allEffectCodes.length
    ? await prisma.powerEffect.findMany({
        where: { code: { in: allEffectCodes } },
        select: {
          id: true,
          code: true,
          name: true,
          minLevel: true,
          availableFor: true,
          rules: true,
        },
      })
    : [];
  const effectByCode = new Map(effectRows.map((e) => [e.code, e]));
  for (const code of allEffectCodes) {
    if (!effectByCode.has(code)) {
      return { ok: false, error: `Efeito "${code}" nao encontrado no catalogo.` };
    }
  }

  // Slots = `power.level` direto. O level ja inclui niveis grátis da origem
  // (Hyouton -> Fuuton/Suiton +1) — somar `effectiveFreeLevels` dobrava.
  const effectCatalog: EffectDef[] = effectRows.map((e) => ({
    code: e.code,
    name: e.name,
    minLevel: e.minLevel,
    availableFor: e.availableFor,
    rules: e.rules as EffectDef['rules'],
  }));
  const effectCheck = validateEffectSelection({
    characterPowers: finalPowers,
    selectedByPower: input.effectsByPower,
    catalog: effectCatalog,
    character: {
      ...characterForPrereqCheck,
      learnedEffects: Object.values(input.effectsByPower).flat(),
    },
  });
  if (!effectCheck.ok) return { ok: false, error: effectCheck.error };

  // ── 5. Resolver IDs de catalogo + stats derivados ───────────────────────
  const maxVitality = calculateMaxVitality(attrs.vig, nc);
  const maxChakra = calculateMaxChakra(attrs.esp);

  // Resolver aptidaoId pra cada CharacterAptitude.
  const allAptitudeCodes = Array.from(new Set(finalAptitudes.map((a) => a.code)));
  const aptitudeRows = allAptitudeCodes.length
    ? await prisma.aptitude.findMany({
        where: { code: { in: allAptitudeCodes } },
        select: { id: true, code: true },
      })
    : [];
  const aptitudeIdByCode = new Map(aptitudeRows.map((a) => [a.code, a.id]));
  for (const code of allAptitudeCodes) {
    if (!aptitudeIdByCode.has(code)) {
      return { ok: false, error: `Aptidao "${code}" nao encontrada no catalogo.` };
    }
  }

  const allPowerCodes = Array.from(new Set(finalPowers.map((p) => p.code)));
  const powerRows = allPowerCodes.length
    ? await prisma.power.findMany({
        where: { code: { in: allPowerCodes } },
        select: { id: true, code: true },
      })
    : [];
  const powerIdByCode = new Map(powerRows.map((p) => [p.code, p.id]));
  for (const code of allPowerCodes) {
    if (!powerIdByCode.has(code)) {
      return { ok: false, error: `Poder "${code}" nao encontrado no catalogo.` };
    }
  }

  // Resolver equipmentId pra cada item de inventario (step final, opcional).
  const allEquipmentCodes = Array.from(new Set(input.inventory.map((i) => i.equipmentCode)));
  const equipmentRows = allEquipmentCodes.length
    ? await prisma.equipment.findMany({
        where: { code: { in: allEquipmentCodes } },
        select: { id: true, code: true },
      })
    : [];
  const equipmentIdByCode = new Map(equipmentRows.map((e) => [e.code, e.id]));
  for (const code of allEquipmentCodes) {
    if (!equipmentIdByCode.has(code)) {
      return { ok: false, error: `Equipamento "${code}" nao encontrado no catalogo.` };
    }
  }

  return {
    ok: true,
    resolved: {
      clan,
      kekkeiGenkai,
      village,
      benefits,
      finalAptitudes,
      finalPowers,
      aptitudeIdByCode,
      powerIdByCode,
      equipmentIdByCode,
      maxVitality,
      maxChakra,
      effectsByPower: input.effectsByPower,
    },
  };
}
