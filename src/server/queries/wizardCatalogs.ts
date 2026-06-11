/**
 * Carrega os catalogos consumidos pelo wizard de criacao de personagem.
 *
 * Roda em Server Component (sem cache global por ora — wizard e raro o
 * suficiente pra nao justificar). Selects sao narrow: apenas campos
 * efetivamente consumidos pela UI ou pelo motor.
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type WizardClanOption = {
  id: string;
  code: string;
  name: string;
  shortDescription: string | null;
  description: string;
  benefits: Prisma.JsonValue;
};

export type WizardVillageOption = {
  id: string;
  code: string;
  name: string;
  fullName: string | null;
  translation: string | null;
  country: string | null;
  shortDescription: string | null;
  description: string;
  benefits: Prisma.JsonValue;
};

export type WizardKekkeiGenkaiOption = {
  id: string;
  code: string;
  name: string;
  translation: string | null;
  associatedClan: string | null;
  shortDescription: string | null;
  description: string;
  benefits: Prisma.JsonValue;
};

export type WizardPowerOption = {
  id: string;
  code: string;
  name: string;
  translation: string | null;
  category: string;
  element: string | null;
  associatedClan: string | null;
  associatedKekkeiGenkai: string | null;
  shortDescription: string | null;
  description: string;
  rules: Prisma.JsonValue;
};

export type WizardAptitudeOption = {
  id: string;
  code: string;
  name: string;
  category: string;
  costPoints: number;
  shortDescription: string | null;
  description: string;
  prerequisites: Prisma.JsonValue;
  effects: Prisma.JsonValue;
};

export type WizardPericiaOption = {
  code: string;
  name: string;
  attribute: string;
  shortDescription: string | null;
  description: string;
};

export type WizardPowerEffectOption = {
  id: string;
  code: string;
  name: string;
  minLevel: number;
  availableFor: ReadonlyArray<string>;
  shortDescription: string | null;
  description: string;
  rules: Prisma.JsonValue;
};

export type WizardEquipmentOption = {
  id: string;
  code: string;
  name: string;
  kind: string;
  subtype: string | null;
  category: string | null;
  damage: string | null;
  range: string | null;
  damageType: string | null;
  price: number | null;
  shortDescription: string | null;
};

export type WizardCatalogs = {
  clans: ReadonlyArray<WizardClanOption>;
  villages: ReadonlyArray<WizardVillageOption>;
  kekkeiGenkais: ReadonlyArray<WizardKekkeiGenkaiOption>;
  powers: ReadonlyArray<WizardPowerOption>;
  aptitudes: ReadonlyArray<WizardAptitudeOption>;
  pericias: ReadonlyArray<WizardPericiaOption>;
  powerEffects: ReadonlyArray<WizardPowerEffectOption>;
  equipment: ReadonlyArray<WizardEquipmentOption>;
};

export async function loadWizardCatalogs(): Promise<WizardCatalogs> {
  const [clans, villages, kekkeiGenkais, powers, aptitudes, pericias, powerEffects, equipment] =
    await Promise.all([
      prisma.clan.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          shortDescription: true,
          description: true,
          benefits: true,
        },
      }),
      prisma.village.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          fullName: true,
          translation: true,
          country: true,
          shortDescription: true,
          description: true,
          benefits: true,
        },
      }),
      prisma.kekkeiGenkai.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          translation: true,
          associatedClan: true,
          shortDescription: true,
          description: true,
          benefits: true,
        },
      }),
      prisma.power.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          translation: true,
          category: true,
          element: true,
          associatedClan: true,
          associatedKekkeiGenkai: true,
          shortDescription: true,
          description: true,
          rules: true,
        },
      }),
      prisma.aptitude.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          costPoints: true,
          shortDescription: true,
          description: true,
          prerequisites: true,
          effects: true,
        },
      }),
      prisma.pericia.findMany({
        orderBy: { order: 'asc' },
        select: {
          code: true,
          name: true,
          attribute: true,
          shortDescription: true,
          description: true,
        },
      }),
      prisma.powerEffect.findMany({
        orderBy: [{ minLevel: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          minLevel: true,
          availableFor: true,
          shortDescription: true,
          description: true,
          rules: true,
        },
      }),
      prisma.equipment.findMany({
        orderBy: [{ kind: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          kind: true,
          subtype: true,
          category: true,
          damage: true,
          range: true,
          damageType: true,
          price: true,
          shortDescription: true,
        },
      }),
    ]);

  return { clans, villages, kekkeiGenkais, powers, aptitudes, pericias, powerEffects, equipment };
}
