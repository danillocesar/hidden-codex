import { describe, expect, it } from 'vitest';
import { validateCombatBases } from '@/domain/rules/combatBases';

describe('combatBases — remanejamento', () => {
  it('bases padrão 3+3+3+3 são válidas', () => {
    expect(validateCombatBases({ cc: 3, cd: 3, esq: 3, lm: 3 })).toEqual({ ok: true });
  });

  it('Satsuki 5+3+3+1 (movido 2 de LM pra CC) é válido', () => {
    expect(validateCombatBases({ cc: 5, cd: 3, esq: 3, lm: 1 })).toEqual({ ok: true });
  });

  it('soma diferente de 12 é rejeitada', () => {
    const result = validateCombatBases({ cc: 5, cd: 3, esq: 3, lm: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Soma das bases/);
  });

  it('move +3 de uma base (acima do limite) é rejeitada', () => {
    const result = validateCombatBases({ cc: 6, cd: 3, esq: 3, lm: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/2 pontos/);
  });

  it('move -3 de uma base é rejeitada', () => {
    const result = validateCombatBases({ cc: 6, cd: 3, esq: 3, lm: 0 });
    expect(result.ok).toBe(false);
  });

  it('base negativa é explicitamente rejeitada', () => {
    const result = validateCombatBases({ cc: 7, cd: 3, esq: 3, lm: -1 });
    expect(result.ok).toBe(false);
  });

  it('distribui 2 de um lado, 1 de cada de outro: válido', () => {
    // -2 de LM (1) e +1 em CC (4) +1 em CD (4)
    expect(validateCombatBases({ cc: 4, cd: 4, esq: 3, lm: 1 })).toEqual({ ok: true });
  });

  it('move 2 de cima e 2 de baixo (exato limite): válido', () => {
    // CC +2, ESQ -2 → 5 + 3 + 1 + 3 = 12
    expect(validateCombatBases({ cc: 5, cd: 3, esq: 1, lm: 3 })).toEqual({ ok: true });
  });
});
