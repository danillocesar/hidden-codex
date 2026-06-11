import { describe, expect, it } from 'vitest';
import {
  ESPECIALISTA_CATEGORIES,
  especialistaBonus,
  especialistaCategoryForWeapon,
  isEspecialistaCategory,
} from '@/domain/rules/especialista';

describe('especialista — categorias', () => {
  it('tem as 9 categorias do livro', () => {
    expect(ESPECIALISTA_CATEGORIES).toHaveLength(9);
    expect(ESPECIALISTA_CATEGORIES).toContain('medianas');
    expect(ESPECIALISTA_CATEGORIES).toContain('desarmado');
    expect(ESPECIALISTA_CATEGORIES).toContain('especiais');
  });

  it('isEspecialistaCategory valida códigos canônicos', () => {
    expect(isEspecialistaCategory('leves')).toBe(true);
    expect(isEspecialistaCategory('katana')).toBe(false);
    expect(isEspecialistaCategory(null)).toBe(false);
    expect(isEspecialistaCategory(undefined)).toBe(false);
  });
});

describe('especialistaCategoryForWeapon', () => {
  it('mapeia categorias físicas do equipamento', () => {
    expect(especialistaCategoryForWeapon('LEVE', 'simples')).toBe('leves');
    expect(especialistaCategoryForWeapon('LEVE_COMPLEMENTAR', null)).toBe('leves');
    expect(especialistaCategoryForWeapon('MEDIANA', 'marcial')).toBe('medianas');
    expect(especialistaCategoryForWeapon('LONGA', 'marcial')).toBe('longas');
    expect(especialistaCategoryForWeapon('PESADA', 'marcial')).toBe('pesadas');
    expect(especialistaCategoryForWeapon('ARREMESSO', 'simples')).toBe('arremesso');
    expect(especialistaCategoryForWeapon('DISPARO', 'marcial')).toBe('disparo');
    expect(especialistaCategoryForWeapon('DESARMADO', null)).toBe('desarmado');
  });

  it('subtype "especial" tem precedência → especiais', () => {
    expect(especialistaCategoryForWeapon('MEDIANA', 'especial')).toBe('especiais');
    expect(especialistaCategoryForWeapon('PESADA', 'especial')).toBe('especiais');
  });

  it('categorias utilitárias/variável não têm Especialista → null', () => {
    expect(especialistaCategoryForWeapon('MUNICAO', 'municao')).toBeNull();
    expect(especialistaCategoryForWeapon('EXPLOSIVO', null)).toBeNull();
    expect(especialistaCategoryForWeapon('AREA', null)).toBeNull();
    expect(especialistaCategoryForWeapon('VARIAVEL', null)).toBeNull();
    expect(especialistaCategoryForWeapon(null, null)).toBeNull();
  });
});

describe('especialistaBonus', () => {
  it('soma +1 quando a categoria bate', () => {
    expect(especialistaBonus(['especialista_medianas', 'acuidade'], 'medianas')).toBe(1);
  });

  it('0 quando o personagem não tem a categoria', () => {
    expect(especialistaBonus(['especialista_medianas'], 'leves')).toBe(0);
  });

  it('0 quando a arma não tem categoria de Especialista', () => {
    expect(especialistaBonus(['especialista_medianas'], null)).toBe(0);
    expect(especialistaBonus(['especialista_medianas'], undefined)).toBe(0);
  });
});
