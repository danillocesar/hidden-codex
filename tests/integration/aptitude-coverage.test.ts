/**
 * P0.1 — Cobertura do motor de aptidoes contra o catalogo real do banco.
 *
 * Carrega TODOS os `aptitudes-*.json` em `prisma/seed-data/` e roda
 * `checkAptitudePrerequisites` contra um personagem minimo (NC 6, atributos 3,
 * sem aptidoes/powers/effects/clas/KG). Garante:
 *
 *   1. Nenhuma aptidao faz o motor lancar excecao.
 *   2. Todas as chaves top-level de `prerequisites` (e dentro de `alternatives`)
 *      sao conhecidas pelo motor — bate com `AptitudePrerequisites` em
 *      `src/domain/rules/aptitudes.ts` ou com refinements declarados em
 *      `prisma/seed-data/SCHEMA-PATTERNS.md` section 2.
 *
 * A lista de arquivos espelha `APTITUDE_FILES` em `prisma/seed.ts` —
 * fonte de verdade da ordem de seed. Se um lote novo entrar la, atualizar
 * `APTITUDE_FILES` abaixo.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkAptitudePrerequisites } from '@/domain/rules/aptitudes';
import type { CharacterCore } from '@/domain/types';

const SEED_DIR = join(process.cwd(), 'prisma', 'seed-data');

type AptitudeEntry = {
  code: string;
  name: string;
  category: string;
  description: string;
  prerequisites?: Record<string, unknown>;
  effects?: Record<string, unknown>;
  evolutions?: Array<Record<string, unknown>>;
};

type AptitudesSeed = {
  _meta?: Record<string, unknown>;
  data: AptitudeEntry[];
};

function loadAptitudes(file: string): AptitudeEntry[] {
  const raw = JSON.parse(readFileSync(join(SEED_DIR, file), 'utf-8')) as AptitudesSeed;
  return raw.data;
}

/**
 * Vocabulario canonico de pre-requisitos.
 *
 * Fonte: `AptitudePrerequisites` em `src/domain/rules/aptitudes.ts` +
 * SCHEMA-PATTERNS.md section 2. Toda chave top-level dentro de
 * `prerequisites` (e dentro de cada bloco em `alternatives`) precisa estar
 * aqui — caso contrario o motor ignora silenciosamente.
 */
const CANONICAL_PREREQ_KEYS: ReadonlySet<string> = new Set([
  // Discriminadores
  'type',
  // Atributos / combat skills / pericias / powers (AND + _one_of)
  'attributes',
  'attributes_one_of',
  'combatSkills',
  'combatSkills_one_of',
  'pericias',
  'pericias_one_of',
  'skills',
  'powers',
  'powers_one_of',
  // Aptidoes / effects / KG / clas
  'aptitudes',
  'aptitudes_one_of',
  'effects',
  'kekkeiGenkai',
  'clans',
  'clans_one_of',
  // Negativos
  'mutuallyExclusiveWith',
  'incompatibleWith',
  // Narrativo / multi-caminho / escape hatch
  'narrative',
  'alternatives',
  'custom',
  // Refinements documentados (motor passa direto pra UI)
  'weaponEquipped',
  'kuchiyoseRestriction',
  'noAdjacentObstaclesOrEnemies',
  // Identificadores dentro de blocos `alternatives` (semantica humana, ignorados pelo motor)
  'name',
  'description',
]);

/**
 * Personagem minimo: NC 6, atributos 3, sem nada. Garante que NENHUMA aptidao
 * "passa por sorte" — todos os pre-reqs devem retornar `allMet: false` (exceto
 * os que sao `{}`) sem o motor lancar.
 */
const EMPTY_NC6: CharacterCore = {
  campaignLevel: 6,
  attributes: { for: 3, des: 3, agi: 3, per: 3, int: 3, vig: 3, esp: 3 },
  bases: { cc: 3, cd: 3, esq: 3, lm: 3 },
  pericias: {},
  aptitudes: [],
  powers: [],
  learnedEffects: [],
  narrativeFlags: [],
  currentVitality: 30,
  currentChakra: 19,
  socialCarisma: 0,
  socialManipulacao: 0,
};

/**
 * Espelha `APTITUDE_FILES` em `prisma/seed.ts`. Glob seria fragil — quero
 * falha explicita se um arquivo novo aparecer sem ser registrado no seed.
 */
const APTITUDE_FILES: ReadonlyArray<string> = [
  'aptitudes-common-combat.json',
  'aptitudes-clan-restricted.json',
  'aptitudes-manuevers.json',
  'aptitudes-meta-shinobi.json',
  'aptitudes-patches.json',
  'aptitudes-phase6-patches.json',
  'aptitudes-samurai.json',
  'aptitudes-kaguya.json',
  'aptitudes-fuuma-yuki.json',
  'aptitudes-uchiha-doujutsu.json',
  'aptitudes-jinchuuriki-bijuus.json',
  'aptitudes-rinnegan.json',
  'aptitudes-kami-ninpou.json',
  'aptitudes-nintaijutsu.json',
];

type Found = { file: string; code: string; aptitude: AptitudeEntry };

function loadAllAptitudes(): Found[] {
  const out: Found[] = [];
  for (const file of APTITUDE_FILES) {
    for (const apt of loadAptitudes(file)) {
      out.push({ file, code: apt.code, aptitude: apt });
    }
  }
  return out;
}

const ALL = loadAllAptitudes();

describe('integracao: motor de aptidoes vs catalogo do banco', () => {
  it('lista de APTITUDE_FILES bate com glob aptitudes-*.json (sem orfaos)', () => {
    const onDisk = readdirSync(SEED_DIR)
      .filter((f) => f.startsWith('aptitudes-') && f.endsWith('.json'))
      .sort();
    const declared = [...APTITUDE_FILES].sort();
    expect(declared).toEqual(onDisk);
  });

  it('carrega >= 180 aptidoes do catalogo real', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(180);
  });

  it('nenhuma aptidao faz o motor lancar excecao com fixture vazia', () => {
    const failures: Array<{ file: string; code: string; error: string }> = [];
    for (const { file, code, aptitude } of ALL) {
      const prereqs = (aptitude.prerequisites ?? {}) as Parameters<
        typeof checkAptitudePrerequisites
      >[0];
      try {
        checkAptitudePrerequisites(prereqs, EMPTY_NC6);
      } catch (err) {
        failures.push({
          file,
          code,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    if (failures.length > 0) {
      const summary = failures
        .map((f) => `  ${f.file} :: ${f.code} -> ${f.error}`)
        .join('\n');
      throw new Error(`Motor lancou em ${failures.length} aptidao(oes):\n${summary}`);
    }
  });

  it('toda chave top-level em prerequisites bate com vocabulario canonico', () => {
    const unknown: Array<{ file: string; code: string; key: string; where: string }> = [];
    for (const { file, code, aptitude } of ALL) {
      const prereqs = aptitude.prerequisites ?? {};
      for (const key of Object.keys(prereqs)) {
        if (!CANONICAL_PREREQ_KEYS.has(key)) {
          unknown.push({ file, code, key, where: 'top-level' });
        }
      }
      // Recursa em alternatives — refinements aninhados seguem o mesmo vocabulario.
      const alts = (prereqs as { alternatives?: unknown }).alternatives;
      if (Array.isArray(alts)) {
        alts.forEach((alt, i) => {
          if (alt && typeof alt === 'object') {
            for (const key of Object.keys(alt as Record<string, unknown>)) {
              if (!CANONICAL_PREREQ_KEYS.has(key)) {
                unknown.push({ file, code, key, where: `alternatives[${i}]` });
              }
            }
          }
        });
      }
    }
    if (unknown.length > 0) {
      const summary = unknown
        .map((u) => `  ${u.file} :: ${u.code} -> ${u.where}.${u.key}`)
        .join('\n');
      throw new Error(
        `Chaves de pre-req fora do vocabulario canonico (motor ignora silenciosamente):\n${summary}`,
      );
    }
  });
});
