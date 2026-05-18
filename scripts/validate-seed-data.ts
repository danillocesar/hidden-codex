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
    unmodeledAptitudes?: string[];
    /**
     * Codes que ESTE arquivo intencionalmente sobrescreve (upsert) de outros
     * arquivos do mesmo tipo. Usado em patches que corrigem categoria/efeitos
     * de entradas anteriores (ex: aptitudes-patches.json → burro_de_carga,
     * furtividade_agil migrando de MANOBRA pra GERAL).
     *
     * Quando declarado, o validador emite "info" em vez de "error" para essas
     * colisões cross-arquivo. A ordem em prisma/seed.ts garante que o upsert
     * deste arquivo é o que prevalece no banco.
     */
    intentionalUpserts?: string[];
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
  equipmentCodes: Set<string>;
  clanCodes: Set<string>;
  villageCodes: Set<string>;
  kekkeiGenkaiCodes: Set<string>;
  attributeCodes: Set<string>;
  skillCodes: Set<string>;
  combatSkillCodes: Set<string>;
  allUnmodeledPowers: Set<string>;
  allUnmodeledAptitudes: Set<string>;
  intentionalUpserts: Set<string>;
  codeToFile: Map<string, string>;
  duplicates: Array<{ code: string; files: string[] }>;
  upsertOverrides: Array<{ code: string; files: string[] }>;
}

function buildIndices(files: SeedFile[]): Indices {
  const powerCodes = new Set<string>();
  const effectCodes = new Set<string>();
  const aptitudeCodes = new Set<string>();
  const equipmentCodes = new Set<string>();
  const clanCodes = new Set<string>();
  const villageCodes = new Set<string>();
  const kekkeiGenkaiCodes = new Set<string>();
  const attributeCodes = new Set<string>();
  const skillCodes = new Set<string>();
  const combatSkillCodes = new Set<string>();
  const allUnmodeledPowers = new Set<string>();
  const allUnmodeledAptitudes = new Set<string>();
  const intentionalUpserts = new Set<string>();
  const codeToFile = new Map<string, string>();
  const duplicates: Array<{ code: string; files: string[] }> = [];
  const upsertOverrides: Array<{ code: string; files: string[] }> = [];
  const codeOccurrences = new Map<string, string[]>();

  for (const file of files) {
    const { filename, data, meta } = file;

    // Acumula unmodeledPowers de qualquer _meta
    if (meta?.unmodeledPowers && Array.isArray(meta.unmodeledPowers)) {
      for (const p of meta.unmodeledPowers) allUnmodeledPowers.add(p);
    }
    // Idem para unmodeledAptitudes (refs dormentes intencionais — variantes
    // parametrizadas, futuros Lotes 5b-5d, etc.). Validador demota refs nesta
    // lista de `error` para `info`, igual ao tratamento de powers.
    if (meta?.unmodeledAptitudes && Array.isArray(meta.unmodeledAptitudes)) {
      for (const a of meta.unmodeledAptitudes) allUnmodeledAptitudes.add(a);
    }
    // Acumula intentionalUpserts: codes que este arquivo declaradamente
    // sobrescreve via upsert de outro arquivo do mesmo tipo (ver SeedFile).
    if (meta?.intentionalUpserts && Array.isArray(meta.intentionalUpserts)) {
      for (const c of meta.intentionalUpserts) intentionalUpserts.add(c);
    }

    // Detecta tipo de arquivo pelo nome (heurística simples)
    // Powers: 'powers.json' ou qualquer 'powers-<x>.json' (orphans, additional,
    // jinchuuriki, mangekyou, etc.) — mesmo padrão de aptitudes-*/effects-*/equipment-*.
    const isPowerFile = filename === 'powers.json' || filename.startsWith('powers-');
    const isEffectFile = filename.startsWith('effects-');
    const isAptitudeFile = filename.startsWith('aptitudes-');
    const isEquipmentFile = filename.startsWith('equipment-');
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
      if (isEquipmentFile) equipmentCodes.add(code);
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
        // Se declarado em _meta.intentionalUpserts (por qualquer arquivo do
        // mesmo tipo), demove de error para info — é override por design.
        if (intentionalUpserts.has(code)) {
          upsertOverrides.push({ code, files: sameTypeFiles });
        } else {
          duplicates.push({ code, files: sameTypeFiles });
        }
      }
    }
  }

  return {
    powerCodes,
    effectCodes,
    aptitudeCodes,
    equipmentCodes,
    clanCodes,
    villageCodes,
    kekkeiGenkaiCodes,
    attributeCodes,
    skillCodes,
    combatSkillCodes,
    allUnmodeledPowers,
    allUnmodeledAptitudes,
    intentionalUpserts,
    codeToFile,
    duplicates,
    upsertOverrides,
  };
}

function getEntityType(filename: string): string {
  if (filename === 'powers.json' || filename.startsWith('powers-')) return 'power';
  if (filename.startsWith('effects-')) return 'effect';
  if (filename.startsWith('aptitudes-')) return 'aptitude';
  if (filename.startsWith('equipment-')) return 'equipment';
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

/**
 * Valida pré-requisitos de Aptidões (Lote 5+).
 *
 * Aptidões guardam pré-requisitos em `entry.prerequisites` (top-level), com
 * shape diferente do `entry.rules.prerequisites` de Powers/Effects:
 *
 * ```jsonc
 * {
 *   "prerequisites": {
 *     "attributes": { "for": 6, "des": 10 },
 *     "aptitudes": ["especialista"],
 *     "aptitudes_one_of": ["lutador", "guerreiro_pesadas"],
 *     "mutuallyExclusiveWith": ["rinkaichuu"],     // 5b — simétrico
 *     "incompatibleWith": ["senninka", "senjutsu"], // 5b — unidirecional
 *     "clans": ["hyuuga"],                          // 5b
 *     "clans_one_of": ["uchiha", "uzumaki"],
 *     "powers": { "suiton": 5 },                    // 5b — minLevel por code
 *     "skills": { "iniciativa": 21 },
 *     "combatSkills_one_of": { "cc": 13, "cd": 13 }
 *   },
 *   "evolutions": [
 *     { "atLevel": 2, "prerequisites": { ... } }
 *   ]
 * }
 * ```
 *
 * Validação STRICT:
 *   - refs em `aptitudes`, `aptitudes_one_of`, `mutuallyExclusiveWith` e
 *     `incompatibleWith` devem existir em `aptitudeCodes` (ou em
 *     `_meta.unmodeledAptitudes` → demote para info).
 *   - refs em `clans` / `clans_one_of` devem existir em `clanCodes`.
 *   - chaves de `powers` devem existir em `powerCodes` (ou em
 *     `_meta.unmodeledPowers` → demote para info).
 *   - Inclui evoluções (`evolutions[].prerequisites`).
 */
function validateAptitudePrerequisites(files: SeedFile[], indices: Indices): Issue[] {
  const issues: Issue[] = [];
  const aptitudeFiles = files.filter((f) => f.filename.startsWith('aptitudes-'));

  const checkRefs = (
    prereqs: Record<string, unknown> | null | undefined,
    file: string,
    entityCode: string,
    fieldPath: string,
  ): void => {
    if (!prereqs || typeof prereqs !== 'object') return;

    checkKeyNaming(prereqs, file, entityCode, issues);

    // Refs a outras aptidões — strict, com fallback pra unmodeledAptitudes.
    const aptitudeRefLists: Array<{
      key: 'aptitudes' | 'aptitudes_one_of' | 'mutuallyExclusiveWith' | 'incompatibleWith';
      values: unknown;
    }> = [
      { key: 'aptitudes', values: prereqs.aptitudes },
      { key: 'aptitudes_one_of', values: prereqs.aptitudes_one_of },
      { key: 'mutuallyExclusiveWith', values: prereqs.mutuallyExclusiveWith },
      { key: 'incompatibleWith', values: prereqs.incompatibleWith },
    ];

    for (const { key, values } of aptitudeRefLists) {
      if (!Array.isArray(values)) continue;
      for (const ref of values) {
        if (typeof ref !== 'string') continue;
        if (indices.aptitudeCodes.has(ref)) continue;
        if (indices.allUnmodeledAptitudes.has(ref)) {
          issues.push({
            level: 'info',
            file,
            entity: entityCode,
            field: `${fieldPath}.${key}`,
            message: `Aptitude "${ref}" is unmodeled (dormant reference — OK).`,
          });
          continue;
        }
        issues.push({
          level: 'error',
          file,
          entity: entityCode,
          field: `${fieldPath}.${key}`,
          message: `Aptitude prerequisite "${ref}" does not exist in any aptitudes-*.json file and is not in _meta.unmodeledAptitudes.`,
        });
      }
    }

    // Refs a clãs (catálogo fechado, sem escape hatch — typo é sempre error).
    const clanRefLists: Array<{ key: 'clans' | 'clans_one_of'; values: unknown }> = [
      { key: 'clans', values: prereqs.clans },
      { key: 'clans_one_of', values: prereqs.clans_one_of },
    ];

    for (const { key, values } of clanRefLists) {
      if (!Array.isArray(values)) continue;
      for (const ref of values) {
        if (typeof ref !== 'string') continue;
        if (indices.clanCodes.has(ref)) continue;
        issues.push({
          level: 'error',
          file,
          entity: entityCode,
          field: `${fieldPath}.${key}`,
          message: `Clan "${ref}" referenced but not found in clans.json.`,
        });
      }
    }

    // Refs a poderes — top-level shape Record<code, minLevel>. Reaproveita o
    // escape hatch de `_meta.unmodeledPowers` (poderes ainda não modelados).
    const powersMap = prereqs.powers;
    if (powersMap && typeof powersMap === 'object' && !Array.isArray(powersMap)) {
      for (const powerCode of Object.keys(powersMap as Record<string, unknown>)) {
        if (indices.powerCodes.has(powerCode)) continue;
        if (indices.allUnmodeledPowers.has(powerCode)) {
          issues.push({
            level: 'info',
            file,
            entity: entityCode,
            field: `${fieldPath}.powers`,
            message: `Power "${powerCode}" is unmodeled (dormant reference — OK).`,
          });
          continue;
        }
        issues.push({
          level: 'error',
          file,
          entity: entityCode,
          field: `${fieldPath}.powers`,
          message: `Power "${powerCode}" referenced but not found in powers catalog and is not in _meta.unmodeledPowers.`,
        });
      }
    }
  };

  for (const file of aptitudeFiles) {
    for (const entry of file.data) {
      const code = entry.code;
      if (!code) continue;

      checkRefs(
        entry.prerequisites as Record<string, unknown> | undefined,
        file.filename,
        code,
        'prerequisites',
      );

      const evolutions = entry.evolutions as unknown;
      if (Array.isArray(evolutions)) {
        evolutions.forEach((evo, idx) => {
          if (!evo || typeof evo !== 'object') return;
          const evoPrereqs = (evo as Record<string, unknown>).prerequisites as
            | Record<string, unknown>
            | undefined;
          checkRefs(evoPrereqs, file.filename, code, `evolutions[${idx}].prerequisites`);
        });
      }
    }
  }

  return issues;
}

function validateDuplicates(indices: Indices): Issue[] {
  const issues: Issue[] = indices.duplicates.map((d) => ({
    level: 'error' as IssueLevel,
    file: d.files.join(', '),
    entity: d.code,
    message: `Duplicate code "${d.code}" found in same entity type across files: ${d.files.join(', ')}.`,
  }));

  // Reporta upserts intencionais como `info` — útil pra auditar a ordem em
  // prisma/seed.ts (último arquivo da lista ganha no banco).
  for (const u of indices.upsertOverrides) {
    issues.push({
      level: 'info' as IssueLevel,
      file: u.files.join(', '),
      entity: u.code,
      message: `Intentional upsert: "${u.code}" appears in ${u.files.join(' + ')} — declared in _meta.intentionalUpserts. Final value comes from the last file in prisma/seed.ts APTITUDE_FILES order.`,
    });
  }
  return issues;
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
    // Agrupar infos por tipo+code (Power ou Aptitude) pra ficar mais legível.
    const byRef = new Map<string, { kind: 'Power' | 'Aptitude'; refs: string[] }>();
    for (const i of infos) {
      const match = i.message.match(/(Power|Aptitude) "([^"]+)"/);
      const kind = (match?.[1] ?? 'Power') as 'Power' | 'Aptitude';
      const code = match?.[2] ?? 'unknown';
      const key = `${kind}:${code}`;
      const ref = `${i.file}:${i.entity}`;
      const bucket = byRef.get(key) ?? { kind, refs: [] };
      bucket.refs.push(ref);
      byRef.set(key, bucket);
    }
    for (const [key, { kind, refs }] of byRef) {
      const code = key.slice(kind.length + 1);
      const target = kind === 'Power' ? 'effect(s)' : 'aptitude(s)';
      console.log(`  Dormant ${kind.toLowerCase()} "${code}" referenced by ${refs.length} ${target}:`);
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
  console.log(`Unmodeled aptitudes tracked: ${indices.allUnmodeledAptitudes.size}.`);

  const issues = [
    ...validateRequiredFields(files),
    ...validateCodeFormat(files),
    ...validateDuplicates(indices),
    ...validateEffectAvailableFor(files, indices),
    ...validatePrerequisites(files, indices),
    ...validateAptitudePrerequisites(files, indices),
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
