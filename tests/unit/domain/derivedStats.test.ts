import { describe, expect, it } from 'vitest';
import {
  calculateCC,
  calculateCD,
  calculateESQ,
  calculateLM,
  calculateMaxChakra,
  calculateMaxVitality,
  chakraRecoveryPerNight,
  vitalityRecoveryPerNight,
} from '@/domain/rules/derivedStats';
import { satsukiNc6, STANDARD_BASES } from './fixtures/satsuki-nc6';

// Achata os refs como a ficha faz: Especialista (medianas) → "especialista_medianas".
const satsukiInput = {
  attributes: satsukiNc6.attributes,
  bases: satsukiNc6.bases,
  aptitudeCodes: satsukiNc6.aptitudes.flatMap((a) =>
    a.parameter ? [a.code, `${a.code}_${a.parameter}`] : [a.code],
  ),
};

describe('derivedStats — Satsuki NC 6', () => {
  it('Vitalidade máxima = 55', () => {
    expect(calculateMaxVitality(satsukiNc6.attributes.vig, satsukiNc6.campaignLevel)).toBe(55);
  });

  it('Chakra máximo = 19', () => {
    expect(calculateMaxChakra(satsukiNc6.attributes.esp)).toBe(19);
  });

  describe('CC (Combate Corporal)', () => {
    it('arma mediana (Especialista medianas) + Acuidade: 5 + 6 Des + 1 = 12', () => {
      expect(
        calculateCC(satsukiInput, { especialistaCategory: 'medianas', acceptsAcuidade: true }),
      ).toBe(12);
    });

    it('arma leve sem Especialista (leves), com Acuidade = 11', () => {
      // Satsuki só tem Especialista (medianas) → categoria diferente, sem +1.
      expect(
        calculateCC(satsukiInput, { especialistaCategory: 'leves', acceptsAcuidade: true }),
      ).toBe(11);
    });

    it('sem opts (assume Acuidade, sem Especialista) = 11', () => {
      expect(calculateCC(satsukiInput)).toBe(11);
    });

    it('arma que NÃO aceita Acuidade usa Força (pesada): 5 + 1 = 6', () => {
      expect(
        calculateCC(satsukiInput, { especialistaCategory: 'pesadas', acceptsAcuidade: false }),
      ).toBe(6);
    });

    it('Especialista (pesadas) somaria +1 mesmo usando Força', () => {
      const input = {
        ...satsukiInput,
        aptitudeCodes: [...satsukiInput.aptitudeCodes, 'especialista_pesadas'],
      };
      // 5 + 1 For + 1 Especialista (pesadas) = 7.
      expect(
        calculateCC(input, { especialistaCategory: 'pesadas', acceptsAcuidade: false }),
      ).toBe(7);
    });

    it('sem Acuidade usa Força mesmo em arma que aceitaria', () => {
      const input = {
        attributes: satsukiNc6.attributes,
        bases: satsukiNc6.bases,
        aptitudeCodes: [], // sem Acuidade
      };
      expect(calculateCC(input, { acceptsAcuidade: true })).toBe(6); // 5 + 1 For
    });

    it('Acuidade (Homebrew) também substitui Força por Destreza na precisão', () => {
      const input = {
        attributes: satsukiNc6.attributes,
        bases: satsukiNc6.bases,
        aptitudeCodes: ['acuidade_homebrew'],
      };
      // 5 base + 6 Des (homebrew conta como Acuidade na precisão) = 11
      expect(calculateCC(input, { acceptsAcuidade: true })).toBe(11);
    });
  });

  describe('CD, ESQ, LM', () => {
    it('CD = baseCd + Des = 3 + 6 = 9', () => {
      expect(calculateCD(satsukiInput)).toBe(9);
    });

    it('CD com Especialista na categoria da arma de distância: +1', () => {
      const input = {
        ...satsukiInput,
        aptitudeCodes: [...satsukiInput.aptitudeCodes, 'especialista_disparo'],
      };
      // 3 + 6 Des + 1 Especialista (disparo) = 10.
      expect(calculateCD(input, { especialistaCategory: 'disparo' })).toBe(10);
    });

    it('CD sem Especialista na categoria = sem bônus', () => {
      // Satsuki tem Especialista (medianas), não disparo → CD normal.
      expect(calculateCD(satsukiInput, { especialistaCategory: 'disparo' })).toBe(9);
    });
    it('ESQ = baseEsq + Agi = 3 + 6 = 9 (sem Reflexos)', () => {
      expect(calculateESQ(satsukiInput)).toBe(9);
    });
    it('ESQ com Reflexos +1', () => {
      const input = { ...satsukiInput, aptitudeCodes: [...satsukiInput.aptitudeCodes, 'reflexos'] };
      expect(calculateESQ(input)).toBe(10);
    });
    it('LM = baseLm + Per = 1 + 2 = 3 (sem Intuição)', () => {
      expect(calculateLM(satsukiInput)).toBe(3);
    });
    it('LM com Intuição +1', () => {
      const input = { ...satsukiInput, aptitudeCodes: [...satsukiInput.aptitudeCodes, 'intuicao'] };
      expect(calculateLM(input)).toBe(4);
    });
  });
});

describe('derivedStats — cura natural', () => {
  it('vitalidade recovery: 10 + 2×Vig', () => {
    expect(vitalityRecoveryPerNight(5)).toBe(20);
    expect(vitalityRecoveryPerNight(0)).toBe(10);
  });

  it('chakra recovery: 5 + 2×Esp', () => {
    expect(chakraRecoveryPerNight(3)).toBe(11);
    expect(chakraRecoveryPerNight(0)).toBe(5);
  });
});

describe('derivedStats — personagem novo NC 4 com bases padrão', () => {
  const novato = {
    attributes: { for: 2, des: 2, agi: 2, per: 2, int: 2, vig: 2, esp: 2 },
    bases: STANDARD_BASES,
    aptitudeCodes: [],
  };
  it('Vitalidade = 10 + 6 + 20 = 36', () => {
    expect(calculateMaxVitality(2, 4)).toBe(36);
  });
  it('Chakra = 10 + 6 = 16', () => {
    expect(calculateMaxChakra(2)).toBe(16);
  });
  it('CC sem aptidões = 3 base + 2 For = 5', () => {
    expect(calculateCC(novato)).toBe(5);
  });
});
