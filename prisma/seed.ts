/**
 * Prisma seed entry point — incrementa progressivamente os catálogos do livro.
 *
 * Fontes em `prisma/seed-data/*.json`. Cada JSON tem shape:
 *   { "_meta": {...}, "data": [ { ... }, ... ] }
 *
 * O `_meta` e qualquer campo com prefixo `_` (ex.: `_note`) são ignorados —
 * não vão pro banco. Idempotente via `upsert` por `code` único.
 *
 * Lotes aplicados:
 *   - Leva 1: pericias.json (20 perícias) + villages.json (5 vilas)
 *   - Lote 2: kekkei-genkais.json (5 KGs + juuken-skipped) + clans.json (17)
 *   - Lote 3: powers.json (19 poderes)
 *
 * Os atributos e habilidades de combate ficam fora do banco: vivem só em
 * `src/domain/catalog/{attributes,combatSkills}.ts` (listas fechadas de 7 e 4
 * itens — decisão de arquitetura).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SeedFile<T> = {
  _meta?: Record<string, unknown>;
  data: T[];
};

/**
 * Lê um JSON de seed e retorna apenas o array `data` com os campos que NÃO
 * começam com `_` (ex.: `_note` é metadata interna).
 */
function loadSeedData<T extends Record<string, unknown>>(filename: string): T[] {
  const filePath = path.join(__dirname, 'seed-data', filename);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as SeedFile<Record<string, unknown>>;
  return raw.data.map(
    (item) => Object.fromEntries(Object.entries(item).filter(([k]) => !k.startsWith('_'))) as T,
  );
}

// ──────────────────────────────────────────────────────────────────────
// Vilas (Leva 1)
// ──────────────────────────────────────────────────────────────────────

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
      benefits: (v.benefits ?? {}) as Prisma.InputJsonValue,
    };
    await prisma.village.upsert({
      where: { code: v.code },
      create: data,
      update: data,
    });
  }
  console.info(`  ✓ ${villages.length} vilas`);
}

// ──────────────────────────────────────────────────────────────────────
// Kekkei Genkais (Lote 2)
// ──────────────────────────────────────────────────────────────────────
// Juuken é listado em `kekkei-genkais.json` apenas para clareza — tecnicamente
// é um Poder Restrito (modelado em `powers.json` como `RESTRITO_CLA`).
// Pulamos durante o seed para evitar duplicar a entidade.

type KekkeiGenkaiSeed = {
  code: string;
  name: string;
  translation?: string;
  associatedClan?: string;
  shortDescription?: string;
  description: string;
  benefits?: Record<string, unknown>;
};

const KEKKEI_GENKAI_SKIP_CODES: ReadonlySet<string> = new Set(['juuken']);

async function seedKekkeiGenkais(): Promise<void> {
  const all = loadSeedData<KekkeiGenkaiSeed>('kekkei-genkais.json');
  let inserted = 0;
  for (const kg of all) {
    if (KEKKEI_GENKAI_SKIP_CODES.has(kg.code)) continue;
    const data = {
      code: kg.code,
      name: kg.name,
      translation: kg.translation ?? null,
      associatedClan: kg.associatedClan ?? null,
      shortDescription: kg.shortDescription ?? null,
      description: kg.description,
      benefits: (kg.benefits ?? {}) as Prisma.InputJsonValue,
    };
    await prisma.kekkeiGenkai.upsert({
      where: { code: kg.code },
      create: data,
      update: data,
    });
    inserted += 1;
  }
  const skipped = all.length - inserted;
  console.info(
    `  ✓ ${inserted} kekkei genkais${skipped > 0 ? ` (${skipped} pulado: juuken é poder, não KG)` : ''}`,
  );
}

// ──────────────────────────────────────────────────────────────────────
// Clãs (Lote 2)
// ──────────────────────────────────────────────────────────────────────

type ClanSeed = {
  code: string;
  name: string;
  village?: string | null;
  shortDescription?: string;
  description: string;
  benefits?: Record<string, unknown>;
};

async function seedClans(): Promise<void> {
  const clans = loadSeedData<ClanSeed>('clans.json');
  for (const c of clans) {
    const data = {
      code: c.code,
      name: c.name,
      village: c.village ?? null,
      shortDescription: c.shortDescription ?? null,
      description: c.description,
      benefits: (c.benefits ?? {}) as Prisma.InputJsonValue,
    };
    await prisma.clan.upsert({
      where: { code: c.code },
      create: data,
      update: data,
    });
  }
  console.info(`  ✓ ${clans.length} clãs`);
}

// ──────────────────────────────────────────────────────────────────────
// Poderes (Lote 3)
// ──────────────────────────────────────────────────────────────────────

type PowerSeed = {
  code: string;
  name: string;
  translation?: string;
  category: 'COMUM' | 'RESTRITO' | 'RESTRITO_CLA' | 'KEKKEI_GENKAI';
  element?: string | null;
  associatedKekkeiGenkai?: string;
  associatedClan?: string;
  shortDescription?: string;
  description: string;
  stats?: Record<string, unknown>;
  rules?: Record<string, unknown>;
};

async function seedPowers(): Promise<void> {
  const powers = loadSeedData<PowerSeed>('powers.json');
  for (const p of powers) {
    const data = {
      code: p.code,
      name: p.name,
      translation: p.translation ?? null,
      category: p.category,
      element: p.element ?? null,
      associatedKekkeiGenkai: p.associatedKekkeiGenkai ?? null,
      associatedClan: p.associatedClan ?? null,
      shortDescription: p.shortDescription ?? null,
      description: p.description,
      stats: (p.stats ?? {}) as Prisma.InputJsonValue,
      rules: (p.rules ?? {}) as Prisma.InputJsonValue,
    };
    await prisma.power.upsert({
      where: { code: p.code },
      create: data,
      update: data,
    });
  }
  console.info(`  ✓ ${powers.length} poderes`);
}

// ──────────────────────────────────────────────────────────────────────
// Perícias (Leva 1)
// ──────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.info('🌱 Seed iniciado…');
  // Ordem importa: clãs referenciam vilas e KGs (via `village` e `benefits.kekkeiGenkai`),
  // poderes referenciam clãs e KGs (via `associatedClan` / `associatedKekkeiGenkai`).
  // Perícias são independentes — vão por último.
  await seedVillages();
  await seedKekkeiGenkais();
  await seedClans();
  await seedPowers();
  await seedPericias();
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
