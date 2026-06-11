/**
 * Asserts herméticos sobre os JSONs das Aptidões (Lote 5).
 *
 * Roda direto sobre `prisma/seed-data/aptitudes-*.json` — sem Prisma client,
 * sem banco. Mantém a suíte rápida e idempotente. A verificação de que o
 * banco realmente recebeu os dados acontece via `pnpm seed:validate` +
 * spot-check manual descrito no SESSION-LOG.
 *
 * Cobre:
 *   - 5a (aptitudes-common-combat.json) — 51 entradas COMUNS + COMBATE
 *   - 5b (aptitudes-clan-restricted.json) — 36 entradas RESTRITA
 *   - 5c (aptitudes-manuevers.json) — 24 entradas MANOBRA
 *   - 5d (aptitudes-meta-shinobi.json) — 26 entradas (META + GERAL ex-SHINOBI + RESTRITA Tensai)
 *   - patches (aptitudes-patches.json) — 10 entradas (8 novas + 2 upserts MANOBRA→GERAL)
 *   - phase6-patches (aptitudes-phase6-patches.json) — 1 entrada GERAL
 *     (usar_armaduras_pesadas, pré-req das armaduras pesadas do Lote 6e)
 *   - 7a (aptitudes-samurai.json) — 8 entradas RESTRITA do Hijutsu Samurai
 *     (Espadachim, Sabre Samurai, Iaido, Yojinbo, Issen, Impedir Selos,
 *     Iaigiri, Armadura Samurai; sub-técnicas modeladas em effects.subTechniques)
 *
 * `byCodeFinal` modela o estado real do banco após upserts (último arquivo
 * ganha por code), espelhando a ordem definida em prisma/seed.ts APTITUDE_FILES.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type AptitudeCategory =
  | 'HABILIDADE'
  | 'COMBATE'
  | 'MANOBRA'
  | 'GERAL'
  | 'RESTRITA'
  | 'META';

interface AptitudeEvolution {
  atLevel: number | string;
  name?: string;
  description?: string;
  prerequisites?: Record<string, unknown>;
  effects?: Record<string, unknown>;
}

interface AptitudePrerequisites {
  aptitudes?: string[];
  aptitudes_one_of?: string[];
  mutuallyExclusiveWith?: string[];
  incompatibleWith?: string[];
  clans?: string[];
  clans_one_of?: string[];
  powers?: Record<string, number>;
  attributes?: Record<string, number>;
  attributes_one_of?: Record<string, number>;
  skills?: Record<string, number>;
  combatSkills?: Record<string, number>;
  combatSkills_one_of?: Record<string, number>;
  [key: string]: unknown;
}

interface AptitudeEntry {
  code: string;
  name: string;
  category: AptitudeCategory;
  shortDescription?: string;
  description: string;
  prerequisites?: AptitudePrerequisites;
  effects: {
    type: string;
    notes?: string;
    [key: string]: unknown;
  };
  evolutions?: AptitudeEvolution[];
}

interface AptitudesSeed {
  _meta?: {
    unmodeledAptitudes?: string[];
    [key: string]: unknown;
  };
  data: AptitudeEntry[];
}

interface ClansSeed {
  data: Array<{ code: string }>;
}

const seedDir = join(process.cwd(), 'prisma/seed-data');
const load = <T,>(file: string): T => JSON.parse(readFileSync(join(seedDir, file), 'utf-8')) as T;

const seed5a = load<AptitudesSeed>('aptitudes-common-combat.json');
const seed5b = load<AptitudesSeed>('aptitudes-clan-restricted.json');
const seed5c = load<AptitudesSeed>('aptitudes-manuevers.json');
const seed5d = load<AptitudesSeed>('aptitudes-meta-shinobi.json');
const seedPatch = load<AptitudesSeed>('aptitudes-patches.json');
const seedPhase6Patch = load<AptitudesSeed>('aptitudes-phase6-patches.json');
const seed7aSamurai = load<AptitudesSeed>('aptitudes-samurai.json');
const clans = load<ClansSeed>('clans.json');

const byCode5a = new Map(seed5a.data.map((a) => [a.code, a]));
const byCode5b = new Map(seed5b.data.map((a) => [a.code, a]));
const byCode5c = new Map(seed5c.data.map((a) => [a.code, a]));
const byCode5d = new Map(seed5d.data.map((a) => [a.code, a]));
const byCodePatch = new Map(seedPatch.data.map((a) => [a.code, a]));
const byCodePhase6Patch = new Map(seedPhase6Patch.data.map((a) => [a.code, a]));
const byCode7aSamurai = new Map(seed7aSamurai.data.map((a) => [a.code, a]));

// Estado final pós-upsert: itera lotes na ordem do APTITUDE_FILES e o último
// ganha. Usado em asserts de "categoria final" (burro_de_carga é GERAL após
// patch, não MANOBRA como no 5c original).
const byCodeFinal = new Map<string, AptitudeEntry>();
for (const list of [
  seed5a.data,
  seed5b.data,
  seed5c.data,
  seed5d.data,
  seedPatch.data,
  seedPhase6Patch.data,
  seed7aSamurai.data,
]) {
  for (const a of list) byCodeFinal.set(a.code, a);
}

const allKnownAptitudes = new Set<string>([
  ...byCodeFinal.keys(),
  ...(seed5a._meta?.unmodeledAptitudes ?? []),
  ...(seed5b._meta?.unmodeledAptitudes ?? []),
  ...(seed5c._meta?.unmodeledAptitudes ?? []),
  ...(seed5d._meta?.unmodeledAptitudes ?? []),
  ...(seedPatch._meta?.unmodeledAptitudes ?? []),
  ...(seedPhase6Patch._meta?.unmodeledAptitudes ?? []),
  ...(seed7aSamurai._meta?.unmodeledAptitudes ?? []),
]);
const clanCodes = new Set(clans.data.map((c) => c.code));

describe('Seed: Aptidões Lote 5a (aptitudes-common-combat.json)', () => {
  it('tem 52 aptidões catalogadas', () => {
    expect(seed5a.data).toHaveLength(52);
  });

  it('Acuidade está com RAW estrito (não afeta dano de CC)', () => {
    const acuidade = byCode5a.get('acuidade');
    expect(acuidade).toBeDefined();
    expect(acuidade?.effects.type).toBe('stat_substitution');
    expect(acuidade?.effects.skill).toBe('cc');
    expect(acuidade?.effects.substituteAttribute).toBe('destreza_for_forca');
    expect(acuidade?.effects.notes).toEqual(expect.stringContaining('RAW estrito'));
  });

  it('Acuidade (Homebrew) marca que também afeta o dano de CC', () => {
    const hb = byCode5a.get('acuidade_homebrew');
    expect(hb).toBeDefined();
    expect(hb?.category).toBe('HABILIDADE');
    expect(hb?.effects.homebrew).toBe(true);
    expect(hb?.effects.appliesTo).toContain('dano_cc');
  });

  it('Diligente tem evolução Nv 2 (GAS)', () => {
    const diligente = byCode5a.get('diligente');
    expect(diligente).toBeDefined();
    expect(diligente?.evolutions).toHaveLength(1);
    expect(diligente?.evolutions?.[0]?.atLevel).toBe(2);
  });

  it('Crítico Aprimorado exige Especialista', () => {
    const ca = byCode5a.get('critico_aprimorado');
    expect(ca).toBeDefined();
    expect(ca?.prerequisites?.aptitudes).toContain('especialista');
  });

  it('Ambidestria exige Combate Corporal 12 (não Destreza 10)', () => {
    const ambidestria = byCode5a.get('ambidestria');
    expect(ambidestria).toBeDefined();
    expect(ambidestria?.prerequisites?.combatSkills).toEqual({ cc: 12 });
    expect(ambidestria?.prerequisites?.attributes).toBeUndefined();
  });

  it('distribuição por categoria bate com o README do lote', () => {
    const counts = seed5a.data.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts).toEqual({
      HABILIDADE: 13,
      COMBATE: 22,
      MANOBRA: 7,
      GERAL: 10,
    });
  });

  it('todos os codes são snake_case únicos', () => {
    const codes = seed5a.data.map((a) => a.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Aptidões Lote 5b — Restritas de Clã (aptitudes-clan-restricted.json)', () => {
  it('tem 36 aptidões catalogadas', () => {
    expect(seed5b.data).toHaveLength(36);
  });

  it('todas são categoria RESTRITA', () => {
    for (const a of seed5b.data) {
      expect(a.category).toBe('RESTRITA');
    }
  });

  it('Byakugan tem 9 benefícios passivos', () => {
    const byakugan = byCode5b.get('byakugan');
    expect(byakugan).toBeDefined();
    expect(byakugan?.effects.passiveBenefits).toHaveLength(9);
    expect(byakugan?.prerequisites?.clans).toEqual(['hyuuga']);
  });

  it('Mangekyou Sharingan tem 10 PV e evolução Eien', () => {
    const ms = byCode5b.get('mangekyou_sharingan');
    expect(ms).toBeDefined();
    expect(ms?.effects.visionPointsTotal).toBe(10);
    expect(ms?.evolutions).toHaveLength(1);
    expect(ms?.evolutions?.[0]?.name).toEqual(expect.stringContaining('Eien'));
  });

  it('3 aptidões com evolução no lote (Mangekyou, Kikaichuu, Kagura Shingan)', () => {
    const withEvo = seed5b.data.filter((a) => (a.evolutions ?? []).length > 0).map((a) => a.code);
    expect(withEvo.sort()).toEqual(['kagura_shingan', 'kikaichuu', 'mangekyou_sharingan']);
  });

  it('Kidaichuu e Rinkaichuu são mutuamente exclusivos (simétrico)', () => {
    const kid = byCode5b.get('kidaichuu');
    const rin = byCode5b.get('rinkaichuu');
    expect(kid?.prerequisites?.mutuallyExclusiveWith).toContain('rinkaichuu');
    expect(rin?.prerequisites?.mutuallyExclusiveWith).toContain('kidaichuu');
  });

  it('Suika dá dobro de dano com Raiton', () => {
    const suika = byCode5b.get('suika');
    expect(suika).toBeDefined();
    const immunities = suika?.effects.elementalImmunities as Record<string, string> | undefined;
    expect(immunities?.raiton).toBe('dobro_dano');
  });

  it('Juuinka-Ichi é incompatível com Senninka e Senjutsu', () => {
    const ji = byCode5b.get('juuinka_ichi');
    expect(ji?.prerequisites?.incompatibleWith).toEqual(
      expect.arrayContaining(['senninka', 'senjutsu']),
    );
  });

  it('todos os codes são snake_case únicos', () => {
    const codes = seed5b.data.map((a) => a.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Aptidões Lote 5c — Manobras Avançadas (aptitudes-manuevers.json)', () => {
  it('tem 24 aptidões catalogadas', () => {
    expect(seed5c.data).toHaveLength(24);
  });

  it('todas são categoria MANOBRA', () => {
    for (const a of seed5c.data) {
      expect(a.category).toBe('MANOBRA');
    }
  });

  it('Estilo Zui Quan tem 25% de miss imune a sensores e tabela d8', () => {
    const zui = byCode5c.get('estilo_zui_quan');
    expect(zui).toBeDefined();
    expect(zui?.effects.incomingAttackMissChance).toBe(0.25);
    expect(zui?.effects.missChanceUnstoppableBySensors).toBe(true);
    const roll = zui?.effects.randomActionRoll as { die?: string } | undefined;
    expect(roll?.die).toBe('d8');
    expect(zui?.evolutions).toHaveLength(1);
  });

  it('3 aptidões com evolução no lote (Desarme à Distância, Flechada no Joelho, Estilo Zui Quan)', () => {
    const withEvo = seed5c.data.filter((a) => (a.evolutions ?? []).length > 0).map((a) => a.code);
    expect(withEvo.sort()).toEqual(['desarme_a_distancia', 'estilo_zui_quan', 'flechada_no_joelho']);
  });

  it('Voadora requer Derrubar Agressivo + Ataque Poderoso', () => {
    const voadora = byCode5c.get('voadora');
    expect(voadora?.prerequisites?.aptitudes).toEqual(
      expect.arrayContaining(['derrubar_agressivo', 'ataque_poderoso']),
    );
  });

  it('Imobilização requer Agarrar Agressivo + Força 13', () => {
    const im = byCode5c.get('imobilizacao');
    expect(im?.prerequisites?.aptitudes).toContain('agarrar_agressivo');
    expect(im?.prerequisites?.attributes?.for).toBe(13);
  });

  it('5 aptidões com needsDeepResearch', () => {
    const codes = seed5c.data
      .filter((a) => (a.effects as { needsDeepResearch?: boolean }).needsDeepResearch === true)
      .map((a) => a.code)
      .sort();
    expect(codes).toEqual([
      'burro_de_carga',
      'furtividade_agil',
      'henge_perfeito',
      'instancia_de_falange',
      'roubar',
    ]);
  });

  it('todos os codes são snake_case únicos', () => {
    const codes = seed5c.data.map((a) => a.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Aptidões Lote 5d — Meta + GERAL ex-SHINOBI + Tensai (aptitudes-meta-shinobi.json)', () => {
  it('tem 26 aptidões catalogadas', () => {
    expect(seed5d.data).toHaveLength(26);
  });

  it('distribuição por categoria bate com o remap SHINOBI→GERAL', () => {
    const counts = seed5d.data.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      META: 14,
      GERAL: 9, // 8 ex-SHINOBI + trabalho_duro
      RESTRITA: 3, // trio Tensai
    });
  });

  it('nenhuma entrada usa a categoria SHINOBI (remapeada pra GERAL nesta sessão)', () => {
    const offenders = seed5d.data
      .filter((a) => (a.category as string) === 'SHINOBI')
      .map((a) => a.code);
    expect(offenders).toEqual([]);
  });

  it('Potencializar tem 3 opções mutuamente exclusivas', () => {
    const pot = byCode5d.get('potencializar');
    expect(pot).toBeDefined();
    expect(pot?.category).toBe('META');
    const exclusive = pot?.effects.exclusiveOptions as string[] | undefined;
    expect(exclusive).toHaveLength(3);
  });

  it('Clone tem evolução Nv 2 e cria capangas', () => {
    const clone = byCode5d.get('clone');
    expect(clone).toBeDefined();
    expect(clone?.category).toBe('GERAL');
    expect(clone?.evolutions).toHaveLength(1);
    expect(clone?.evolutions?.[0]?.atLevel).toBe(2);
    expect(clone?.effects.asCapangas).toBe(true);
  });

  it('Shunjutsu tem 2 evoluções (Nv 2 e Nv 3)', () => {
    const shun = byCode5d.get('shunjutsu');
    expect(shun).toBeDefined();
    expect(shun?.evolutions).toHaveLength(2);
    expect(shun?.evolutions?.map((e) => e.atLevel)).toEqual([2, 3]);
  });

  it('Trabalho Duro exige sem clã e sem hijutsu (narrativo)', () => {
    const td = byCode5d.get('trabalho_duro');
    expect(td).toBeDefined();
    expect((td?.prerequisites as { narrative?: string } | undefined)?.narrative).toBe(
      'sem_cla_e_sem_hijutsu',
    );
  });

  it('trio Tensai (aprendizagem_rapida, talento_natural, tecnica_avancada) tem flag tensaiOnly e prereq tensai', () => {
    const trio = ['aprendizagem_rapida', 'talento_natural', 'tecnica_avancada'];
    for (const code of trio) {
      const apt = byCode5d.get(code);
      expect(apt, `aptidão ${code} ausente do 5d`).toBeDefined();
      expect(apt?.category).toBe('RESTRITA');
      expect(apt?.effects.tensaiOnly).toBe(true);
      expect(apt?.prerequisites?.aptitudes).toContain('tensai');
    }
  });

  it('todos os codes são snake_case únicos', () => {
    const codes = seed5d.data.map((a) => a.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Aptidões Patches — correções + GAS additions (aptitudes-patches.json)', () => {
  it('tem 10 aptidões catalogadas (8 novas + 2 upserts)', () => {
    expect(seedPatch.data).toHaveLength(10);
  });

  it('burro_de_carga e furtividade_agil estão em ambos 5c (MANOBRA) e patches (GERAL)', () => {
    expect(byCode5c.get('burro_de_carga')?.category).toBe('MANOBRA');
    expect(byCode5c.get('furtividade_agil')?.category).toBe('MANOBRA');
    expect(byCodePatch.get('burro_de_carga')?.category).toBe('GERAL');
    expect(byCodePatch.get('furtividade_agil')?.category).toBe('GERAL');
  });

  it('burro_de_carga (final, pós-upsert) é GERAL com tiers For 4/8/12 → 4/5/6', () => {
    const burro = byCodeFinal.get('burro_de_carga');
    expect(burro?.category).toBe('GERAL');
    expect(burro?.effects.type).toBe('encumbrance_modifier');
    expect(burro?.effects.tiers).toEqual({ for_4: 4, for_8: 5, for_12: 6 });
  });

  it('furtividade_agil (final, pós-upsert) é GERAL', () => {
    expect(byCodeFinal.get('furtividade_agil')?.category).toBe('GERAL');
  });

  it('declara 2 unmodeledAptitudes (variantes parametrizadas de especialista)', () => {
    expect(seedPatch._meta?.unmodeledAptitudes).toEqual(
      expect.arrayContaining([
        'especialista_armas_de_fogo',
        'especialista_armas_disparo_ou_arremesso',
      ]),
    );
  });

  it('todos os codes são snake_case únicos', () => {
    const codes = seedPatch.data.map((a) => a.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Aptidões: Patch Fase 6 — usar_armaduras_pesadas (aptitudes-phase6-patches.json)', () => {
  it('tem exatamente 1 aptidão (usar_armaduras_pesadas)', () => {
    expect(seedPhase6Patch.data).toHaveLength(1);
    expect(byCodePhase6Patch.get('usar_armaduras_pesadas')).toBeDefined();
  });

  it('declara usar_armaduras_pesadas como intentionalUpsert (override do 5a)', () => {
    const declared = seedPhase6Patch._meta?.intentionalUpserts as string[] | undefined;
    expect(declared).toEqual(['usar_armaduras_pesadas']);
  });

  it('5a tem usar_armaduras_pesadas como COMBATE; phase6-patches sobrescreve pra GERAL', () => {
    expect(byCode5a.get('usar_armaduras_pesadas')?.category).toBe('COMBATE');
    expect(byCodePhase6Patch.get('usar_armaduras_pesadas')?.category).toBe('GERAL');
  });

  it('estado final pós-upsert é GERAL (último arquivo ganha)', () => {
    expect(byCodeFinal.get('usar_armaduras_pesadas')?.category).toBe('GERAL');
  });

  it('mantém prereq attributes_one_of { for: 10, vig: 15 }', () => {
    const apt = byCodePhase6Patch.get('usar_armaduras_pesadas');
    expect(apt?.prerequisites?.attributes_one_of).toEqual({ for: 10, vig: 15 });
  });

  it('effects.type=armor_proficiency, effects.armorType=pesada', () => {
    const apt = byCodePhase6Patch.get('usar_armaduras_pesadas');
    expect(apt?.effects.type).toBe('armor_proficiency');
    expect(apt?.effects.armorType).toBe('pesada');
  });
});

describe('Seed: Aptidões Lote 7a — Hijutsu Samurai (aptitudes-samurai.json)', () => {
  const SAMURAI_CODES = [
    'espadachim',
    'sabre_samurai',
    'iaido',
    'yojinbo',
    'issen',
    'impedir_selos',
    'iaigiri',
    'armadura_samurai',
  ];

  it('tem 8 aptidões catalogadas', () => {
    expect(seed7aSamurai.data).toHaveLength(8);
    expect(seed7aSamurai._meta?.expectedItemCount).toBe(8);
  });

  it('todas são categoria RESTRITA com prerequisites.type = hijutsu_samurai', () => {
    for (const a of seed7aSamurai.data) {
      expect(a.category).toBe('RESTRITA');
      expect((a.prerequisites as { type?: string } | undefined)?.type).toBe('hijutsu_samurai');
    }
  });

  it('codes esperados estão presentes (set taxativo)', () => {
    const actual = new Set(seed7aSamurai.data.map((a) => a.code));
    expect(actual).toEqual(new Set(SAMURAI_CODES));
  });

  it('Espadachim é a aptidão-base do Hijutsu (sem pré-req de atributo) e tem sub-técnica Aparar Lâmina (Des 10)', () => {
    const e = byCode7aSamurai.get('espadachim');
    expect(e).toBeDefined();
    expect(e?.prerequisites?.attributes).toBeUndefined();
    expect(e?.prerequisites?.aptitudes).toBeUndefined();
    const grants = e?.effects.grants as string[] | undefined;
    expect(grants).toContain('desarme_agressivo');
    const subs = e?.effects.subTechniques as Array<{ code: string; prerequisites?: { attributes?: { des?: number } } }> | undefined;
    expect(subs).toHaveLength(1);
    expect(subs?.[0]?.code).toBe('aparar_lamina');
    expect(subs?.[0]?.prerequisites?.attributes?.des).toBe(10);
  });

  it('Sabre Samurai tem 3 sub-técnicas (Especialista em Espadas, Lâmina de Chakra, Corte de Chakra) e requer Espadachim + CC 12', () => {
    const s = byCode7aSamurai.get('sabre_samurai');
    expect(s?.prerequisites?.aptitudes).toContain('espadachim');
    expect(s?.prerequisites?.skills?.cc).toBe(12);
    const subs = s?.effects.subTechniques as Array<{ code: string; noManobras?: boolean }> | undefined;
    expect(subs?.map((t) => t.code)).toEqual([
      'especialista_em_espadas',
      'lamina_de_chakra',
      'corte_de_chakra',
    ]);
    const corte = subs?.find((t) => t.code === 'corte_de_chakra');
    expect(corte?.noManobras).toBe(true);
  });

  it('Iaido requer Espadachim + Saque Rápido + Des 8 e tem sub-técnica Corte Rápido', () => {
    const i = byCode7aSamurai.get('iaido');
    expect(i?.prerequisites?.aptitudes).toEqual(
      expect.arrayContaining(['espadachim', 'saque_rapido']),
    );
    expect(i?.prerequisites?.attributes?.des).toBe(8);
    const subs = i?.effects.subTechniques as Array<{ code: string }> | undefined;
    expect(subs?.[0]?.code).toBe('corte_rapido');
  });

  it('Yojinbo é noManobras com pré-req Espadachim+Saque+Iaido+Ataque em Movimento e Des 10', () => {
    const y = byCode7aSamurai.get('yojinbo');
    expect(y?.effects.noManobras).toBe(true);
    expect(y?.prerequisites?.aptitudes).toEqual(
      expect.arrayContaining(['espadachim', 'saque_rapido', 'iaido', 'ataque_em_movimento']),
    );
    expect(y?.prerequisites?.attributes?.des).toBe(10);
  });

  it('Issen requer Sabre Samurai + Ambidestria, Des 12 + Esp 12, sub-técnica Hadan (noManobras), dual sword damage x2', () => {
    const i = byCode7aSamurai.get('issen');
    expect(i?.prerequisites?.aptitudes).toEqual(
      expect.arrayContaining(['sabre_samurai', 'ambidestria']),
    );
    expect(i?.prerequisites?.attributes?.des).toBe(12);
    expect(i?.prerequisites?.attributes?.esp).toBe(12);
    const dual = i?.effects.corteDeChakraWithDualSwords as { weaponDamageMultiplier?: number } | undefined;
    expect(dual?.weaponDamageMultiplier).toBe(2);
    const subs = i?.effects.subTechniques as Array<{ code: string; noManobras?: boolean }> | undefined;
    const hadan = subs?.find((t) => t.code === 'hadan');
    expect(hadan).toBeDefined();
    expect(hadan?.noManobras).toBe(true);
  });

  it('Impedir Selos tem trigger inimigo_realiza_selos_no_alcance_cc, sub-técnica Seguir Passo, e regra de exclusão narrativa', () => {
    const im = byCode7aSamurai.get('impedir_selos');
    expect(im?.effects.trigger).toBe('inimigo_realiza_selos_no_alcance_cc');
    expect(im?.effects.noResponseToDefensiveTechniqueFromTargetYouAttacked).toBe(true);
    const subs = im?.effects.subTechniques as Array<{ code: string; cdPrecisionPenalty?: number }> | undefined;
    const seguir = subs?.find((t) => t.code === 'seguir_passo');
    expect(seguir?.cdPrecisionPenalty).toBe(-3);
  });

  it('Iaigiri só roda como Golpe de Misericórdia, é noManobras e tem grau de dano total 5', () => {
    const ig = byCode7aSamurai.get('iaigiri');
    expect(ig?.effects.onlyAsGolpeDeMisericordia).toBe(true);
    expect(ig?.effects.noManobras).toBe(true);
    expect(ig?.effects.totalDamageGradeOnCoupDeGrace).toBe(5);
    expect(ig?.prerequisites?.attributes?.des).toBe(14);
  });

  it('Armadura Samurai concede usar_armaduras_pesadas via effects.grants e habilita armadura_de_batalha_samurai', () => {
    const a = byCode7aSamurai.get('armadura_samurai');
    expect(a?.prerequisites?.attributes_one_of).toEqual({ for: 10, vig: 12 });
    expect(a?.effects.grants as string[]).toContain('usar_armaduras_pesadas');
    expect(a?.effects.unlocksEquipment as string[]).toContain('armadura_de_batalha_samurai');
  });

  it('4 aptidões/sub-técnicas têm noManobras: yojinbo, sabre_samurai.corte_de_chakra, issen.hadan, iaigiri', () => {
    const noManobrasOwners: string[] = [];
    for (const a of seed7aSamurai.data) {
      if ((a.effects as { noManobras?: boolean }).noManobras === true) {
        noManobrasOwners.push(a.code);
      }
      const subs = a.effects.subTechniques as Array<{ code: string; noManobras?: boolean }> | undefined;
      for (const t of subs ?? []) {
        if (t.noManobras === true) noManobrasOwners.push(`${a.code}.${t.code}`);
      }
    }
    expect(noManobrasOwners.sort()).toEqual(
      [
        'yojinbo',
        'iaigiri',
        'sabre_samurai.corte_de_chakra',
        'issen.hadan',
      ].sort(),
    );
  });

  it('refs cruzadas (Saque Rápido, Ambidestria, Ataque em Movimento, Espadachim) resolvem nas aptidões já seedadas', () => {
    const required = ['saque_rapido', 'ambidestria', 'ataque_em_movimento', 'espadachim'];
    for (const code of required) {
      expect(allKnownAptitudes.has(code), `ref ${code} deve existir no catálogo`).toBe(true);
    }
  });

  it('todos os codes são snake_case únicos', () => {
    const codes = seed7aSamurai.data.map((a) => a.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Aptidões — integridade cross-lote (5a + 5b + 5c + 5d + patches + phase6-patches + 7a)', () => {
  const allEntries = [
    ...seed5a.data,
    ...seed5b.data,
    ...seed5c.data,
    ...seed5d.data,
    ...seedPatch.data,
    ...seedPhase6Patch.data,
    ...seed7aSamurai.data,
  ];

  it('total de entradas em JSON é 157 e total único pós-upsert é 154 (3 upserts intencionais; 7a sem overlap)', () => {
    expect(allEntries).toHaveLength(157); // 52+36+24+26+10+1+8
    expect(byCodeFinal.size).toBe(154); // 2 upserts 5c→patches + 1 upsert 5a→phase6-patches; 7a sem overlap
  });

  it('distribuição final por categoria (pós-upsert) — 7a adiciona +8 RESTRITA', () => {
    const counts = [...byCodeFinal.values()].reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      HABILIDADE: 14,
      COMBATE: 26, // 27 − 1 (usar_armaduras_pesadas migrou para GERAL)
      MANOBRA: 29,
      GERAL: 24, // 23 + 1 (usar_armaduras_pesadas)
      RESTRITA: 47, // 39 + 8 (Hijutsu Samurai)
      META: 14,
    });
  });

  it('únicas colisões cross-arquivo são intentionalUpserts declarados (7a sem overlap)', () => {
    const occurrences = new Map<string, string[]>();
    for (const [file, list] of [
      ['5a', seed5a.data],
      ['5b', seed5b.data],
      ['5c', seed5c.data],
      ['5d', seed5d.data],
      ['patches', seedPatch.data],
      ['phase6-patches', seedPhase6Patch.data],
      ['7a', seed7aSamurai.data],
    ] as const) {
      for (const a of list) {
        const arr = occurrences.get(a.code) ?? [];
        arr.push(file);
        occurrences.set(a.code, arr);
      }
    }
    const duplicates = [...occurrences.entries()]
      .filter(([, files]) => files.length > 1)
      .map(([code, files]) => `${code}: ${files.join('+')}`)
      .sort();
    expect(duplicates).toEqual([
      'burro_de_carga: 5c+patches',
      'furtividade_agil: 5c+patches',
      'usar_armaduras_pesadas: 5a+phase6-patches',
    ]);
  });

  it('APTITUDE_FILES em prisma/seed.ts tem patches DEPOIS de 5c (upsert order matters)', () => {
    // Usa lastIndexOf pra ignorar menções dos nomes em docstrings/comentários e
    // pegar a posição real na lista APTITUDE_FILES (que vem depois dos comentários).
    const seedTs = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf-8');
    const idxManuevers = seedTs.lastIndexOf('aptitudes-manuevers.json');
    const idxPatches = seedTs.lastIndexOf('aptitudes-patches.json');
    expect(idxManuevers).toBeGreaterThan(0);
    expect(idxPatches).toBeGreaterThan(idxManuevers);
  });

  it('refs cruzadas a aptidões resolvem em (todos os lotes ∪ unmodeledAptitudes)', () => {
    const refKeys = [
      'aptitudes',
      'aptitudes_one_of',
      'mutuallyExclusiveWith',
      'incompatibleWith',
    ] as const;
    const orphans: string[] = [];

    const checkRefs = (prereqs: AptitudePrerequisites | undefined, owner: string) => {
      if (!prereqs) return;
      for (const key of refKeys) {
        const list = prereqs[key];
        if (!Array.isArray(list)) continue;
        for (const ref of list) {
          if (!allKnownAptitudes.has(ref)) orphans.push(`${owner} -> ${ref}`);
        }
      }
    };

    for (const a of allEntries) {
      checkRefs(a.prerequisites, a.code);
      for (const [idx, evo] of (a.evolutions ?? []).entries()) {
        checkRefs(evo.prerequisites as AptitudePrerequisites | undefined, `${a.code}.evo[${idx}]`);
      }
    }

    expect(orphans).toEqual([]);
  });

  it('refs de clãs em prerequisites.clans/clans_one_of resolvem em clans.json', () => {
    const orphans: string[] = [];
    for (const a of allEntries) {
      const lists = [a.prerequisites?.clans, a.prerequisites?.clans_one_of];
      for (const list of lists) {
        if (!Array.isArray(list)) continue;
        for (const clan of list) {
          if (!clanCodes.has(clan)) orphans.push(`${a.code} -> ${clan}`);
        }
      }
    }
    expect(orphans).toEqual([]);
  });
});
