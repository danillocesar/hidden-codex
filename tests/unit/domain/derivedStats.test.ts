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

const satsukiInput = {
  attributes: satsukiNc6.attributes,
  bases: satsukiNc6.bases,
  aptitudeCodes: satsukiNc6.aptitudes.map((a) => a.code),
};

describe('derivedStats — Satsuki NC 6', () => {
  it('Vitalidade máxima = 55', () => {
    expect(calculateMaxVitality(satsukiNc6.attributes.vig, satsukiNc6.campaignLevel)).toBe(55);
  });

  it('Chakra máximo = 19', () => {
    expect(calculateMaxChakra(satsukiNc6.attributes.esp)).toBe(19);
  });

  describe('CC (Combate Corporal)', () => {
    it('com katana: 5 base + 6 Des (Acuidade) + 1 Especialista = 12', () => {
      expect(calculateCC(satsukiInput, { weaponCategory: 'mediana', weaponKind: 'katana' })).toBe(
        12,
      );
    });

    it('com wakizashi (Daisho rule): 5 + 6 Des + 1 Especialista (katana → wakizashi) = 12', () => {
      expect(
        calculateCC(satsukiInput, { weaponCategory: 'leve', weaponKind: 'wakizashi' }),
      ).toBe(12);
    });

    it('com arma leve genérica (sem Especialista) = 11', () => {
      expect(
        calculateCC(satsukiInput, { weaponCategory: 'leve', weaponKind: 'dagger' }),
      ).toBe(11);
    });

    it('sem opts (assume leve, sem Especialista) = 11', () => {
      expect(calculateCC(satsukiInput)).toBe(11);
    });

    it('arma pesada cancela Acuidade — usa Força', () => {
      // Força 1 → CC = 5 + 1 = 6
      expect(calculateCC(satsukiInput, { weaponCategory: 'pesada' })).toBe(6);
    });

    it('Especialista (wakizashi) explícito não dobra com Daisho', () => {
      const input = {
        ...satsukiInput,
        aptitudeCodes: [...satsukiInput.aptitudeCodes, 'especialista_wakizashi'],
      };
      // Tem especialista_wakizashi direto, então Daisho não aplica de novo.
      expect(calculateCC(input, { weaponCategory: 'leve', weaponKind: 'wakizashi' })).toBe(12);
    });

    it('sem Acuidade usa Força mesmo em arma leve', () => {
      const input = {
        attributes: satsukiNc6.attributes,
        bases: satsukiNc6.bases,
        aptitudeCodes: [], // sem Acuidade
      };
      expect(calculateCC(input, { weaponCategory: 'leve' })).toBe(6); // 5 + 1 For
    });

    // ── RAW (Livro Básico 4.1b — Acuidade) ───────────────────────────────
    // Arma mediana sem entrada explícita no livro NÃO recebe Acuidade.
    it('arma mediana com nome desconhecido usa Força (não-RAW NÃO entra)', () => {
      // weaponKind='espada_qualquer' não está em ACUIDADE_NAMED_WEAPONS
      // → cai fora da exceção, usa Força. 5 + 1 = 6.
      expect(
        calculateCC(satsukiInput, { weaponCategory: 'mediana', weaponKind: 'espada_qualquer' }),
      ).toBe(6);
    });

    it('florete (mediana, mas nominal no livro) ganha Acuidade', () => {
      // 5 + 6 Des = 11 (sem Especialista_florete na Satsuki).
      expect(
        calculateCC(satsukiInput, { weaponCategory: 'mediana', weaponKind: 'florete' }),
      ).toBe(11);
    });

    it('chicote (mediana nominal) ganha Acuidade', () => {
      expect(
        calculateCC(satsukiInput, { weaponCategory: 'mediana', weaponKind: 'chicote' }),
      ).toBe(11);
    });

    it('chokutō (longa nominal) ganha Acuidade', () => {
      expect(
        calculateCC(satsukiInput, { weaponCategory: 'longa', weaponKind: 'chokuto' }),
      ).toBe(11);
    });

    it('categoria "arremesso" SOZINHA não dispara mais Acuidade (regression)', () => {
      // Antes da correção, 'arremesso' habilitava Acuidade como blanket.
      // RAW só fala em "armas de arremesso usáveis em CC (como kunai)" — que
      // devem ser modeladas como leves, não como categoria arremesso pura.
      // Aqui passamos um weaponKind genérico não-nominal pra travar a regra.
      expect(
        calculateCC(satsukiInput, {
          weaponCategory: 'arremesso',
          weaponKind: 'pedra_qualquer',
        }),
      ).toBe(6); // usa Força
    });
  });

  describe('CD, ESQ, LM', () => {
    it('CD = baseCd + Des = 3 + 6 = 9', () => {
      expect(calculateCD(satsukiInput)).toBe(9);
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
