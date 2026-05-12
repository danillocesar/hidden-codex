import { describe, expect, it } from 'vitest';
import {
  calculatePericiaLevel,
  calculatePericiaLevelByCode,
  sumPericiaPoints,
  validatePericiaBudget,
} from '@/domain/rules/skills';

describe('skills — calculatePericiaLevel', () => {
  it('arredonda atributo pra cima na base inicial', () => {
    // Acrobacia (Agi 6, 2 pts) = ⌈6/2⌉ + 2 = 5
    expect(calculatePericiaLevel(2, 6)).toBe(5);
    // Atletismo (For 1, 2 pts) = ⌈1/2⌉ + 2 = 3
    expect(calculatePericiaLevel(2, 1)).toBe(3);
  });

  it('Atletismo NC 6 (For 1, 2 pts) = 3', () => {
    expect(calculatePericiaLevel(2, 1, false)).toBe(3);
  });

  it('perícia com requiresTraining e 0 pts retorna 0 (sem treino)', () => {
    expect(calculatePericiaLevel(0, 5, true)).toBe(0);
  });

  it('perícia com requiresTraining e pts > 0 calcula normal', () => {
    expect(calculatePericiaLevel(2, 5, true)).toBe(5); // ⌈5/2⌉ + 2 = 5
  });

  it('arredonda atributo ímpar pra cima', () => {
    expect(calculatePericiaLevel(0, 5)).toBe(3); // ⌈5/2⌉ = 3
  });
});

describe('skills — calculatePericiaLevelByCode', () => {
  const attrs = { for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 };

  it('Acrobacia (Agi) = 5 com 2 pts', () => {
    expect(calculatePericiaLevelByCode('acrobacia', attrs, 2)).toBe(5);
  });

  it('Venefício (Int, requer treino) com 0 pts = 0', () => {
    expect(calculatePericiaLevelByCode('venenificio', attrs, 0)).toBe(0);
  });

  it('Venefício com 2 pts calcula = ⌈1/2⌉ + 2 = 3', () => {
    expect(calculatePericiaLevelByCode('venenificio', attrs, 2)).toBe(3);
  });

  it('código desconhecido lança erro', () => {
    expect(() => calculatePericiaLevelByCode('xpto', attrs, 0)).toThrow(/desconhecida/);
  });
});

describe('skills — validatePericiaBudget', () => {
  it('Satsuki NC 6: 8 perícias × 2 pts = 16 (exato budget)', () => {
    const result = validatePericiaBudget(
      {
        acrobacia: 2,
        atletismo: 2,
        escapar: 2,
        furtividade: 2,
        prestidigitacao: 2,
        procurar: 2,
        prontidao: 2,
        rastrear: 2,
      },
      6,
    );
    expect(result.ok).toBe(true);
  });

  it('NC 6: gasta 1 ponto além do budget (17/16) → erro', () => {
    const result = validatePericiaBudget(
      {
        acrobacia: 3,
        atletismo: 2,
        escapar: 2,
        furtividade: 2,
        prestidigitacao: 2,
        procurar: 2,
        prontidao: 2,
        rastrear: 2,
      },
      6,
    );
    expect(result.ok).toBe(false);
  });

  it('NC 6: perícia com 4 pts (acima do limite 3) → erro', () => {
    const result = validatePericiaBudget({ acrobacia: 4 }, 6);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/limite/);
  });

  it('NC 4: Venefício é proibida com pontos investidos', () => {
    const result = validatePericiaBudget({ venenificio: 1 }, 4);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/criação/);
  });

  it('NC 4: Venefício com 0 pontos é tolerada (sem treino)', () => {
    const result = validatePericiaBudget({ venenificio: 0 }, 4);
    expect(result.ok).toBe(true);
  });

  it('código desconhecido → erro', () => {
    const result = validatePericiaBudget({ xpto: 1 }, 6);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/desconhecida/);
  });

  it('pontos negativos rejeitados', () => {
    const result = validatePericiaBudget({ acrobacia: -1 }, 6);
    expect(result.ok).toBe(false);
  });

  it('pontos não-inteiros rejeitados', () => {
    const result = validatePericiaBudget({ acrobacia: 1.5 }, 6);
    expect(result.ok).toBe(false);
  });
});

describe('skills — sumPericiaPoints', () => {
  it('soma só pontos positivos', () => {
    expect(sumPericiaPoints({ a: 3, b: 2, c: 0, d: -1 })).toBe(5);
  });
  it('objeto vazio = 0', () => {
    expect(sumPericiaPoints({})).toBe(0);
  });
});
