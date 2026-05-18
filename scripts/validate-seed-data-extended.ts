/**
 * Extended seed-data validator — pre-flight checks DERIVADOS dos erros da Fase 7.
 *
 * Roda DEPOIS do validate-seed-data.ts base e adiciona:
 *
 *   1. Warning se `effects.grants` presente sem `grantsBypassesPrereq: true`
 *   2. Warning se `effects.subTechniques[]` tem entry sem `subType`
 *   3. Lista usos reais de cada `unmodeledPowers`/`unmodeledAptitudes` agregado
 *      (helpful pra decidir se vale promover a entry real)
 *   4. Warning de tamanho: arquivo >15KB pode quebrar Write tool em ferramentas
 *      automatizadas; >17KB quebra silenciosamente
 *   5. Warning se entry RESTRITA/HIJUTSU não tem `sources` no `_meta`
 *   6. Aviso quando há colisão de code cross-arquivo SEM `intentionalUpserts`
 *      declarado no arquivo mais recente
 *
 * Uso:
 *   pnpm tsx scripts/validate-seed-data-extended.ts
 *   pnpm tsx scripts/validate-seed-data-extended.ts --strict
 *
 * Saída:
 *   - exit 0: sem errors críticos
 *   - exit 1: errors OU --strict com warnings
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SEED_DIR = join(process.cwd(), 'prisma', 'seed-data');
const STRICT = process.argv.includes('--strict');
const WRITE_SAFE_LIMIT_BYTES = 15000;
const WRITE_HARD_LIMIT_BYTES = 17000;

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
  bytes: number;
  meta?: Record<string, unknown>;
  data: Array<Record<string, unknown>>;
}

function loadSeedFiles(): SeedFile[] {
  const filenames = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  return filenames.map((filename) => {
    const fullPath = join(SEED_DIR, filename);
    const bytes = statSync(fullPath).size;
    const raw = readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      filename,
      bytes,
      meta: parsed._meta,
      data: parsed.data ?? [],
    };
  });
}

// ===== Check 1: grants sem grantsBypassesPrereq =====
function checkGrantsBypassFlag(files: SeedFile[]): Issue[] {
  const issues: Issue[] = [];
  const aptitudeFiles = files.filter((f) => f.filename.startsWith('aptitudes-'));

  for (const file of aptitudeFiles) {
    for (const entry of file.data) {
      const code = entry.code as string;
      const effects = (entry.effects ?? {}) as Record<string, unknown>;
      const grants = effects.grants;
      if (!grants) continue;
      const hasGrants =
        (Array.isArray(grants) && grants.length > 0) ||
        (typeof grants === 'object' && grants !== null && Object.keys(grants).length > 0);
      if (!hasGrants) continue;
      if (effects.grantsBypassesPrereq !== true) {
        issues.push({
          level: 'warning',
          file: file.filename,
          entity: code,
          field: 'effects.grantsBypassesPrereq',
          message: `Aptidão concede outras via 'grants' mas NÃO declarou 'grantsBypassesPrereq: true'. Veja SCHEMA-PATTERNS §4.`,
        });
      }
    }
  }

  return issues;
}

// ===== Check 2: subTechniques sem subType =====
function checkSubTechniqueDiscriminator(files: SeedFile[]): Issue[] {
  const issues: Issue[] = [];
  const validSubTypes = new Set([
    'passive_buff',
    'reactive_buff',
    'conditional_buff',
    'active_ability',
    'active_attack',
    'active_reaction',
    'weapon_creation',
  ]);

  for (const file of files) {
    for (const entry of file.data) {
      const code = entry.code as string;
      const effects = (entry.effects ?? {}) as Record<string, unknown>;
      const subs = effects.subTechniques;
      if (!Array.isArray(subs)) continue;

      subs.forEach((s, idx) => {
        if (typeof s !== 'object' || s === null) return;
        const sub = s as Record<string, unknown>;
        const subCode = (sub.code as string) ?? `[${idx}]`;
        if (!('subType' in sub)) {
          issues.push({
            level: 'warning',
            file: file.filename,
            entity: `${code}.subTechniques.${subCode}`,
            field: 'subType',
            message: `subTechnique sem 'subType' discriminator. Valores válidos: ${[...validSubTypes].join(', ')}. Veja SCHEMA-PATTERNS §5.`,
          });
        } else if (typeof sub.subType === 'string' && !validSubTypes.has(sub.subType)) {
          issues.push({
            level: 'error',
            file: file.filename,
            entity: `${code}.subTechniques.${subCode}`,
            field: 'subType',
            message: `subType "${sub.subType}" não está no vocabulário canônico: ${[...validSubTypes].join(', ')}.`,
          });
        }
      });
    }
  }

  return issues;
}

// ===== Check 3: usos reais de unmodeled* =====
function checkUnmodeledUsage(files: SeedFile[]): Issue[] {
  const issues: Issue[] = [];

  const unmodeledPowers = new Set<string>();
  const unmodeledAptitudes = new Set<string>();
  for (const file of files) {
    const meta = (file.meta ?? {}) as Record<string, unknown>;
    const up = meta.unmodeledPowers;
    const ua = meta.unmodeledAptitudes;
    if (Array.isArray(up)) for (const x of up) if (typeof x === 'string') unmodeledPowers.add(x);
    if (Array.isArray(ua)) for (const x of ua) if (typeof x === 'string') unmodeledAptitudes.add(x);
  }

  // Para cada unmodeled power: contar uses em availableFor
  for (const code of unmodeledPowers) {
    let count = 0;
    const examples: string[] = [];
    for (const file of files.filter((f) => f.filename.startsWith('effects-'))) {
      for (const entry of file.data) {
        const af = entry.availableFor;
        if (Array.isArray(af) && af.includes(code)) {
          count += 1;
          if (examples.length < 3) examples.push(`${file.filename}:${entry.code}`);
        }
      }
    }
    issues.push({
      level: 'info',
      file: '(aggregated)',
      entity: `unmodeledPower:${code}`,
      message: `Power dormente "${code}" referenciado ${count} vez(es) via availableFor.${count > 0 ? ' Ex: ' + examples.join(', ') : ''}${count >= 5 ? ' — alto uso, considere promover.' : ''}`,
    });
  }

  // Para cada unmodeled aptitude: contar uses em prerequisites.aptitudes
  for (const code of unmodeledAptitudes) {
    let count = 0;
    const examples: string[] = [];
    for (const file of files) {
      for (const entry of file.data) {
        const prereqs = (entry.prerequisites ?? {}) as Record<string, unknown>;
        const lists: unknown[] = [prereqs.aptitudes, prereqs.aptitudes_one_of, prereqs.mutuallyExclusiveWith, prereqs.incompatibleWith];
        for (const list of lists) {
          if (Array.isArray(list) && list.includes(code)) {
            count += 1;
            if (examples.length < 3) examples.push(`${file.filename}:${entry.code}`);
          }
        }
      }
    }
    if (count > 0) {
      issues.push({
        level: 'info',
        file: '(aggregated)',
        entity: `unmodeledAptitude:${code}`,
        message: `Aptidão dormente "${code}" referenciada ${count} vez(es) em prerequisites. Ex: ${examples.join(', ')}${count >= 5 ? ' — alto uso, considere promover.' : ''}`,
      });
    }
  }

  return issues;
}

// ===== Check 4: tamanho de arquivo =====
function checkFileSize(files: SeedFile[]): Issue[] {
  const issues: Issue[] = [];
  for (const file of files) {
    if (file.bytes > WRITE_HARD_LIMIT_BYTES) {
      issues.push({
        level: 'warning',
        file: file.filename,
        message: `Arquivo tem ${file.bytes} bytes (>${WRITE_HARD_LIMIT_BYTES}). Write tool TRUNCA silenciosamente. Use bash+python.`,
      });
    } else if (file.bytes > WRITE_SAFE_LIMIT_BYTES) {
      issues.push({
        level: 'info',
        file: file.filename,
        message: `Arquivo tem ${file.bytes} bytes (>${WRITE_SAFE_LIMIT_BYTES}). Aproximando do limite seguro do Write tool.`,
      });
    }
  }
  return issues;
}

// ===== Check 5: sources presente em _meta =====
function checkSources(files: SeedFile[]): Issue[] {
  const issues: Issue[] = [];
  for (const file of files) {
    const meta = (file.meta ?? {}) as Record<string, unknown>;
    const sources = meta.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      // Pula arquivos básicos que não precisam (clans/villages podem ter; mas seed deveria ter)
      if (['attributes.json', 'combat-skills.json'].includes(file.filename)) continue;
      issues.push({
        level: 'warning',
        file: file.filename,
        message: `_meta.sources ausente ou vazio. Toda entrada deve citar Livro+páginas. Veja SCHEMA-PATTERNS §1.`,
      });
    }
  }
  return issues;
}

// ===== Check 6: colisão sem intentionalUpserts =====
function checkUpsertDeclaration(files: SeedFile[]): Issue[] {
  const issues: Issue[] = [];

  function entityType(filename: string): string {
    if (filename === 'powers.json' || filename.startsWith('powers-')) return 'power';
    if (filename.startsWith('effects-')) return 'effect';
    if (filename.startsWith('aptitudes-')) return 'aptitude';
    if (filename.startsWith('equipment-')) return 'equipment';
    return filename;
  }

  // index code → list of files per type
  const codeOccurrences = new Map<string, string[]>();
  for (const file of files) {
    const type = entityType(file.filename);
    for (const entry of file.data) {
      const code = entry.code as string;
      if (!code) continue;
      const key = `${type}:${code}`;
      const arr = codeOccurrences.get(key) ?? [];
      arr.push(file.filename);
      codeOccurrences.set(key, arr);
    }
  }

  for (const [key, occList] of codeOccurrences) {
    if (occList.length <= 1) continue;
    const code = key.split(':')[1] ?? '?';
    const fileNames = [...new Set(occList)];
    if (fileNames.length <= 1) continue;
    // Check if any of those files declares intentionalUpserts for this code
    const anyDeclares = fileNames.some((fn) => {
      const f = files.find((fx) => fx.filename === fn);
      if (!f) return false;
      const upserts = (f.meta as Record<string, unknown>)?.intentionalUpserts;
      return Array.isArray(upserts) && upserts.includes(code);
    });
    if (!anyDeclares) {
      issues.push({
        level: 'error',
        file: fileNames.join(', '),
        entity: code,
        message: `Code "${code}" duplicado entre ${fileNames.join(' + ')} mas nenhum arquivo declarou em _meta.intentionalUpserts. Veja SCHEMA-PATTERNS §6.`,
      });
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
    console.log('✅ Extended validation passed with no issues.');
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
    console.log(`\nℹ️  ${infos.length} INFO(S):\n`);
    for (const i of infos) {
      console.log(`  [${i.file}] ${i.entity ?? '-'}: ${i.message}`);
    }
  }
  console.log(`\nSummary: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} infos.`);
}

// ===== Main =====
function main(): void {
  console.log('🔍 Extended validator running on', SEED_DIR);
  const files = loadSeedFiles();
  console.log(`Loaded ${files.length} JSON files.\n`);

  const issues = [
    ...checkGrantsBypassFlag(files),
    ...checkSubTechniqueDiscriminator(files),
    ...checkUnmodeledUsage(files),
    ...checkFileSize(files),
    ...checkSources(files),
    ...checkUpsertDeclaration(files),
  ];

  report(issues);

  const hasErrors = issues.some((i) => i.level === 'error');
  const hasWarnings = issues.some((i) => i.level === 'warning');
  if (hasErrors) {
    console.log('❌ Extended validation FAILED.');
    process.exit(1);
  }
  if (STRICT && hasWarnings) {
    console.log('⚠️  Extended validation FAILED (--strict mode).');
    process.exit(1);
  }
  console.log('✅ Extended validation PASSED.');
  process.exit(0);
}

main();
