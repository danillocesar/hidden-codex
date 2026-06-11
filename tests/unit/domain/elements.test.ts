import { describe, expect, it } from 'vitest';
import { getElementDamageBonus } from '@/domain/rules/elements';

describe('elements — getElementDamageBonus', () => {
  it('Fuuton recebe +2 de dano base (Livro Básico p. 105)', () => {
    expect(getElementDamageBonus('fuuton')).toBe(2);
  });

  it('elementos sem bônus retornam 0', () => {
    expect(getElementDamageBonus('suiton')).toBe(0);
    expect(getElementDamageBonus('hyouton')).toBe(0);
    expect(getElementDamageBonus('ninpou')).toBe(0);
  });

  it('code nulo/indefinido/desconhecido retorna 0', () => {
    expect(getElementDamageBonus(null)).toBe(0);
    expect(getElementDamageBonus(undefined)).toBe(0);
    expect(getElementDamageBonus('xpto')).toBe(0);
  });
});
