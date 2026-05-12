/**
 * Script de Validação de Dados do Seed (Arcana Forge)
 * 
 * Roda DEPOIS de qualquer mudança em seed-data/ e ANTES de aplicar via pnpm prisma db seed.
 * Detecta inconsistências entre arquivos JSON do seed:
 *   1. Codes referenciados em availableFor/prerequisites que NÃO existem no catálogo
 *   2. Chaves inconsistentes (aptidoes vs aptitudes, pre_requisitos vs prerequisites, etc.)
 *   3. Duplicação de codes em arquivos diferentes
 *   4. Strings dormentes (aceitas como esperadas se estiverem em _meta.unmodeledPowers)
 *
 * Uso:
 *   pnpm tsx scripts/validate-seed-data.ts
 *   pnpm tsx scripts/validate-seed-data.ts --strict   # falha em warnings
 *
 * Saída:
 *   - exit 0: sem erros (warnings podem existir)
 *   - exit 1: erros críticos OU --strict com warnings
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SEED_DIR = join(process.cwd(), 'prisma', 'seed-data');
const STRICT = process.argv.includes('--strict');

// ===== Tipos =====

type IssueLevel = 'error' | 'warning' | 'info';

interface Issue {
  level: IssueLevel;
  file: string;
  entity?: string;
  field?: string;
  message: string;
}

interface SeedFile {
  filename: string;
  meta?: {
    unmodeledPowers?: string[];
    [key: string]: unknown;
  };
  data: Array<{ code: string; [key: string]: unknown }>;
}

// ===== Carregar todos os arquivos do seed =====

function loadSeedFiles(): SeedFile[] {
  const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  return files.map((filename) => {
    const raw = readFileSync(join(SEED_DIR, filename), 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      filename,
      meta: parsed._meta,
      data: parsed.data ?? [],
    };
  });
}

// ===== Construir índices =====

interface Indices {
  powerCodes: Set<string>;
  effectCodes: Set<string>;
  aptitudeCodes: Set<string>;
  clanCodes: Set<string>;
  villageCodes: Set<string>;
  kekkeiGenkaiCodes: Set<string>;
  attributeCodes: Set<string>;
  skillCodes: Set<string>;
  combatSkillCodes: Set<string>;
  allUnmodeledPowers: Set<string>;
  codeToFile: Map<string, string>;
  duplicates: Array<{ code: string; files: string[] }>;
}

function buildIndices(files: SeedFile[]): Indices {
  const powerCodes = new Set<string>();
  const effectCodes = new Set<string>();
  const aptitudeCodes = new Set<string>();
  const clanCodes = new Set<string>();
  const villageCodes = new Set<string>();
  const kekkeiGenkaiCodes = new Set<string>();
  const attributeCodes = new Set<string>();
  const skillCodes = new Set<string>();
  const combatSkillCodes = new Set<string>();
  const allUnmodeledPowers = new Set<string>();
  const codeToFile = new Map<string, string>();
  const duplicates: Array<{ code: string; files: string[] }> = [];
  const codeOccurrences = new Map<string, string[]>();

  for (const file of files) {
    const { filename, data, meta } = file;

    // Acumula unmodeledPowers de qualquer _meta
    if (meta?.unmodeledPowers && Array.isArray(meta.unmodeledPowers)) {
      for (const p of meta.unmodeledPowers) allUnmodeledPowers.add(p);
    }

    // Detecta tipo de arquivo pelo nome (heurística simples)
    const isPowerFile = filename === 'powers.json' || filename === 'powers-additional.json';
    const isEffectFile = filename.startsWith('effects-');
    const isAptitudeFile = filename.startsWith('aptitudes-');
    const isClanFile = filename === 'clans.json';
    const isVillageFile = filename === 'villages.json';
    const isKgFile = filename === 'kekkei-genkais.json';
    const isAttrFile = filename === 'attributes.json';
    const isPericiaFile = filename === 'pericias.json';
    const isCombatFile = filename === 'combat-skills.json';

    for (const entry of data) {
      const code = entry.code;
      if (!code) continue;

      // Track occurrences for duplicate detection
      const occ = codeOccurrences.get(code) ?? [];
      occ.push(filename);
      codeOccurrences.set(code, occ);

      // Index by file type
      if (isPowerFile) powerCodes.add(code);
      if (isEffectFile) effectCodes.add(code);
      if (isAptitudeFile) aptitudeCodes.add(code);
      if (isClanFile) clanCodes.add(code);
      if (isVillageFile) villageCodes.add(code);
      if (isKgFile) kekkeiGenkaiCodes.add(code);
      if (isAttrFile) attributeCodes.add(code);
      if (isPericiaFile) skillCodes.add(code);
      if (isCombatFile) combatSkillCodes.add(code);

      codeToFile.set(`${getEntityType(filename)}:${code}`, filename);
    }
  }

  // Detect cross-file duplicates within same entity type
  for (const [code, occ] of codeOccurrences) {
    if (occ.length > 1) {
      // Same code in multiple files might be legitimate (e.g., 'fuuton' in powers.json AND mentioned in effects)
      // But same code in TWO power-type files OR TWO effect-type files is a duplicate
      const sameTypeFiles = occ.filter((f, i, arr) => arr.indexOf(f) === i);
      const types = new Set(sameTypeFiles.map(getEntityType));
      if (types.size === 1 && sameTypeFiles.length > 1) {
        duplicates.push({ code, files: sameTypeFiles });
      }
    }
  }

  return {
    powerCodes,
    effectCodes,
    aptitudeCodes,
    clanCodes,
    villageCodes,
    kekkeiGenkaiCodes,
    attributeCodes,
    skillCodes,
    combatSkillCodes,
    allUnmodeledPowers,
    codeToFile,
    duplicates,
  };
}

function getEntityType(filename: string): string {
  if (filename === 'powers.json' || filename === 'powers-additional.json') return 'power';
  if (filename.startsWith('effects-')) return 'effect';
  if (filename.startsWith('aptitudes-')) return 'aptitude';
  if (filename === 'clans.json') return 'clan';
  if (filename === 'villages.json') return 'village';
  if (filename === 'kekkei-genkais.json') return 'kg';
  if (filename === 'attributes.json') return 'attr';
  if (filename === 'pericias.json') return 'skill';
  if (filename === 'combat-skills.json') return 'combat';
  return 'unknown';
}

// ===== Validações =====

function validateEffectAvailableFor(files: SeedFile[], indices: Indices): Issue[] {
  const issues: Issue[] = [];
  const effectFiles = files.filter((f) => f.filename.startsWith('effects-'));

  for (const file of effectFiles) {
    for (const effect of file.data) {
      const availableFor = (effect.availableFor ?? []) as string[];
      if (!Array.isArray(availableFor)) continue;

      for (const powerCode of availableFor) {
        if (indices.powerCodes.has(powerCode)) continue;
        if (indices.allUnmodeledPowers.has(powerCode)) {
          issues.push({
            level: 'info',
            file: file.filename,
            entity: effect.code,
            field: 'availableFor',
            message: `Power "${powerCode}" is unmodeled (dormant reference — OK).`,
          });
          continue;
        }
        issues.push({
          level: 'error',
          file: file.filename,
          entity: effect.code,
          field: 'availableFor',
          message: `Power "${powerCode}" is referenced but does not exist in powers catalog and is not in _meta.unmodeledPowers.`,
        });
      }
    }
  }

  return issues;
}

function validatePrerequisites(files: SeedFile[], indices: Indices): Issue[] {
  const issues: Issue[] = [];

  for (const file of files) {
    for (const entry of file.data) {
      const rules = (entry.rules ?? {}) as Record<string, unknown>;
      const prereqs = (rules.prerequisites ?? null) as Record<string, unknown> | null;
      if (!prereqs) continue;

      // Check prerequisites.powers — should reference existing power codes
      const reqPowers = (prereqs.powers ?? {}) as Record<string, number>;
      for (const powerCode of Object.keys(reqPowers)) {
        if (indices.powerCodes.has(powerCode)) continue;
        if (indices.allUnmodeledPowers.has(powerCode)) continue;
        issues.push({
          level: 'error',
          file: file.filename,
          entity: entry.code,
          field: 'rules.prerequisites.powers',
          message: `Prerequisite power "${powerCode}" does not exist in catalog.`,
        });
      }

      // Check prerequisites.effects — should reference existing effect codes
      const reqEffects = (prereqs.effects ?? []) as string[];
      if (Array.isArray(reqEffects)) {
        for (const effectCode of reqEffects) {
          if (!indices.effectCodes.has(effectCode)) {
            issues.push({
              level: 'warning',
              file: file.filename,
              entity: entry.code,
              field: 'rules.prerequisites.effects',
              message: `Prerequisite effect "${effectCode}" not found in any effects-*.json file.`,
            });
          }
        }
      }

      // Check key naming consistency
      checkKeyNaming(prereqs, file.filename, entry.code, issues);
    }
  }

  return issues;
}

function checkKeyNaming(
  obj: Record<string, unknown>,
  filename: string,
  entityCode: string,
  issues: Issue[]
): void {
  const expectedKeys: Record<string, string> = {
    aptidoes: 'aptitudes',
    aptidões: 'aptitudes',
    requisitos: 'prerequisites',
    pre_requisitos: 'prerequisites',
    pre_requisites: 'prerequisites',
    'pre-requisitos': 'prerequisites',
    poderes: 'powers',
    efeitos: 'effects',
    pericias: 'skills',
    perícias: 'skills',
    atributos: 'attributes',
    habilidades: 'combatSkills',
  };

  for (const key of Object.keys(obj)) {
    const expected = expectedKeys[key.toLowerCase()];
    if (expected && key !== expected) {
      issues.push({
        level: 'error',
        file: filename,
        entity: entityCode,
        field: key,
        message: `Inconsistent key naming. Use "${expected}" instead of "${key}".`,
      });
    }
  }
}

function validateDuplicates(indices: Indices): Issue[] {
  return indices.duplicates.map((d) => ({
    level: 'error' as IssueLevel,
    file: d.files.join(', '),
    entity: d.code,
    message: `Duplicate code "${d.code}" found in same entity type across files: ${d.files.join(', ')}.`,
  }));
}

function validateRequiredFields(files: SeedFile[]): Issue[] {
  const issues: Issue[] = [];
  const required = ['code', 'name'];

  for (const file of files) {
    for (const entry of file.data) {
      for (const field of required) {
        if (!entry[field]) {
          issues.push({
            level: 'error',
            file: file.filename,
            entity: (entry.code as string) ?? '(no code)',
            field,
            message: `Required field "${field}" is missing.`,
          });
        }
      }
    }
  }

  return issues;
}

function validateCodeFormat(files: SeedFile[]): Issue[] {
  const issues: Issue[] = [];
  const codePattern = /^[a-z0-9_]+$/;

  for (const file of files) {
    for (const entry of file.data) {
      const code = entry.code as string | undefined;
      if (!code) continue;
      if (!codePattern.test(code)) {
        issues.push({
          level: 'warning',
          file: file.filename,
          entity: code,
          field: 'code',
          message: `Code "${code}" should be snake_case (lowercase + underscores only).`,
        });
      }
    }
  }

  return issues;
}

// Detect known patches needed
function validateKnownPatches(files: SeedFile[], indices: Indices): Issue[] {
  const issues: Issue[] = [];

  // Patch: 'kamijutsu' in availableFor should be 'kami_ninpou'
  if (indices.powerCodes.has('kami_ninpou') && !indices.powerCodes.has('kamijutsu')) {
    const effectFiles = files.filter((f) => f.filename.startsWith('effects-'));
    for (const file of effectFiles) {
      for (const effect of file.data) {
        const availableFor = (effect.availableFor ?? []) as string[];
        if (Array.isArray(availableFor) && availableFor.includes('kamijutsu')) {
          issues.push({
            level: 'error',
            file: file.filename,
            entity: effect.code,
            field: 'availableFor',
            message: `KNOWN PATCH: replace "kamijutsu" with "kami_ninpou" in availableFor. Kamijutsu is the hijutsu set name, kami_ninpou is the actual power code.`,
          });
        }
      }
    }
  }

  return issues;
}

// ===== Report =====

function report(issues: Issue[]): void {
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const infos = issues.filter((i) => i.level === 'info');

  if (errors.length === 0 && warnings.length === 0 && infos.length === 0) {
    console.log('✅ Seed data validation passed with no issues.');
    return;
  }

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} ERROR(S):\n`);
    for (const e of errors) {
      console.log(`  [${e.file}] ${e.entity ?? '-'}${e.field ? `.${e.field}` : ''}: ${e.message}`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} WARNING(S):\n`);
    for (const w of warnings) {
      console.log(`  [${w.file}] ${w.entity ?? '-'}${w.field ? `.${w.field}` : ''}: ${w.message}`);
    }
  }

  if (infos.length > 0) {
    console.log(`\nℹ️  ${infos.length} INFO (dormant references — expected):\n`);
    // Agrupar infos por powerCode pra ficar mais legível
    const byPower = new Map<string, string[]>();
    for (const i of infos) {
      const match = i.message.match(/Power "([^"]+)"/);
      const power = match?.[1] ?? 'unknown';
      const ref = `${i.file}:${i.entity}`;
      const list = byPower.get(power) ?? [];
      list.push(ref);
      byPower.set(power, list);
    }
    for (const [power, refs] of byPower) {
      console.log(`  Dormant power "${power}" referenced by ${refs.length} effect(s):`);
      for (const r of refs.slice(0, 3)) console.log(`    - ${r}`);
      if (refs.length > 3) console.log(`    ... and ${refs.length - 3} more`);
    }
  }

  console.log('');
  console.log(`Summary: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} infos.`);
}

// ===== Main =====

function main(): void {
  console.log('🔍 Validating seed data in', SEED_DIR);
  console.log('');

  const files = loadSeedFiles();
  console.log(`Loaded ${files.length} JSON files.`);

  const indices = buildIndices(files);
  console.log(
    `Indexed: ${indices.powerCodes.size} powers, ${indices.effectCodes.size} effects, ${indices.clanCodes.size} clans, ${indices.villageCodes.size} villages.`
  );
  console.log(`Unmodeled powers tracked: ${indices.allUnmodeledPowers.size}.`);

  const issues = [
    ...validateRequiredFields(files),
    ...validateCodeFormat(files),
    ...validateDuplicates(indices),
    ...validateEffectAvailableFor(files, indices),
    ...validatePrerequisites(files, indices),
    ...validateKnownPatches(files, indices),
  ];

  report(issues);

  const hasErrors = issues.some((i) => i.level === 'error');
  const hasWarnings = issues.some((i) => i.level === 'warning');

  if (hasErrors) {
    console.log('❌ Validation FAILED. Fix errors before seeding.');
    process.exit(1);
  }
  if (STRICT && hasWarnings) {
    console.log('⚠️  Validation FAILED (--strict mode treats warnings as errors).');
    process.exit(1);
  }
  console.log('✅ Validation PASSED.');
  process.exit(0);
}

main();
