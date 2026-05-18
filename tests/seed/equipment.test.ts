/**
 * Asserts herméticos sobre os JSONs dos Equipamentos (Lote 6).
 *
 * Mesmo padrão de `tests/seed/aptitudes.test.ts`: lê os arquivos
 * `prisma/seed-data/equipment-*.json` direto e valida shape/contagens sem
 * depender de banco. A verificação de que o banco realmente recebeu os dados
 * acontece via `pnpm seed:apply` + spot-checks descritos no SESSION-LOG.
 *
 * Cobre:
 *   - 6a (equipment-weapons-basic.json) — 42 entradas (40 WEAPON + 2 AMMO,
 *     armas simples + marciais do Livro Básico 4.1b)
 *   - 6b (equipment-special-weapons.json) — 9 entradas (7 Espadas da Névoa +
 *     Kusanagi + Gunbai, todas WEAPON subtype=especial; do Livro de Hijutsus 1)
 *   - 6c (equipment-firearms.json) — 7 entradas (5 firearms + munição +
 *     Disparador Oculto; introduz sistema de pólvora via _meta.globalGunpowderRules)
 *   - 6d (equipment-weapons-gas.json) — 23 entradas (11 NOVAS armas GAS +
 *     12 REVISÕES que sobrescrevem entradas do 6a via upsert)
 *   - 6e (equipment-armor.json) — 6 armaduras (4 leves + 2 pesadas; introduz
 *     kind=ARMOR no catálogo e subtypes vestuario/colete/armadura_pesada)
 *   - 6f (equipment-shinobi-tools.json) — 9 ferramentas shinobi utilitárias
 *     (bombas, boleadeira, estrepes, rede, tampões, tarja explosiva; introduz
 *     kind=TOOL e categorias EXPLOSIVO/AREA/EQUIPAMENTO via migration aditiva)
 *   - 6g (equipment-consumables.json) — 35 consumíveis (26 venenos cat 0-7 +
 *     4 pílulas + 1 antídoto template + 4 selos Fuuinjutsu templates;
 *     introduz kind=CONSUMABLE no catálogo, subtype veneno/pilula/antidoto/
 *     selo_fuuinjutsu, e _meta.poisonRules globais)
 *   - 6h (equipment-general.json) — 29 itens utilitários (6 ferramentas
 *     comuns + 2 recipientes + 4 kits + 3 pergaminhos + 2 campismo + 2
 *     animais + 3 veículos + 7 serviços; introduz kind=GENERAL no catálogo
 *     e 8 novos subtypes utilitários; sem refs cruzadas a aptidões/poderes)
 *   - 7a (equipment-armor-samurai.json) — 1 armadura exclusiva do Hijutsu
 *     Samurai (armadura_de_batalha_samurai; novo subtype armadura_pesada_hijutsu;
 *     prerequisites.aptitudes=[armadura_samurai], +20 absorção, +2 dureza corpo)
 *   - Cross-lote (6a + 6b + 6c + 6d + 6e + 6f + 6g + 6h + 7a) — integridade
 *     agregada do estado final do banco (149 codes únicos após upserts)
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type EquipmentKind = 'WEAPON' | 'ARMOR' | 'TOOL' | 'CONSUMABLE' | 'GENERAL' | 'AMMO';
type WeaponCategory =
  | 'DESARMADO'
  | 'LEVE'
  | 'MEDIANA'
  | 'LONGA'
  | 'PESADA'
  | 'ARREMESSO'
  | 'DISPARO'
  | 'LEVE_COMPLEMENTAR'
  | 'MUNICAO'
  | 'VARIAVEL'
  | 'EXPLOSIVO'
  | 'AREA'
  | 'EQUIPAMENTO';

interface EquipmentEntry {
  code: string;
  name: string;
  kind: EquipmentKind;
  subtype?: string | null;
  category?: WeaponCategory | null;
  price?: number | null;
  damage?: string | null;
  range?: string | null;
  critRange?: string | null;
  slots?: Record<string, unknown> | null;
  damageType?: string | null;
  prerequisites?: Record<string, unknown>;
  effects?: Record<string, unknown>;
  shortDescription?: string;
  description: string;
}

interface EquipmentSeed {
  _meta?: {
    unmodeledAptitudes?: string[];
    unmodeledPowers?: string[];
    intentionalUpserts?: string[];
    expectedItemCount?: number;
    globalGunpowderRules?: Record<string, unknown>;
    poisonRules?: Record<string, unknown>;
    [k: string]: unknown;
  };
  data: EquipmentEntry[];
}

const seedDir = join(process.cwd(), 'prisma/seed-data');
const seed6a = JSON.parse(
  readFileSync(join(seedDir, 'equipment-weapons-basic.json'), 'utf-8'),
) as EquipmentSeed;
const seed6b = JSON.parse(
  readFileSync(join(seedDir, 'equipment-special-weapons.json'), 'utf-8'),
) as EquipmentSeed;
const seed6c = JSON.parse(
  readFileSync(join(seedDir, 'equipment-firearms.json'), 'utf-8'),
) as EquipmentSeed;
const seed6d = JSON.parse(
  readFileSync(join(seedDir, 'equipment-weapons-gas.json'), 'utf-8'),
) as EquipmentSeed;
const seed6e = JSON.parse(
  readFileSync(join(seedDir, 'equipment-armor.json'), 'utf-8'),
) as EquipmentSeed;
const seed6f = JSON.parse(
  readFileSync(join(seedDir, 'equipment-shinobi-tools.json'), 'utf-8'),
) as EquipmentSeed;
const seed6g = JSON.parse(
  readFileSync(join(seedDir, 'equipment-consumables.json'), 'utf-8'),
) as EquipmentSeed;
const seed6h = JSON.parse(
  readFileSync(join(seedDir, 'equipment-general.json'), 'utf-8'),
) as EquipmentSeed;
const seed7aArmor = JSON.parse(
  readFileSync(join(seedDir, 'equipment-armor-samurai.json'), 'utf-8'),
) as EquipmentSeed;
const byCode = new Map(seed6a.data.map((e) => [e.code, e]));
const byCode6b = new Map(seed6b.data.map((e) => [e.code, e]));
const byCode6c = new Map(seed6c.data.map((e) => [e.code, e]));
const byCode6d = new Map(seed6d.data.map((e) => [e.code, e]));
const byCode6e = new Map(seed6e.data.map((e) => [e.code, e]));
const byCode6f = new Map(seed6f.data.map((e) => [e.code, e]));
const byCode6g = new Map(seed6g.data.map((e) => [e.code, e]));
const byCode6h = new Map(seed6h.data.map((e) => [e.code, e]));
const byCode7aArmor = new Map(seed7aArmor.data.map((e) => [e.code, e]));

// Estado final do banco após upserts em ordem 6a → 6b → 6c → 6d → 6e → 6f → 6g → 6h → 7a
// (mesma ordem de EQUIPMENT_FILES em prisma/seed.ts). Map por code; última
// escrita ganha (6d sobrescreve 12 entradas de 6a; 6e/6f/6g/6h/7a sem overlap).
const mergedByCode = new Map<string, EquipmentEntry>();
for (const seed of [seed6a, seed6b, seed6c, seed6d, seed6e, seed6f, seed6g, seed6h, seed7aArmor]) {
  for (const e of seed.data) mergedByCode.set(e.code, e);
}

describe('Seed: Equipamentos Lote 6a — Armas Simples + Marciais (equipment-weapons-basic.json)', () => {
  it('tem 42 itens catalogados (40 WEAPON + 2 AMMO)', () => {
    expect(seed6a.data).toHaveLength(42);
    expect(seed6a._meta?.expectedItemCount).toBe(42);
  });

  it('distribuição por kind bate com o README do lote', () => {
    const counts = seed6a.data.reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ WEAPON: 40, AMMO: 2 });
  });

  it('distribuição por subtype: 16 simples + 24 marciais + 2 municao', () => {
    const counts = seed6a.data.reduce<Record<string, number>>((acc, e) => {
      const key = e.subtype ?? '__nullish__';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ simples: 16, marcial: 24, municao: 2 });
  });

  it('distribuição por category bate com o README do lote', () => {
    const counts = seed6a.data.reduce<Record<string, number>>((acc, e) => {
      if (!e.category) return acc;
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      DESARMADO: 1,
      LEVE: 7, // 3 simples + 4 marciais
      LEVE_COMPLEMENTAR: 1, // kousen
      MEDIANA: 13, // 4 simples + 9 marciais
      LONGA: 4, // 2 simples + 2 marciais
      PESADA: 4, // 1 simples + 3 marciais
      ARREMESSO: 6, // 3 simples + 3 marciais
      DISPARO: 4, // 2 simples + 2 marciais
      MUNICAO: 2, // flechas + virotes
    });
  });

  it('Katana é WEAPON marcial MEDIANA com effects.daisho', () => {
    const katana = byCode.get('katana');
    expect(katana).toBeDefined();
    expect(katana?.kind).toBe('WEAPON');
    expect(katana?.subtype).toBe('marcial');
    expect(katana?.category).toBe('MEDIANA');
    expect(typeof katana?.effects?.daisho).toBe('string');
  });

  it('Kunai pode ser usada em CC e CD (alsoUsableAsCC=true)', () => {
    const kunai = byCode.get('kunai');
    expect(kunai).toBeDefined();
    expect(kunai?.category).toBe('ARREMESSO');
    expect(kunai?.effects?.alsoUsableAsCC).toBe(true);
  });

  it('Flechas e Virotes são AMMO com category MUNICAO', () => {
    const flechas = byCode.get('flechas');
    const virotes = byCode.get('virotes');
    expect(flechas?.kind).toBe('AMMO');
    expect(flechas?.category).toBe('MUNICAO');
    expect(virotes?.kind).toBe('AMMO');
    expect(virotes?.category).toBe('MUNICAO');
  });

  it('Aian Nakkuru tem energizarBonus=1 e afiarFuutonBonus=2', () => {
    const an = byCode.get('aian_nakkuru');
    expect(an).toBeDefined();
    expect(an?.effects?.energizarBonus).toBe(1);
    expect(an?.effects?.afiarFuutonBonus).toBe(2);
  });

  it('Nunchaku tem agarrarSemPenalidade=true', () => {
    const n = byCode.get('nunchaku');
    expect(n?.effects?.agarrarSemPenalidade).toBe(true);
  });

  it('Kousen é a única arma LEVE_COMPLEMENTAR do lote', () => {
    const kousen = byCode.get('kousen');
    expect(kousen?.category).toBe('LEVE_COMPLEMENTAR');
    const lcCount = seed6a.data.filter((e) => e.category === 'LEVE_COMPLEMENTAR');
    expect(lcCount).toHaveLength(1);
    expect(lcCount[0]?.code).toBe('kousen');
  });

  it('Tantō tem bypassPrerequisite documentado (pode usar sem atributo, -1 dano)', () => {
    const tanto = byCode.get('tanto');
    expect(tanto?.prerequisites?.bypassPrerequisite).toBe(
      'pode_usar_sem_atributo_mas_dano_-1',
    );
  });

  it('todos os codes são snake_case únicos', () => {
    const codes = seed6a.data.map((e) => e.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('_meta.unmodeledAptitudes contém ≥22 codes com prefixo usar_arma_', () => {
    const unmodeled = seed6a._meta?.unmodeledAptitudes ?? [];
    const usarArmaRefs = unmodeled.filter((c) => c.startsWith('usar_arma_'));
    expect(usarArmaRefs.length).toBeGreaterThanOrEqual(22);
    // Spot-check: refs específicos referenciados nos pré-reqs devem estar listados.
    for (const ref of ['usar_arma_katana', 'usar_arma_kousen', 'usar_arma_aian_nakkuru']) {
      expect(unmodeled).toContain(ref);
    }
  });

  it('todas as refs em prerequisites.aptitudes / aptitudes_one_of resolvem (5a-5d ∪ unmodeledAptitudes do 6a)', () => {
    // Lê aptidões reais dos lotes 5a-5d (codes + unmodeled deles, pra reproduzir
    // a união que o motor terá ao validar refs cruzadas).
    const aptitudeFiles = [
      'aptitudes-common-combat.json',
      'aptitudes-clan-restricted.json',
      'aptitudes-manuevers.json',
      'aptitudes-meta-shinobi.json',
      'aptitudes-patches.json',
    ];
    const known = new Set<string>(seed6a._meta?.unmodeledAptitudes ?? []);
    for (const f of aptitudeFiles) {
      const parsed = JSON.parse(readFileSync(join(seedDir, f), 'utf-8')) as {
        _meta?: { unmodeledAptitudes?: string[] };
        data: Array<{ code: string }>;
      };
      for (const a of parsed.data) known.add(a.code);
      for (const u of parsed._meta?.unmodeledAptitudes ?? []) known.add(u);
    }

    const orphans: string[] = [];
    for (const e of seed6a.data) {
      const lists = [
        e.prerequisites?.aptitudes,
        e.prerequisites?.aptitudes_one_of,
      ];
      for (const list of lists) {
        if (!Array.isArray(list)) continue;
        for (const ref of list) {
          if (typeof ref === 'string' && !known.has(ref)) {
            orphans.push(`${e.code} -> ${ref}`);
          }
        }
      }
    }
    expect(orphans).toEqual([]);
  });
});

describe('Seed: Equipamentos Lote 6b — Armas Especiais (equipment-special-weapons.json)', () => {
  it('tem 9 itens catalogados (7 Espadas da Névoa + Kusanagi + Gunbai)', () => {
    expect(seed6b.data).toHaveLength(9);
    expect(seed6b._meta?.expectedItemCount).toBe(9);
  });

  it('todos os 9 itens são WEAPON com subtype="especial"', () => {
    for (const e of seed6b.data) {
      expect(e.kind).toBe('WEAPON');
      expect(e.subtype).toBe('especial');
    }
  });

  it('distribuição por category: PESADA=4, MEDIANA=3, LONGA=1, VARIAVEL=1', () => {
    const counts = seed6b.data.reduce<Record<string, number>>((acc, e) => {
      if (!e.category) return acc;
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ PESADA: 4, MEDIANA: 3, LONGA: 1, VARIAVEL: 1 });
  });

  it('7 entries têm effects.isOneOfSevenSwordsOfMist=true (lista taxativa)', () => {
    const expected = new Set([
      'kubikiribocho',
      'samehada',
      'nuibari',
      'shibuki',
      'hiramekarei',
      'kabutowari',
      'kiba',
    ]);
    const actual = new Set(
      seed6b.data
        .filter((e) => e.effects?.isOneOfSevenSwordsOfMist === true)
        .map((e) => e.code),
    );
    expect(actual).toEqual(expected);
    expect(actual.size).toBe(7);
  });

  it('Kubikiribōchō tem damage "+6" e specialAbility "Decapitar"', () => {
    const k = byCode6b.get('kubikiribocho');
    expect(k).toBeDefined();
    expect(k?.damage).toBe('+6');
    expect(k?.category).toBe('PESADA');
    const abilities = (k?.effects?.specialAbilities ?? []) as Array<{ name: string }>;
    expect(abilities.some((a) => a.name === 'Decapitar')).toBe(true);
  });

  it('Samehada tem effects.isLivingWeapon=true', () => {
    const s = byCode6b.get('samehada');
    expect(s?.effects?.isLivingWeapon).toBe(true);
  });

  it('Kusanagi é a única VARIAVEL com damage="variavel"', () => {
    const k = byCode6b.get('kusanagi');
    expect(k?.category).toBe('VARIAVEL');
    expect(k?.damage).toBe('variavel');
    const variavelEntries = seed6b.data.filter((e) => e.category === 'VARIAVEL');
    expect(variavelEntries).toHaveLength(1);
    expect(variavelEntries[0]?.code).toBe('kusanagi');
  });

  it('Hiramekarei tem usageLimits estruturado (arma_gigante = "3/dia")', () => {
    const h = byCode6b.get('hiramekarei');
    const limits = h?.effects?.usageLimits as Record<string, string> | undefined;
    expect(limits).toBeDefined();
    expect(limits?.arma_gigante).toBe('3/dia');
  });

  it('Gunbai tem 5 specialAbilities', () => {
    const g = byCode6b.get('gunbai');
    const abilities = (g?.effects?.specialAbilities ?? []) as unknown[];
    expect(abilities).toHaveLength(5);
  });

  it('todos os codes do 6b são snake_case únicos', () => {
    const codes = seed6b.data.map((e) => e.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('_meta.unmodeledAptitudes contém 9 refs usar_arma_<arma>', () => {
    const unmodeled = seed6b._meta?.unmodeledAptitudes ?? [];
    expect(unmodeled).toHaveLength(9);
    for (const ref of unmodeled) {
      expect(ref).toMatch(/^usar_arma_/);
    }
    for (const ref of [
      'usar_arma_kubikiribocho',
      'usar_arma_kusanagi',
      'usar_arma_gunbai',
    ]) {
      expect(unmodeled).toContain(ref);
    }
  });
});

describe('Seed: Equipamentos Lote 6c — Armas de Fogo (equipment-firearms.json)', () => {
  const FIREARM_CODES = [
    'pistola_de_pederneira_pequena',
    'pistola_de_pederneira',
    'bacamarte',
    'arcabuz',
    'mosquete',
  ];

  it('tem 7 itens catalogados (5 firearms + munição + Disparador Oculto)', () => {
    expect(seed6c.data).toHaveLength(7);
    expect(seed6c._meta?.expectedItemCount).toBe(7);
  });

  it('distribuição por kind: WEAPON=6, AMMO=1', () => {
    const counts = seed6c.data.reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ WEAPON: 6, AMMO: 1 });
  });

  it('distribuição por category: DISPARO=6, MUNICAO=1', () => {
    const counts = seed6c.data.reduce<Record<string, number>>((acc, e) => {
      if (!e.category) return acc;
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ DISPARO: 6, MUNICAO: 1 });
  });

  it('distribuição por subtype: fogo=5, marcial=1 (Disparador), municao=1', () => {
    const counts = seed6c.data.reduce<Record<string, number>>((acc, e) => {
      const key = e.subtype ?? '__nullish__';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ fogo: 5, marcial: 1, municao: 1 });
  });

  it('as 5 firearms têm isFirearm=true, manuseio numérico e gunpowderRulesRef=true', () => {
    for (const code of FIREARM_CODES) {
      const f = byCode6c.get(code);
      expect(f, `${code} deve existir`).toBeDefined();
      expect(f?.effects?.isFirearm).toBe(true);
      expect(typeof f?.effects?.manuseio).toBe('number');
      expect(f?.effects?.gunpowderRulesRef).toBe(true);
    }
  });

  it('Mosquete tem manuseio 22 e dano +5 (mais poderosa)', () => {
    const m = byCode6c.get('mosquete');
    expect(m?.effects?.manuseio).toBe(22);
    expect(m?.damage).toBe('+5');
  });

  it('Bacamarte tem dano escalonado "+4(+5)[+6]" e manuseio 18', () => {
    const b = byCode6c.get('bacamarte');
    expect(b?.damage).toBe('+4(+5)[+6]');
    expect(b?.effects?.manuseio).toBe(18);
  });

  it('Pistola Pequena tem manuseio 10 (mais leve)', () => {
    const p = byCode6c.get('pistola_de_pederneira_pequena');
    expect(p?.effects?.manuseio).toBe(10);
  });

  it('Munição de Arma de Fogo é compatível com as 5 firearms', () => {
    const ammo = byCode6c.get('municao_arma_de_fogo');
    expect(ammo?.kind).toBe('AMMO');
    expect(ammo?.category).toBe('MUNICAO');
    const compat = ammo?.effects?.compatibleWith as string[] | undefined;
    expect(compat).toBeDefined();
    expect(new Set(compat)).toEqual(new Set(FIREARM_CODES));
  });

  it('Disparador Oculto NÃO é firearm (subtype="marcial", isNotFirearm truthy)', () => {
    const d = byCode6c.get('disparador_oculto');
    expect(d?.subtype).toBe('marcial');
    expect(d?.effects?.isFirearm).toBeUndefined();
    expect(d?.effects?.isNotFirearm).toBeTruthy();
  });

  it('_meta.globalGunpowderRules definido como objeto', () => {
    const rules = seed6c._meta?.globalGunpowderRules;
    expect(rules).toBeDefined();
    expect(typeof rules).toBe('object');
    expect(Array.isArray((rules as Record<string, unknown>)?.failureChances)).toBe(true);
  });

  it('_meta.unmodeledAptitudes contém usar_arma_disparador_oculto', () => {
    const unmodeled = seed6c._meta?.unmodeledAptitudes ?? [];
    expect(unmodeled).toContain('usar_arma_disparador_oculto');
  });

  it('todos os codes do 6c são snake_case únicos', () => {
    const codes = seed6c.data.map((e) => e.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Equipamentos Lote 6d — Novas + Revisões GAS (equipment-weapons-gas.json)', () => {
  const NEW_CODES = [
    'gladio',
    'tachi',
    'chakram',
    'kusarigama',
    'lamina_oculta',
    'pa_de_monge',
    'shuang_gou',
    'tekko_kagi',
    'yari',
    'otsuchi',
    'arco_longo',
  ];
  const REVIEW_CODES = [
    'cimitarra',
    'florete',
    'ninja_to',
    'nunchaku',
    'machado',
    'martelo_de_guerra',
    'leque_gigante',
    'espada_de_duas_laminas',
    'chicote',
    'corrente_com_cravos',
    'espada_longa',
    'besta_pesada',
  ];

  it('tem 23 entries (11 novas + 12 revisões)', () => {
    expect(seed6d.data).toHaveLength(23);
    expect(seed6d._meta?.expectedItemCount).toBe(23);
  });

  it('11 entries com effects._newInGAS=true; 12 com effects._gasReview=true', () => {
    const newEntries = seed6d.data.filter((e) => e.effects?._newInGAS === true);
    const reviewEntries = seed6d.data.filter((e) => e.effects?._gasReview === true);
    expect(newEntries).toHaveLength(11);
    expect(reviewEntries).toHaveLength(12);
    expect(new Set(newEntries.map((e) => e.code))).toEqual(new Set(NEW_CODES));
    expect(new Set(reviewEntries.map((e) => e.code))).toEqual(new Set(REVIEW_CODES));
  });

  it('_meta.intentionalUpserts bate exatamente com os codes das 12 revisões', () => {
    const declared = seed6d._meta?.intentionalUpserts ?? [];
    expect(new Set(declared)).toEqual(new Set(REVIEW_CODES));
  });

  it('distribuição por subtype das 11 novas: simples=1 (gladio), marcial=10', () => {
    const counts = NEW_CODES.reduce<Record<string, number>>((acc, code) => {
      const e = byCode6d.get(code);
      const key = e?.subtype ?? '__nullish__';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ simples: 1, marcial: 10 });
  });

  it('Ninja-tō revisada: subtype=marcial, category=LEVE, damage=+1, crit=14-15-16', () => {
    const n = byCode6d.get('ninja_to');
    expect(n?.subtype).toBe('marcial');
    expect(n?.category).toBe('LEVE');
    expect(n?.damage).toBe('+1');
    expect(n?.critRange).toBe('14-15-16');
  });

  it('Chicote revisado: range=6m, damage=+1', () => {
    const c = byCode6d.get('chicote');
    expect(c?.range).toBe('6m');
    expect(c?.damage).toBe('+1');
  });

  it('Martelo de Guerra revisado: effects.ignoreDureza === 2', () => {
    const m = byCode6d.get('martelo_de_guerra');
    expect(m?.effects?.ignoreDureza).toBe(2);
  });

  it('Leque Gigante revisado: freeAptitudesForFuuton inclui "tecnica_poderosa"', () => {
    const l = byCode6d.get('leque_gigante');
    const free = l?.effects?.freeAptitudesForFuuton as string[] | undefined;
    expect(free).toBeDefined();
    expect(free).toContain('tecnica_poderosa');
  });

  it('Tachi (nova) tem minNC=6 e exige Força 6 + duas mãos', () => {
    const t = byCode6d.get('tachi');
    expect(t?.effects?.minNC).toBe(6);
    expect(t?.effects?.twoHanded).toBe(true);
  });

  it('Yari (nova) ignora 1 ponto de dureza de corpo', () => {
    const y = byCode6d.get('yari');
    expect(y?.effects?.ignoreDurezaCorpo).toBe(1);
  });

  it('_meta.unmodeledAptitudes contém refs parametrizadas usar_arma_<X> + guerreiro_<X> (cleanup expandido na 7f2 fechou todas as refs do 6d)', () => {
    const unmodeled = seed6d._meta?.unmodeledAptitudes ?? [];
    expect(unmodeled.length).toBeGreaterThanOrEqual(11);
    for (const ref of unmodeled) {
      expect(ref).toMatch(/^(usar_arma_|guerreiro_)/);
    }
    for (const ref of [
      'usar_arma_tachi',
      'usar_arma_yari',
      'usar_arma_arco_longo',
      'usar_arma_ninja_to', // novo via revisão (em 6a, ninja_to era simples sem usar_arma)
    ]) {
      expect(unmodeled).toContain(ref);
    }
  });

  it('todos os codes do 6d são snake_case únicos', () => {
    const codes = seed6d.data.map((e) => e.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Equipamentos Lote 6e — Armaduras (equipment-armor.json)', () => {
  it('tem 6 itens catalogados (4 leves + 2 pesadas)', () => {
    expect(seed6e.data).toHaveLength(6);
    expect(seed6e._meta?.expectedItemCount).toBe(6);
  });

  it('todos os 6 itens são kind=ARMOR e category=null (armadura não tem WeaponCategory)', () => {
    for (const e of seed6e.data) {
      expect(e.kind).toBe('ARMOR');
      expect(e.category).toBeNull();
    }
  });

  it('distribuição por subtype: vestuario=2, colete=2, armadura_pesada=2', () => {
    const counts = seed6e.data.reduce<Record<string, number>>((acc, e) => {
      const key = e.subtype ?? '__nullish__';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ vestuario: 2, colete: 2, armadura_pesada: 2 });
  });

  it('distribuição por effects.armorType: leve=4, pesada=2', () => {
    const counts = seed6e.data.reduce<Record<string, number>>((acc, e) => {
      const t = e.effects?.armorType as string | undefined;
      if (!t) return acc;
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ leve: 4, pesada: 2 });
  });

  it('Armadura de Batalha Reforçada: +20 absorção, "-2(-4)" penalty, -2 compartimento', () => {
    const r = byCode6e.get('armadura_de_batalha_reforcada');
    expect(r).toBeDefined();
    expect(r?.effects?.absorptionBonus).toBe(20);
    expect(r?.effects?.armorPenalty).toBe('-2(-4)');
    expect(r?.effects?.compartmentModifier).toBe(-2);
  });

  it('Colete Ninja tem +1 compartimento (bolsos adicionais)', () => {
    const c = byCode6e.get('colete_ninja');
    expect(c?.effects?.compartmentModifier).toBe(1);
  });

  it('Manopla tem blocksWithoutInjury truthy (permite Bloqueio sem ferimentos)', () => {
    const m = byCode6e.get('manopla');
    expect(m?.effects?.blocksWithoutInjury).toBeTruthy();
  });

  it('todos os codes do 6e são snake_case únicos', () => {
    const codes = seed6e.data.map((e) => e.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Equipamentos Lote 6f — Ferramentas Shinobi Utilitárias (equipment-shinobi-tools.json)', () => {
  it('tem 9 itens catalogados', () => {
    expect(seed6f.data).toHaveLength(9);
    expect(seed6f._meta?.expectedItemCount).toBe(9);
  });

  it('todos os 9 itens são kind=TOOL, subtype=ferramenta_shinobi_utilitaria, isShinobiUtilityTool=true', () => {
    for (const e of seed6f.data) {
      expect(e.kind).toBe('TOOL');
      expect(e.subtype).toBe('ferramenta_shinobi_utilitaria');
      expect(e.effects?.isShinobiUtilityTool).toBe(true);
    }
  });

  it('distribuição por category: EXPLOSIVO=5, ARREMESSO=2, AREA=1, EQUIPAMENTO=1', () => {
    const counts = seed6f.data.reduce<Record<string, number>>((acc, e) => {
      if (!e.category) return acc;
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ EXPLOSIVO: 5, ARREMESSO: 2, AREA: 1, EQUIPAMENTO: 1 });
  });

  it('Tarja Explosiva tem 3 usageModes (Remota, Kunai, Colar)', () => {
    const t = byCode6f.get('tarja_explosiva');
    const modes = t?.effects?.usageModes as Array<{ name: string }> | undefined;
    expect(Array.isArray(modes)).toBe(true);
    expect(modes).toHaveLength(3);
    const names = new Set((modes ?? []).map((m) => m.name));
    expect(names).toEqual(new Set(['Ativação Remota', 'Lançar com Kunai', 'Colar em Inimigo']));
  });

  it('Bomba Som de Trovão: audibleDistance "1km" e protectedBy inclui tampoes_de_ouvido', () => {
    const b = byCode6f.get('bomba_som_de_trovao');
    expect(b?.effects?.audibleDistance).toBe('1km');
    const protectedBy = b?.effects?.protectedBy as string[] | undefined;
    expect(protectedBy).toContain('tampoes_de_ouvido');
  });

  it('Tampões de Ouvido: donActionWithSaqueRapido="livre", category=EQUIPAMENTO', () => {
    const t = byCode6f.get('tampoes_de_ouvido');
    expect(t?.category).toBe('EQUIPAMENTO');
    expect(t?.effects?.donActionWithSaqueRapido).toBe('livre');
  });

  it('Estrepes: única arma AREA do lote, 1 dano por metro percorrido', () => {
    const e = byCode6f.get('estrepes');
    expect(e?.category).toBe('AREA');
    expect(e?.damage).toBe('1');
    const areaCount = seed6f.data.filter((x) => x.category === 'AREA');
    expect(areaCount).toHaveLength(1);
  });

  it('Rede tem effects.needsDeepResearch=true (modelagem básica + flag pra motor)', () => {
    const r = byCode6f.get('rede');
    expect(r?.effects?.needsDeepResearch).toBe(true);
  });

  it('Boleadeira: ARREMESSO, exige Des 10, aplica condição "caido"', () => {
    const b = byCode6f.get('boleadeira');
    expect(b?.category).toBe('ARREMESSO');
    expect((b?.prerequisites?.attributes as Record<string, number> | undefined)?.des).toBe(10);
    expect(b?.effects?.condition).toBe('caido');
  });

  it('todos os codes do 6f são snake_case únicos', () => {
    const codes = seed6f.data.map((e) => e.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Equipamentos Lote 6g — Consumíveis (equipment-consumables.json)', () => {
  const SPECIAL_DOKUJUTSU_CODES = [
    'veneno_inflamacao_nasal', // Cat 0
    'veneno_tontura', // Cat 2
    'veneno_ocular', // Cat 5
    'morte_rubra', // Cat 7
    'veneno_escorpiao_vermelho', // Cat 7
    'veneno_salamandra_negra', // Cat 7
  ];
  const CAT7_CODES = ['morte_rubra', 'veneno_escorpiao_vermelho', 'veneno_salamandra_negra'];

  it('tem 35 itens catalogados (26 venenos + 4 pílulas + 1 antídoto + 4 selos)', () => {
    expect(seed6g.data).toHaveLength(35);
    expect(seed6g._meta?.expectedItemCount).toBe(35);
  });

  it('todos os 35 itens são kind=CONSUMABLE e category=null', () => {
    for (const e of seed6g.data) {
      expect(e.kind).toBe('CONSUMABLE');
      expect(e.category).toBeNull();
    }
  });

  it('distribuição por subtype: veneno=26, pilula=4, antidoto=1, selo_fuuinjutsu=4', () => {
    const counts = seed6g.data.reduce<Record<string, number>>((acc, e) => {
      const key = e.subtype ?? '__nullish__';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ veneno: 26, pilula: 4, antidoto: 1, selo_fuuinjutsu: 4 });
  });

  it('distribuição de venenos por effects.poisonCategory (cat 0-7)', () => {
    const counts = seed6g.data
      .filter((e) => e.subtype === 'veneno')
      .reduce<Record<string, number>>((acc, e) => {
        const cat = String(e.effects?.poisonCategory ?? '__nullish__');
        acc[cat] = (acc[cat] ?? 0) + 1;
        return acc;
      }, {});
    expect(counts).toEqual({
      '0': 4,
      '1': 2,
      '2': 5,
      '3': 3,
      '4': 2,
      '5': 4,
      '6': 3,
      '7': 3,
    });
  });

  it('6 venenos com requiresDokujutsu=true (taxativo: Inflamação Nasal, Tontura, Ocular, 3 Cat 7)', () => {
    const actual = new Set(
      seed6g.data
        .filter((e) => e.effects?.requiresDokujutsu === true)
        .map((e) => e.code),
    );
    expect(actual).toEqual(new Set(SPECIAL_DOKUJUTSU_CODES));
    expect(actual.size).toBe(6);
  });

  it('3 venenos Cat 7 são letais e usam noThreeSuccessRule (truthy, formato varia entre boolean e string descritiva)', () => {
    for (const code of CAT7_CODES) {
      const v = byCode6g.get(code);
      expect(v, `${code} deve existir`).toBeDefined();
      expect(v?.effects?.poisonCategory).toBe(7);
      // morte_rubra usa string descritiva; os outros 2 usam boolean true.
      // Motor trata como flag presente independente do formato.
      expect(v?.effects?.noThreeSuccessRule).toBeTruthy();
      expect(v?.effects?.isLethal).toBe(true);
    }
  });

  it('Morte Rubra (Cat 7) requer Dokujutsu 10 e Venefício 20', () => {
    const mr = byCode6g.get('morte_rubra');
    expect(mr).toBeDefined();
    expect(mr?.effects?.poisonCategory).toBe(7);
    expect(mr?.effects?.requiresDokujutsu).toBe(true);
    expect(mr?.effects?.dokujutsuLevel).toBe(10);
    expect(mr?.effects?.isLethal).toBe(true);
    expect((mr?.prerequisites?.powers as Record<string, number> | undefined)?.dokujutsu).toBe(10);
    expect((mr?.prerequisites?.skills as Record<string, number> | undefined)?.venefico).toBe(20);
  });

  it('Pílula Pimenta Vermelha: clanFreeAccess akimichi, lethalRisk truthy, calorie Nv3, price 0', () => {
    const p = byCode6g.get('pilula_pimenta_vermelha');
    expect(p?.effects?.clanFreeAccess).toBe('akimichi');
    expect(p?.effects?.lethalRisk).toBeTruthy();
    expect(p?.effects?.enablesCalorieControl).toBe(3);
    expect(p?.price).toBe(0);
  });

  it('Pílulas do Soldado: 10 itens/frasco, preço 50, regra de overdose definida', () => {
    const p = byCode6g.get('pilulas_do_soldado');
    const slots = p?.slots as Record<string, unknown> | undefined;
    expect(slots?.items).toBe(10);
    expect(p?.price).toBe(50);
    expect(p?.effects?.overdose).toBeTruthy();
  });

  it('Antídoto Genérico: subtype=antidoto, price=null, priceDependsOnTargetCategory cobre cat 0-7', () => {
    const a = byCode6g.get('antidoto_generico');
    expect(a?.subtype).toBe('antidoto');
    expect(a?.price).toBeNull();
    expect(a?.effects?.isAntidote).toBe(true);
    const priceMap = a?.effects?.priceDependsOnTargetCategory as
      | Record<string, number>
      | undefined;
    expect(priceMap).toBeDefined();
    expect(Object.keys(priceMap ?? {}).sort()).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
  });

  it('Selo Bakudan: Fuuinjutsu Nv4, damageType=fogo, isItemTemplate truthy', () => {
    const s = byCode6g.get('selo_bakudan');
    expect((s?.prerequisites?.powers as Record<string, number> | undefined)?.fuuinjutsu).toBe(4);
    expect(s?.effects?.fuuinjutsuLevel).toBe(4);
    expect(s?.effects?.isItemTemplate).toBe(true);
    expect(s?.damageType).toBe('fogo');
  });

  it('Selo Ninjutsu no Wana: Fuuinjutsu Nv6 + Mecanismos 10', () => {
    const s = byCode6g.get('selo_ninjutsu_no_wana');
    expect((s?.prerequisites?.powers as Record<string, number> | undefined)?.fuuinjutsu).toBe(6);
    expect((s?.prerequisites?.skills as Record<string, number> | undefined)?.mecanismos).toBe(10);
  });

  it('os 4 selos Fuuinjutsu são templates (isItemTemplate=true + userInstanceParams)', () => {
    const SEALS = ['selo_misshi', 'selo_bakudan', 'selo_gensou_no_in', 'selo_ninjutsu_no_wana'];
    for (const code of SEALS) {
      const s = byCode6g.get(code);
      expect(s, `${code} deve existir`).toBeDefined();
      expect(s?.subtype).toBe('selo_fuuinjutsu');
      expect(s?.effects?.isItemTemplate).toBe(true);
      const params = s?.effects?.userInstanceParams as unknown[] | undefined;
      expect(Array.isArray(params)).toBe(true);
      expect((params ?? []).length).toBeGreaterThan(0);
    }
  });

  it('_meta.poisonRules definido com chaves esperadas (categoriesTable, contagionMethods, dokujutsuModifiers)', () => {
    const rules = seed6g._meta?.poisonRules as Record<string, unknown> | undefined;
    expect(rules).toBeDefined();
    expect(rules?.categoriesTable).toBeDefined();
    expect(rules?.contagionMethods).toBeDefined();
    expect(rules?.dokujutsuModifiers).toBeDefined();
  });

  it('todos os codes do 6g são snake_case únicos', () => {
    const codes = seed6g.data.map((e) => e.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Equipamentos Lote 6g — refs cruzadas reais (zero unmodeled)', () => {
  it('_meta.unmodeledAptitudes e _meta.unmodeledPowers vazios (todas refs são reais)', () => {
    expect(seed6g._meta?.unmodeledAptitudes ?? []).toEqual([]);
    expect(seed6g._meta?.unmodeledPowers ?? []).toEqual([]);
  });

  it('refs em prerequisites.powers resolvem em powers.json ∪ powers-additional.json', () => {
    const knownPowers = new Set<string>();
    for (const f of ['powers.json', 'powers-additional.json']) {
      const parsed = JSON.parse(readFileSync(join(seedDir, f), 'utf-8')) as {
        data: Array<{ code: string }>;
      };
      for (const p of parsed.data) knownPowers.add(p.code);
    }
    const orphans: string[] = [];
    for (const e of seed6g.data) {
      const req = e.prerequisites?.powers;
      if (req && typeof req === 'object' && !Array.isArray(req)) {
        for (const code of Object.keys(req as Record<string, unknown>)) {
          if (!knownPowers.has(code)) orphans.push(`${e.code} -> ${code}`);
        }
      }
    }
    expect(orphans).toEqual([]);
  });
});

describe('Seed: Equipamentos Lote 6h — Equipamento Geral (equipment-general.json)', () => {
  const SERVICE_CODES = [
    'estabulo_por_dia',
    'conducao_terrestre',
    'conducao_maritima',
    'bebida',
    'estadia_por_noite',
    'refeicao',
    'mensageiro',
  ];
  const KIT_CODES = [
    'kit_de_artesao',
    'kit_de_ferramentas',
    'kit_de_medicamentos',
    'kit_de_laboratorio',
  ];

  it('tem 29 itens catalogados', () => {
    expect(seed6h.data).toHaveLength(29);
    expect(seed6h._meta?.expectedItemCount).toBe(29);
  });

  it('todos os 29 itens são kind=GENERAL e category=null', () => {
    for (const e of seed6h.data) {
      expect(e.kind).toBe('GENERAL');
      expect(e.category).toBeNull();
    }
  });

  it('distribuição por subtype: 8 valores (ferramenta_comum/recipiente/kit/pergaminho_papel/campismo/animal/veiculo/servico)', () => {
    const counts = seed6h.data.reduce<Record<string, number>>((acc, e) => {
      const key = e.subtype ?? '__nullish__';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      ferramenta_comum: 6,
      recipiente: 2,
      kit: 4,
      pergaminho_papel: 3,
      campismo: 2,
      animal: 2,
      veiculo: 3,
      servico: 7,
    });
  });

  it('7 serviços têm slots=null e effects.isService=true (set taxativo)', () => {
    const actual = new Set(
      seed6h.data
        .filter((e) => e.subtype === 'servico')
        .map((e) => e.code),
    );
    expect(actual).toEqual(new Set(SERVICE_CODES));
    for (const code of SERVICE_CODES) {
      const s = byCode6h.get(code);
      expect(s, `${code} deve existir`).toBeDefined();
      expect(s?.slots).toBeNull();
      expect(s?.effects?.isService).toBe(true);
    }
  });

  it('4 kits têm effects.uses=5 (set taxativo)', () => {
    const actual = new Set(
      seed6h.data
        .filter((e) => e.subtype === 'kit')
        .map((e) => e.code),
    );
    expect(actual).toEqual(new Set(KIT_CODES));
    for (const code of KIT_CODES) {
      const k = byCode6h.get(code);
      expect(k?.effects?.uses).toBe(5);
    }
  });

  it('2 animais (cao_de_guarda, cavalo) têm slots=null', () => {
    const animals = seed6h.data.filter((e) => e.subtype === 'animal');
    expect(new Set(animals.map((a) => a.code))).toEqual(new Set(['cao_de_guarda', 'cavalo']));
    for (const a of animals) {
      expect(a.slots).toBeNull();
    }
  });

  it('3 veículos (carroca, carruagem, canoa) têm slots=null', () => {
    const vehicles = seed6h.data.filter((e) => e.subtype === 'veiculo');
    expect(new Set(vehicles.map((v) => v.code))).toEqual(
      new Set(['carroca', 'carruagem', 'canoa']),
    );
    for (const v of vehicles) {
      expect(v.slots).toBeNull();
    }
  });

  it('Mochila: recipiente, slots=null, +4 compartimentos, 2 Ryos', () => {
    const m = byCode6h.get('mochila');
    expect(m?.subtype).toBe('recipiente');
    expect(m?.slots).toBeNull();
    expect(m?.effects?.compartmentBonus).toBe(4);
    expect(m?.price).toBe(2);
  });

  it('Coldre/Bolsa com Cinto: +1 compartimento', () => {
    const c = byCode6h.get('coldre_bolsa_com_cinto');
    expect(c?.effects?.compartmentBonus).toBe(1);
  });

  it('Caneta: slots=null, negligibleWeight=true (precedente dos Tampões 6f)', () => {
    const c = byCode6h.get('caneta');
    expect(c?.slots).toBeNull();
    expect(c?.effects?.negligibleWeight).toBe(true);
  });

  it('Tarja Especial: pergaminho_papel, compatibleWith inclui fuuinjutsu_nv3_plus, preço 10', () => {
    const t = byCode6h.get('tarja_especial');
    expect(t?.subtype).toBe('pergaminho_papel');
    const compat = t?.effects?.compatibleWith as string[] | undefined;
    expect(compat).toContain('fuuinjutsu_nv3_plus');
    expect(t?.price).toBe(10);
  });

  it('Bebida: servico, isService=true, slots=null, 1 Ryo', () => {
    const b = byCode6h.get('bebida');
    expect(b?.subtype).toBe('servico');
    expect(b?.effects?.isService).toBe(true);
    expect(b?.slots).toBeNull();
    expect(b?.price).toBe(1);
  });

  it('todos os codes do 6h são snake_case únicos', () => {
    const codes = seed6h.data.map((e) => e.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe('Seed: Equipamentos Lote 6h — refs cruzadas reais (zero unmodeled)', () => {
  it('_meta.unmodeledAptitudes e _meta.unmodeledPowers vazios', () => {
    expect(seed6h._meta?.unmodeledAptitudes ?? []).toEqual([]);
    expect(seed6h._meta?.unmodeledPowers ?? []).toEqual([]);
  });

  it('zero entradas têm prerequisites.aptitudes/aptitudes_one_of/powers populados (lote utilitário)', () => {
    const withRefs: string[] = [];
    for (const e of seed6h.data) {
      const p = e.prerequisites ?? {};
      const apt = Array.isArray(p.aptitudes) ? p.aptitudes : [];
      const aptOneOf = Array.isArray(p.aptitudes_one_of) ? p.aptitudes_one_of : [];
      const powers = p.powers as Record<string, unknown> | undefined;
      if (apt.length > 0 || aptOneOf.length > 0 || (powers && Object.keys(powers).length > 0)) {
        withRefs.push(e.code);
      }
    }
    expect(withRefs).toEqual([]);
  });
});

describe('Seed: Equipamentos Lote 7a — Armadura de Batalha Samurai (equipment-armor-samurai.json)', () => {
  it('tem exatamente 1 item catalogado (armadura_de_batalha_samurai)', () => {
    expect(seed7aArmor.data).toHaveLength(1);
    expect(seed7aArmor._meta?.expectedItemCount).toBe(1);
    expect(byCode7aArmor.get('armadura_de_batalha_samurai')).toBeDefined();
  });

  it('kind=ARMOR, subtype=armadura_pesada_hijutsu, category=null, preço 600 Ryos', () => {
    const a = byCode7aArmor.get('armadura_de_batalha_samurai');
    expect(a?.kind).toBe('ARMOR');
    expect(a?.subtype).toBe('armadura_pesada_hijutsu');
    expect(a?.category).toBeNull();
    expect(a?.price).toBe(600);
  });

  it('prerequisites depende da aptidão armadura_samurai (não de atributo direto)', () => {
    const a = byCode7aArmor.get('armadura_de_batalha_samurai');
    const apts = a?.prerequisites?.aptitudes as string[] | undefined;
    expect(apts).toEqual(['armadura_samurai']);
    expect(a?.prerequisites?.attributes_one_of).toBeUndefined();
    expect(a?.prerequisites?.attributes).toBeUndefined();
  });

  it('effects: +20 absorção, +2 dureza corpo, armorPenalty="0(-5)", -3 compartimentos', () => {
    const a = byCode7aArmor.get('armadura_de_batalha_samurai');
    expect(a?.effects?.absorptionBonus).toBe(20);
    expect(a?.effects?.bodyHardnessBonus).toBe(2);
    expect(a?.effects?.armorPenalty).toBe('0(-5)');
    expect(a?.effects?.compartmentModifier).toBe(-3);
    expect(a?.effects?.armorType).toBe('pesada');
  });

  it('specialFeatures: 4 bainhas grátis (2 leves + 2 medianas) sem penalidade + capacete-respirador (+3 vs veneno)', () => {
    const a = byCode7aArmor.get('armadura_de_batalha_samurai');
    const features = a?.effects?.specialFeatures as {
      extraSwordSheaths?: {
        count?: number;
        categories?: { leves?: number; medianas?: number };
        noEncumbrancePenalty?: boolean;
        noMovementPenalty?: boolean;
      };
      helmet?: { includes?: string; respiratorBonus?: string };
    } | undefined;
    expect(features?.extraSwordSheaths?.count).toBe(4);
    expect(features?.extraSwordSheaths?.categories).toEqual({ leves: 2, medianas: 2 });
    expect(features?.extraSwordSheaths?.noEncumbrancePenalty).toBe(true);
    expect(features?.extraSwordSheaths?.noMovementPenalty).toBe(true);
    expect(features?.helmet?.includes).toBe('mascara_com_radio_embutido');
    expect(features?.helmet?.respiratorBonus).toMatch(/\+3/);
  });

  it('depende da aptidão armadura_samurai do mesmo lote 7a (ref cruzada resolve)', () => {
    const seedSamurai = JSON.parse(
      readFileSync(join(seedDir, 'aptitudes-samurai.json'), 'utf-8'),
    ) as { data: Array<{ code: string }> };
    const samuraiCodes = new Set(seedSamurai.data.map((a) => a.code));
    expect(samuraiCodes.has('armadura_samurai')).toBe(true);
  });
});

describe('Seed: Equipamentos — integridade cross-lote (6a + 6b + 6c + 6d + 6e + 6f + 6g + 6h + 7a)', () => {
  it('total agregado de codes únicos é 149 (148 + 1; 7a sem overlap)', () => {
    expect(mergedByCode.size).toBe(149);
  });

  it('distribuição final por kind: WEAPON=66, AMMO=3, ARMOR=7, TOOL=9, CONSUMABLE=35, GENERAL=29 (7a adiciona +1 ARMOR)', () => {
    const counts: Record<string, number> = {};
    for (const e of mergedByCode.values()) {
      counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    }
    expect(counts).toEqual({
      WEAPON: 66,
      AMMO: 3,
      ARMOR: 7,
      TOOL: 9,
      CONSUMABLE: 35,
      GENERAL: 29,
    });
  });

  it('distribuição final por category (inalterada pelo 7a — armadura tem category=null)', () => {
    const counts: Record<string, number> = {};
    for (const e of mergedByCode.values()) {
      if (!e.category) continue;
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    expect(counts).toEqual({
      DESARMADO: 1,
      LEVE: 10, // 7 (6a) + 1 (gladio 6d) + 1 (tachi 6d) + 1 (ninja_to migrado de MEDIANA)
      LEVE_COMPLEMENTAR: 1,
      MEDIANA: 21, // 13 (6a) + 3 (6b) + 6 (6d novas mediana) − 1 (ninja_to saiu)
      LONGA: 7, // 4 (6a) + 1 (6b gunbai) + 2 (6d: yari, otsuchi)
      PESADA: 8,
      ARREMESSO: 8, // 6 (6a) + 2 (6f: boleadeira, rede)
      DISPARO: 11, // 4 (6a) + 6 (6c) + 1 (6d arco_longo)
      MUNICAO: 3, // 2 (6a) + 1 (6c)
      VARIAVEL: 1,
      EXPLOSIVO: 5, // 6f: 4 bombas + tarja_explosiva
      AREA: 1, // 6f: estrepes
      EQUIPAMENTO: 1, // 6f: tampoes_de_ouvido
    });
  });

  it('distribuição final por subtype cobre 22 valores (1 novo do 7a: armadura_pesada_hijutsu)', () => {
    const counts: Record<string, number> = {};
    for (const e of mergedByCode.values()) {
      const key = e.subtype ?? '__nullish__';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    expect(counts).toEqual({
      simples: 16, // 16 (6a) − 1 (ninja_to migrado) + 1 (gladio 6d)
      marcial: 36, // 24 (6a) + 1 (Disparador 6c) + 10 (6d novas) + 1 (ninja_to migrado)
      especial: 9, // 6b
      fogo: 5, // 6c
      municao: 3, // 2 (6a) + 1 (6c)
      vestuario: 2, // 6e
      colete: 2, // 6e
      armadura_pesada: 2, // 6e
      ferramenta_shinobi_utilitaria: 9, // 6f
      veneno: 26, // 6g
      pilula: 4, // 6g
      antidoto: 1, // 6g
      selo_fuuinjutsu: 4, // 6g
      ferramenta_comum: 6, // 6h
      recipiente: 2, // 6h
      kit: 4, // 6h
      pergaminho_papel: 3, // 6h
      campismo: 2, // 6h
      animal: 2, // 6h
      veiculo: 3, // 6h
      servico: 7, // 6h
      armadura_pesada_hijutsu: 1, // 7a
    });
  });

  it('7a não introduz overlaps com 6a-6h (zero códigos duplicados não declarados)', () => {
    const declared = new Set(seed6d._meta?.intentionalUpserts ?? []);
    const seen = new Map<string, string>();
    const undeclaredDupes: string[] = [];
    for (const [label, seed] of [
      ['6a', seed6a],
      ['6b', seed6b],
      ['6c', seed6c],
      ['6d', seed6d],
      ['6e', seed6e],
      ['6f', seed6f],
      ['6g', seed6g],
      ['6h', seed6h],
      ['7a', seed7aArmor],
    ] as const) {
      for (const e of seed.data) {
        const previous = seen.get(e.code);
        if (previous && !declared.has(e.code)) {
          undeclaredDupes.push(`${e.code} (${previous} ↔ ${label})`);
        }
        seen.set(e.code, label);
      }
    }
    expect(undeclaredDupes).toEqual([]);
  });

  it('refs cruzadas a aptidões resolvem para todos os 9 lotes (5a-5d ∪ phase6-patches ∪ samurai ∪ unmodeled 6a-h ∪ 7a)', () => {
    const aptitudeFiles = [
      'aptitudes-common-combat.json',
      'aptitudes-clan-restricted.json',
      'aptitudes-manuevers.json',
      'aptitudes-meta-shinobi.json',
      'aptitudes-patches.json',
      'aptitudes-phase6-patches.json',
      'aptitudes-samurai.json',
    ];
    const known = new Set<string>([
      ...(seed6a._meta?.unmodeledAptitudes ?? []),
      ...(seed6b._meta?.unmodeledAptitudes ?? []),
      ...(seed6c._meta?.unmodeledAptitudes ?? []),
      ...(seed6d._meta?.unmodeledAptitudes ?? []),
      ...(seed6e._meta?.unmodeledAptitudes ?? []),
      ...(seed6f._meta?.unmodeledAptitudes ?? []),
      ...(seed6g._meta?.unmodeledAptitudes ?? []),
      ...(seed6h._meta?.unmodeledAptitudes ?? []),
      ...(seed7aArmor._meta?.unmodeledAptitudes ?? []),
    ]);
    for (const f of aptitudeFiles) {
      const parsed = JSON.parse(readFileSync(join(seedDir, f), 'utf-8')) as {
        _meta?: { unmodeledAptitudes?: string[] };
        data: Array<{ code: string }>;
      };
      for (const a of parsed.data) known.add(a.code);
      for (const u of parsed._meta?.unmodeledAptitudes ?? []) known.add(u);
    }

    const orphans: string[] = [];
    for (const seed of [
      seed6a,
      seed6b,
      seed6c,
      seed6d,
      seed6e,
      seed6f,
      seed6g,
      seed6h,
      seed7aArmor,
    ]) {
      for (const e of seed.data) {
        const lists = [e.prerequisites?.aptitudes, e.prerequisites?.aptitudes_one_of];
        for (const list of lists) {
          if (!Array.isArray(list)) continue;
          for (const ref of list) {
            if (typeof ref === 'string' && !known.has(ref)) {
              orphans.push(`${e.code} -> ${ref}`);
            }
          }
        }
      }
    }
    expect(orphans).toEqual([]);
  });

  it('refs cruzadas a poderes resolvem (powers.json + powers-additional.json + unmodeled)', () => {
    const knownPowers = new Set<string>([
      ...(seed6a._meta?.unmodeledPowers ?? []),
      ...(seed6b._meta?.unmodeledPowers ?? []),
      ...(seed6c._meta?.unmodeledPowers ?? []),
      ...(seed6d._meta?.unmodeledPowers ?? []),
      ...(seed6e._meta?.unmodeledPowers ?? []),
      ...(seed6f._meta?.unmodeledPowers ?? []),
      ...(seed6g._meta?.unmodeledPowers ?? []),
      ...(seed6h._meta?.unmodeledPowers ?? []),
      ...(seed7aArmor._meta?.unmodeledPowers ?? []),
    ]);
    for (const f of ['powers.json', 'powers-additional.json']) {
      const parsed = JSON.parse(readFileSync(join(seedDir, f), 'utf-8')) as {
        data: Array<{ code: string }>;
      };
      for (const p of parsed.data) knownPowers.add(p.code);
    }

    const orphans: string[] = [];
    for (const seed of [
      seed6a,
      seed6b,
      seed6c,
      seed6d,
      seed6e,
      seed6f,
      seed6g,
      seed6h,
      seed7aArmor,
    ]) {
      for (const e of seed.data) {
        const req = e.prerequisites?.powers;
        if (req && typeof req === 'object' && !Array.isArray(req)) {
          for (const code of Object.keys(req as Record<string, unknown>)) {
            if (!knownPowers.has(code)) orphans.push(`${e.code} -> ${code}`);
          }
        }
      }
    }
    expect(orphans).toEqual([]);
  });
});
