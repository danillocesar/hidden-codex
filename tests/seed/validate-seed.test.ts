import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * Smoke test do validador de seed data.
 *
 * O validador checa coerência de referências entre os JSONs em
 * `prisma/seed-data/` (codes referenciados em `availableFor`,
 * `prerequisites.powers`, etc.). Esperamos exit code 0 e a string
 * "Validation PASSED" no stdout no estado atual do repo.
 *
 * Se este teste falhar, alguém quebrou uma referência cruzada no seed —
 * `pnpm seed:validate` localmente mostra o detalhe.
 */
describe('Seed data validator', () => {
  it('passa sem erros no estado atual do repo', () => {
    const output = execFileSync('pnpm', ['tsx', 'scripts/validate-seed-data.ts'], {
      encoding: 'utf-8',
      shell: true,
    });
    expect(output).toContain('Validation PASSED');
    expect(output).not.toContain('FAILED');
  });
});
