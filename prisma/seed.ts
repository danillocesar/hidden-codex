/**
 * Prisma seed entry point — leva 1 (perícias + vilas).
 *
 * Fontes em `prisma/seed-data/*.json`. Os JSONs têm shape:
 *   { "_meta": {...}, "data": [ { ... }, ... ] }
 *
 * O `_meta` e qualquer campo com prefixo `_` (ex.: `_note`) são ignorados —
 * não vão pro banco. Idempotente via `upsert` por `code` único.
 *
 * Mantenha em sincronia com:
 *   - `src/domain/catalog/pericias.ts` (lista TS espelhada, usada pelo motor)
 *   - `arcana-forge-spec/07-SEED-DATA-PLAN.md`
 *
 * Atributos e habilidades de combate NÃO são seedados — vivem só em
 * `src/domain/catalog/{attributes,combatSkills}.ts` (decisão de arquitetura).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SeedFile<T> = {
  _meta?: Record<string, unknown>;
  data: T[];
};

/**
 * Lê um JSON de seed e retorna apenas o array `data` com os campos que NÃO
 * começam com `_` (ex.: `_note` é metadata interna, não vai pro banco).
 */
function loadSeedData<T extends Record<string, unknown>>(filename: string): T[] {
  const filePath = path.join(__dirname, 'seed-data', filename);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as SeedFile<Record<string, unknown>>;
  return raw.data.map(
    (item) => Object.fromEntries(Object.entries(item).filter(([k]) => !k.startsWith('_'))) as T,
  );
}

type PericiaSeed = {
  code: string;
  name: string;
  attribute: string;
  trained?: boolean;
  doubleTrained?: boolean;
  armorPenalty?: boolean;
  order: number;
  shortDescription?: string;
  description: string;
};

async function seedPericias(): Promise<void> {
  const pericias = loadSeedData<PericiaSeed>('pericias.json');
  for (const p of pericias) {
    const data = {
      code: p.code,
      name: p.name,
      attribute: p.attribute,
      trained: p.trained ?? false,
      doubleTrained: p.doubleTrained ?? false,
      armorPenalty: p.armorPenalty ?? false,
      order: p.order,
      shortDescription: p.shortDescription ?? null,
      description: p.description,
    };
    await prisma.pericia.upsert({
      where: { code: p.code },
      create: data,
      update: data,
    });
  }
  console.info(`  ✓ ${pericias.length} perícias`);
}

type VillageSeed = {
  code: string;
  name: string;
  fullName?: string;
  translation?: string;
  country?: string;
  leaderTitle?: string;
  description: string;
  shortDescription?: string;
  benefits?: Record<string, unknown>;
};

async function seedVillages(): Promise<void> {
  const villages = loadSeedData<VillageSeed>('villages.json');
  for (const v of villages) {
    const data = {
      code: v.code,
      name: v.name,
      fullName: v.fullName ?? null,
      translation: v.translation ?? null,
      country: v.country ?? null,
      leaderTitle: v.leaderTitle ?? null,
      description: v.description,
      shortDescription: v.shortDescription ?? null,
      benefits: v.benefits ?? {},
    };
    await prisma.village.upsert({
      where: { code: v.code },
      create: data,
      update: data,
    });
  }
  console.info(`  ✓ ${villages.length} vilas`);
}

async function main(): Promise<void> {
  console.info('🌱 Seed iniciado…');
  await seedPericias();
  await seedVillages();
  console.info('✅ Seed completo.');
}

main()
  .catch((error) => {
    console.error('[seed] falhou', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
