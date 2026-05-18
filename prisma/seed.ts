/**
 * Prisma seed entry point — incrementa progressivamente os catálogos do livro.
 *
 * Fontes em `prisma/seed-data/*.json`. Cada JSON tem shape:
 *   { "_meta": {...}, "data": [ { ... }, ... ] }
 *
 * O `_meta` e qualquer campo com prefixo `_` (ex.: `_note`) são ignorados —
 * não vão pro banco. Idempotente via `upsert` por `code` único.
 *
 * Lotes aplicados:
 *   - Leva 1: pericias.json (20 perícias) + villages.json (5 vilas)
 *   - Lote 2: kekkei-genkais.json (5 KGs + juuken-skipped) + clans.json (17)
 *   - Lote 3: powers.json (19 poderes)
 *
 * Os atributos e habilidades de combate ficam fora do banco: vivem só em
 * `src/domain/catalog/{attributes,combatSkills}.ts` (listas fechadas de 7 e 4
 * itens — decisão de arquitetura).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SeedFile<T> = {
  _meta?: Record<string, unknown>;
  data: T[];
};

/**
 * Lê um JSON de seed e retorna apenas o array `data` com os campos que NÃO
 * começam com `_` (ex.: `_note` é metadata interna).
 */
function loadSeedData<T extends Record<string, unknown>>(filename: string): T[] {
  const filePath = path.join(__dirname, 'seed-data', filename);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as SeedFile<Record<string, unknown>>;
  return raw.data.map(
    (item) => Object.fromEntries(Object.entries(item).filter(([k]) => !k.startsWith('_'))) as T,
  );
}

// ──────────────────────────────────────────────────────────────────────
// Vilas (Leva 1)
// ──────────────────────────────────────────────────────────────────────

type VillageSeed = {
  code: string;
  name: string;
  fullName?: string;
  translation?: string;
  country?: string;
  leaderTitle?: string;
  description: string;
  shortDescription?: string;
  benefits?: Record<string, unknown>;
};

async function seedVillages(): Promise<void> {
  const villages = loadSeedData<VillageSeed>('villages.json');
  for (const v of villages) {
    const data = {
      code: v.code,
      name: v.name,
      fullName: v.fullName ?? null,
      translation: v.translation ?? null,
      country: v.country ?? null,
      leaderTitle: v.leaderTitle ?? null,
      description: v.description,
      shortDescription: v.shortDescription ?? null,
      benefits: (v.benefits ?? {}) as Prisma.InputJsonValue,
    };
    await prisma.village.upsert({
      where: { code: v.code },
      create: data,
      update: data,
    });
  }
  console.info(`  ✓ ${villages.length} vilas`);
}

// ──────────────────────────────────────────────────────────────────────
// Kekkei Genkais (Lote 2)
// ──────────────────────────────────────────────────────────────────────
// Juuken é listado em `kekkei-genkais.json` apenas para clareza — tecnicamente
// é um Poder Restrito (modelado em `powers.json` como `RESTRITO_CLA`).
// Pulamos durante o seed para evitar duplicar a entidade.

type KekkeiGenkaiSeed = {
  code: string;
  name: string;
  translation?: string;
  associatedClan?: string;
  shortDescription?: string;
  description: string;
  benefits?: Record<string, unknown>;
};

const KEKKEI_GENKAI_SKIP_CODES: ReadonlySet<string> = new Set(['juuken']);

async function seedKekkeiGenkais(): Promise<void> {
  const all = loadSeedData<KekkeiGenkaiSeed>('kekkei-genkais.json');
  let inserted = 0;
  for (const kg of all) {
    if (KEKKEI_GENKAI_SKIP_CODES.has(kg.code)) continue;
    const data = {
      code: kg.code,
      name: kg.name,
      translation: kg.translation ?? null,
      associatedClan: kg.associatedClan ?? null,
      shortDescription: kg.shortDescription ?? null,
      description: kg.description,
      benefits: (kg.benefits ?? {}) as Prisma.InputJsonValue,
    };
    await prisma.kekkeiGenkai.upsert({
      where: { code: kg.code },
      create: data,
      update: data,
    });
    inserted += 1;
  }
  const skipped = all.length - inserted;
  console.info(
    `  ✓ ${inserted} kekkei genkais${skipped > 0 ? ` (${skipped} pulado: juuken é poder, não KG)` : ''}`,
  );
}

// ──────────────────────────────────────────────────────────────────────
// Clãs (Lote 2)
// ──────────────────────────────────────────────────────────────────────

type ClanSeed = {
  code: string;
  name: string;
  shortDescription?: string;
  description: string;
  benefits?: Record<string, unknown>;
};

async function seedClans(): Promise<void> {
  const clans = loadSeedData<ClanSeed>('clans.json');
  for (const c of clans) {
    const data = {
      code: c.code,
      name: c.name,
      shortDescription: c.shortDescription ?? null,
      description: c.description,
      benefits: (c.benefits ?? {}) as Prisma.InputJsonValue,
    };
    await prisma.clan.upsert({
      where: { code: c.code },
      create: data,
      update: data,
    });
  }
  console.info(`  ✓ ${clans.length} clãs`);
}

// ──────────────────────────────────────────────────────────────────────
// Poderes (Lote 3)
// ──────────────────────────────────────────────────────────────────────

type PowerSeed = {
  code: string;
  name: string;
  translation?: string;
  category: 'COMUM' | 'RESTRITO' | 'RESTRITO_CLA' | 'KEKKEI_GENKAI';
  element?: string | null;
  associatedKekkeiGenkai?: string;
  associatedClan?: string;
  shortDescription?: string;
  description: string;
  stats?: Record<string, unknown>;
  rules?: Record<string, unknown>;
};

/**
 * Lista de arquivos `powers-*.json` agregados. `powers.json` é o catálogo
 * principal (Lote 3, 19 entradas); `powers-additional.json` (Lote 4f) traz
 * 13 hijutsus avançados (Kami/Sumi/Kumo/Hebi Ninpou, Dokujutsu, Ototon,
 * Kibaku Nendo, Futton/Youton-Mei, Shakuton, Shouton, Ranton, Kujaku Myoho).
 * Adicione novos arquivos em ordem cronológica conforme entregues.
 */
const POWER_FILES: ReadonlyArray<string> = [
  'powers.json', // Lote 3 — 19 poderes
  'powers-additional.json', // Lote 4f — 13 hijutsus avançados
  'powers-orphans.json', // 7b — 7 powers órfãos (hachimon_tonkou, jiton, sabaku_hijutsu, yonbi_youton, sanbi_suiton, senjutsu, aoi_katon)
  'powers-uchiha-mangekyou.json', // 7e1 — 1 power virtual mangekyou_sharingan (sem progressão; gateway pras 6 técnicas Nv 10)
  'powers-jinchuuriki.json', // 7f — Jinchuuriki base (Hijutsu Kinjutsu). Resolve 4 refs dormentes em aoi_katon/sabaku_hijutsu/sanbi_suiton/yonbi_youton.
  'powers-jinchuuriki-bijuus.json', // 7f2b — 2 powers Hijutsu/Jinchuuriki que faltavam (Gobi Futton, Rokubi Suiton).
  'powers-rinnegan.json', // 7h — 1 power Rinne Ninpou (variante Ninpou aceitando 5 elementos básicos via Rinnegan).
  'powers-senninka.json', // 7g — 1 power Senninka (Hijutsu KG instintiva, Primeiro/Segundo Estágio).
  'powers-nintaijutsu-hibon.json', // 7j — 2 powers: Nintaijutsu (Hijutsu Raiton+físico) + Hibon Ninpou (Ninpou único com bonificações).
];

async function seedPowers(): Promise<void> {
  let total = 0;
  for (const file of POWER_FILES) {
    const powers = loadSeedData<PowerSeed>(file);
    for (const p of powers) {
      const data = {
        code: p.code,
        name: p.name,
        translation: p.translation ?? null,
        category: p.category,
        element: p.element ?? null,
        associatedKekkeiGenkai: p.associatedKekkeiGenkai ?? null,
        associatedClan: p.associatedClan ?? null,
        shortDescription: p.shortDescription ?? null,
        description: p.description,
        stats: (p.stats ?? {}) as Prisma.InputJsonValue,
        rules: (p.rules ?? {}) as Prisma.InputJsonValue,
      };
      await prisma.power.upsert({
        where: { code: p.code },
        create: data,
        update: data,
      });
    }
    total += powers.length;
  }
  console.info(`  ✓ ${total} poderes`);
}

// ──────────────────────────────────────────────────────────────────────
// Efeitos de poder (Lote 4 — entregue em ondas 4a-4e)
// ──────────────────────────────────────────────────────────────────────
// Cada arquivo `effects-*.json` traz efeitos compartilhados via `availableFor`
// (lista de `Power.code`). Esta função consolida todos os arquivos disponíveis
// em uma única passagem. Adicione novos arquivos à lista `EFFECT_FILES`
// conforme as ondas chegarem.

type PowerEffectSeed = {
  code: string;
  name: string;
  minLevel: number;
  availableFor: string[];
  shortDescription?: string;
  description: string;
  stats: Record<string, unknown>;
  rules?: Record<string, unknown>;
  evolutions?: Array<{ atLevel: number; name: string; description: string }>;
};

const EFFECT_FILES: ReadonlyArray<string> = [
  'effects-ninpou-universal.json', // 4a — 18 universais
  // 4b — efeitos exclusivos dos 5 elementos básicos. Efeitos cross-element
  // (Imergir, Inflamável) aparecem no JSON do elemento "dono" mas listam
  // outros poderes no próprio `availableFor`.
  'effects-suiton.json', // 3: Névoa, Prisão de Água, Colisão de Ondas
  'effects-doton.json', // 3: Imergir (cross), Tremor, Pele de Pedra
  'effects-katon.json', // 1: Inflamável (cross via Guia Avançado)
  'effects-fuuton.json', // 4: Venenoso, Afiar, Lâmina de Vento, Flutuar
  'effects-raiton.json', // 3: Lâmina de Raios, Arma Elétrica, Descarga
  // 4c — KGs e Hijutsus complexos. Alguns `availableFor` apontam para poderes
  // que ainda não existem no catálogo (sabaku_hijutsu, yonbi_youton, etc.) —
  // virão em `powers-additional.json` num lote futuro. Como `availableFor` é
  // FK lógica sem constraint Prisma, o seed aceita.
  'effects-hyouton.json', // 1: Espelhos Demoníacos (requer Imergir + Ataque em Movimento)
  'effects-mokuton.json', // 2: Transmissor (Soushinki), Golem (Mokujin)
  'effects-sabaku.json', // 6: Areia Especial (cross Sabaku+Jiton), Armadura, ...
  'effects-jiton.json', // 2: Areia Selada, Projétil Venenoso (variantes Satetsu/Sakin)
  'effects-yonbi-youton.json', // 2: Manto de Lava (requer Energizar), Vulcão
  'effects-aoi-katon.json', // 1: Nekozume
  'effects-sanbi-suiton.json', // 2: Sangoshō, Espelho D'Água
  'effects-senjutsu.json', // 2: Modo Eremita Bonus (9 bônus selecionáveis), Senpou Ryōsei
  'effects-hachimon.json', // 15: 8 portões individuais + 7 Taijutsus avançados
  // 4d — poderes restritos de clã + hijutsus de Genjutsu/Cura/Selo. Todos os
  // power_codes referenciados via `availableFor` já existem em `powers` (Lote
  // 3), EXCETO `shindenshin` (typo do JSON, deveria ser `shintenshin`) —
  // referência fica órfã até alguém renomear.
  'effects-magen.json', // 16: ilusões fantasma/compulsão/aflição
  'effects-iryou.json', // 4: Chakra no Mesu, In'Yu, Shousen, Byakugou
  'effects-fuuinjutsu.json', // 10: 1 selo por nível (1-9)
  'effects-rasengan.json', // 4: Básico, Completo, Oodama, Elemental
  'effects-kuchiyose.json', // 2: kuchiyose_no_jutsu, gyaku_kuchiyose
  'effects-juuken.json', // 8: Juuken Nv1-8 + variações (requer Byakugan ativo)
  'effects-kagejutsu.json', // 5: Kage Shibari, Kage Mane (com evoluções inline), ...
  'effects-baika.json', // 4: Baika no Jutsu, Nikudan Sensha, Bunbun Baika, Choudan
  'effects-kikai.json', // 4: Mushi Bunshin, Mushi Kame, Mushidama, Senro
  'effects-shikakyu.json', // 6: Shikakyu Nv1, Juujin Bunshin, Gatsuuga, ...
  'effects-shintenshin.json', // 3: Shintenshin, Shinten Bunshin, Shinranshin
  // 4e — efeitos novos do Guia Avançado do Shinobi (GAS p. 48-51, 55-56).
  // Fecha o Lote 4. Vários `availableFor` apontam pra poderes ainda não
  // modelados (kamijutsu, sumi_ninpou, hebi_ninpou, futton_mei, etc.) —
  // listados em `_meta.unmodeledPowers` do JSON. FK lógica aceita; vínculo
  // automático quando esses poderes entrarem no catálogo.
  'effects-guia-avancado.json', // 7: Dano Contínuo, Deslocamento de Vácuo, Purificar, Repelir, Projetar, Cegante, Desastre
  // 7e — efeitos do Mangekyou Sharingan + Suika expandido. Effects do Mangekyou
  // dependem do power virtual `mangekyou_sharingan` (vem em POWER_FILES via
  // `powers-uchiha-mangekyou.json`). Effects de Suika referenciam Suiton (já
  // existente). subTechniques compartilhadas (kamui_teletransporte) repetem em
  // kamui_curto e kamui_longo — motor deduz no runtime.
  'effects-mangekyou-sharingan.json', // 7e1 — 6 técnicas Nv 10 (Tsukuyomi, Amaterasu, Kagutsuchi/Enton, Kamui Curto, Kamui Longo, Susanoo)
  'effects-suika.json', // 7e2 — 4 efeitos exclusivos Suiton-via-Suika (Braço de Água, Afogar, Monstro de Água, Clone de Óleo)
  'effects-jinchuuriki.json', // 7f — 11 effects do Jinchuuriki (5 modos + 6 técnicas gerais)
  'effects-jinchuuriki-bijuus.json', // 7f2c — 20 effects técnicos por Bijuu (Nekozume movido de aoi-katon; Sangoshō, Kagenade, Ebulição, Aceleração-Vapor, Força-Vapor, Tsunoori, Corrosão da Lesma, 4 Técnicas de Bolhas, Pó de Prata, Rede de Fios, Casulo de Fios, Tinta do Polvo, Cauda Morta, Tornado do Polvo, Cura da Raposa, Modo Kurama)
  'effects-rinnegan.json', // 7h — 2 effects do Caminho Tendō (Shinra Tensei + Banshō Ten'in)
  'effects-senninka.json', // 7g — 2 effects exclusivos do Senninka (Corrente Nv 3 + Transferência Celular Nv 6)
  'effects-kami-ninpou.json', // 7i — 3 effects exclusivos do Kami Ninpou (Anjo de Papel Nv 5 + Julgamento Nv 6 + Emissário Divino Nv 10)
  'effects-nintaijutsu.json', // 7j — 8 effects do Nintaijutsu (Força Bruta, Elbow, Straight, Lariat, Hell Stab, Guillotine Drop, Linger Bomb, Reverse Chop)
];

async function seedPowerEffects(): Promise<void> {
  let total = 0;
  for (const file of EFFECT_FILES) {
    const effects = loadSeedData<PowerEffectSeed>(file);
    for (const e of effects) {
      const data = {
        code: e.code,
        name: e.name,
        minLevel: e.minLevel,
        availableFor: e.availableFor,
        shortDescription: e.shortDescription ?? null,
        description: e.description,
        stats: e.stats as Prisma.InputJsonValue,
        rules: (e.rules ?? null) as Prisma.InputJsonValue | null,
        evolutions: (e.evolutions ?? []) as Prisma.InputJsonValue,
      };
      await prisma.powerEffect.upsert({
        where: { code: e.code },
        create: data,
        update: data,
      });
    }
    total += effects.length;
  }
  console.info(`  ✓ ${total} efeitos de poder`);
}

// ──────────────────────────────────────────────────────────────────────
// Aptidões (Lote 5 — entregue em ondas 5a-5d)
// ──────────────────────────────────────────────────────────────────────
// Estrutura espelha PowerEffect: arquivos `aptitudes-*.json` agregados via
// `APTITUDE_FILES`. Cada aptidão tem `effects` com `type` discriminador
// (precision_bonus, skill_bonus, manuever, stat_substitution, permission,
// etc.) consumido pelo motor de regras. `evolutions` é array com versões
// progressivas (Nv 2 e além).

type AptitudeSeed = {
  code: string;
  name: string;
  category:
    | 'HABILIDADE'
    | 'COMBATE'
    | 'MANOBRA'
    | 'GERAL'
    | 'RESTRITA'
    | 'META'
    | 'PODER'
    | 'PERICIA';
  shortDescription?: string;
  description: string;
  prerequisites?: Record<string, unknown>;
  effects: Record<string, unknown>;
  evolutions?: Array<Record<string, unknown>>;
};

// Ordem importa: `aptitudes-patches.json` precisa vir DEPOIS do 5c para que os
// upserts de `burro_de_carga` e `furtividade_agil` (MANOBRA → GERAL) sobrescrevam
// corretamente as entradas originais via `prisma.aptitude.upsert({ where: code })`.
const APTITUDE_FILES: ReadonlyArray<string> = [
  'aptitudes-common-combat.json', // 5a — 51 aptidões (12 HAB + 22 COM + 7 MAN + 10 GER)
  'aptitudes-clan-restricted.json', // 5b — 36 aptidões RESTRITA (14 clãs + 4 hijutsus)
  'aptitudes-manuevers.json', // 5c — 24 aptidões MANOBRA (14 Livro Básico + 10 GAS)
  'aptitudes-meta-shinobi.json', // 5d — 26 aptidões (META + GERAL ex-SHINOBI + RESTRITA Tensai)
  'aptitudes-patches.json', // 5-patches — 10 aptidões (8 novas + 2 upserts MANOBRA→GERAL)
  'aptitudes-phase6-patches.json', // patch fase 6 — 1 aptidão GERAL (usar_armaduras_pesadas)
  'aptitudes-samurai.json', // 7a — 8 aptidões RESTRITA (Hijutsu Samurai)
  // 7c-d-e1 — Aptidões Hijutsu pós-Samurai. Vários upserts em aptidões de
  // `aptitudes-clan-restricted.json` — esta ordem garante que os upserts
  // sobrescrevam corretamente o original.
  'aptitudes-kaguya.json', // 7c — upsert artesao_de_ossos + 6 novas Kaguya (armadura_ossea + 5 danças)
  'aptitudes-fuuma-yuki.json', // 7d — demonio_do_vento + congelamento (upsert)
  'aptitudes-uchiha-doujutsu.json', // 7e1 — hipnose_sharingan (nova) + upserts nidan/sandan_sharingan (refator fields→subTechniques)
  'aptitudes-jinchuuriki-bijuus.json', // 7f2a — 9 aptidões marcadoras (jinchuuriki_<bijuu>) com tabela específica de benefícios por nível + diferenças da Forma Bijuu
  'aptitudes-rinnegan.json', // 7h — 8 aptidões (rinnegan + 7 Caminhos: Shuradō, Jigokudō, Ningendō, Gakidō, Chikushōdō, Tendō, Gedō)
  'aptitudes-kami-ninpou.json', // 7i — 1 aptidão Shikigami no Mai (2 níveis evolutivos)
  'aptitudes-nintaijutsu.json', // 7j — 1 aptidão Armadura de Raios (Hijutsu Nintaijutsu, 3 níveis evolutivos)
];

// Conta codes únicos (Set) em vez de items processados (length), seguindo mesma
// estratégia de `seedEquipment` — patches futuros podem fazer upserts (5-patches
// fez 2: MANOBRA→GERAL); `Set.size` reflete o estado final do DB, não a soma
// de items dos JSONs.
async function seedAptitudes(): Promise<void> {
  const seen = new Set<string>();
  for (const file of APTITUDE_FILES) {
    const aptitudes = loadSeedData<AptitudeSeed>(file);
    for (const a of aptitudes) {
      const data = {
        code: a.code,
        name: a.name,
        category: a.category,
        shortDescription: a.shortDescription ?? null,
        description: a.description,
        prerequisites: (a.prerequisites ?? {}) as Prisma.InputJsonValue,
        effects: a.effects as Prisma.InputJsonValue,
        evolutions: (a.evolutions ?? []) as Prisma.InputJsonValue,
      };
      await prisma.aptitude.upsert({
        where: { code: a.code },
        create: data,
        update: data,
      });
      seen.add(a.code);
    }
  }
  console.info(`  ✓ ${seen.size} aptidões`);
}

// ──────────────────────────────────────────────────────────────────────
// Equipamentos (Lote 6 — entregue em ondas 6a-6i)
// ──────────────────────────────────────────────────────────────────────
// Estrutura espelha Aptitude: arquivos `equipment-*.json` agregados via
// `EQUIPMENT_FILES`. Cada item tem `kind` (enum EquipmentKind) + `category`
// (enum WeaponCategory, null pra kinds não-arma). `prerequisites` e `effects`
// são JSONB livres (mesmo padrão das aptidões). Refs a aptidões parametrizadas
// (`usar_arma_<X>`, `especialista_armas_<X>`) são dormentes — declaradas em
// `_meta.unmodeledAptitudes` no JSON pra demover de error pra info no validador.

type EquipmentSeed = {
  code: string;
  name: string;
  kind: 'WEAPON' | 'ARMOR' | 'TOOL' | 'CONSUMABLE' | 'GENERAL' | 'AMMO';
  subtype?: string | null;
  category?:
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
    | 'EQUIPAMENTO'
    | null;
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
};

// Lotes 6b-6i (armas especiais, GAS, armaduras, tools, consumíveis, gerais,
// armas de hijutsu) entram aqui ao longo da fase. Mesma convenção do
// APTITUDE_FILES: último arquivo da lista ganha em colisões via upsert.
const EQUIPMENT_FILES: ReadonlyArray<string> = [
  'equipment-weapons-basic.json', // 6a — 42 itens (40 WEAPON + 2 AMMO)
  'equipment-special-weapons.json', // 6b — 9 armas especiais (7 Espadas da Névoa + Kusanagi + Gunbai)
  'equipment-firearms.json', // 6c — 7 itens (5 firearms + munição + Disparador Oculto)
  'equipment-weapons-gas.json', // 6d — 23 itens (11 novas + 12 revisões)
  'equipment-armor.json', // 6e — 6 armaduras (4 leves + 2 pesadas)
  'equipment-shinobi-tools.json', // 6f — 9 ferramentas shinobi utilitárias (EXPLOSIVO/AREA/EQUIPAMENTO)
  'equipment-consumables.json', // 6g — 35 consumíveis (26 venenos + 4 pílulas + 1 antídoto + 4 selos Fuuinjutsu)
  'equipment-general.json', // 6h — 29 itens utilitários (kits, recipientes, animais, veículos, serviços)
  'equipment-armor-samurai.json', // 7a — 1 armadura exclusiva do Hijutsu Samurai (subtype armadura_pesada_hijutsu)
  'equipment-jinchuuriki-bijuus.json', // 7f2d — 2 itens do Jinchuuriki (Soprador de Bolhas Saiken + Armadura a Vapor Kokuō)
];

async function seedEquipment(): Promise<void> {
  const seen = new Set<string>();
  for (const file of EQUIPMENT_FILES) {
    const items = loadSeedData<EquipmentSeed>(file);
    for (const item of items) {
      const data = {
        code: item.code,
        name: item.name,
        kind: item.kind,
        subtype: item.subtype ?? null,
        category: item.category ?? null,
        price: item.price ?? null,
        damage: item.damage ?? null,
        range: item.range ?? null,
        critRange: item.critRange ?? null,
        slots: (item.slots ?? null) as Prisma.InputJsonValue | null,
        damageType: item.damageType ?? null,
        prerequisites: (item.prerequisites ?? {}) as Prisma.InputJsonValue,
        effects: (item.effects ?? {}) as Prisma.InputJsonValue,
        shortDescription: item.shortDescription ?? null,
        description: item.description,
      };
      await prisma.equipment.upsert({
        where: { code: item.code },
        create: data,
        update: data,
      });
      seen.add(item.code);
    }
  }
  console.info(`  ✓ ${seen.size} equipamentos`);
}

// ──────────────────────────────────────────────────────────────────────
// Perícias (Leva 1)
// ──────────────────────────────────────────────────────────────────────

type PericiaSeed = {
  code: string;
  name: string;
  attribute: string;
  trained?: boolean;
  doubleTrained?: boolean;
  armorPenalty?: boolean;
  order: number;
  shortDescription?: string;
  description: string;
};

async function seedPericias(): Promise<void> {
  const pericias = loadSeedData<PericiaSeed>('pericias.json');
  for (const p of pericias) {
    const data = {
      code: p.code,
      name: p.name,
      attribute: p.attribute,
      trained: p.trained ?? false,
      doubleTrained: p.doubleTrained ?? false,
      armorPenalty: p.armorPenalty ?? false,
      order: p.order,
      shortDescription: p.shortDescription ?? null,
      description: p.description,
    };
    await prisma.pericia.upsert({
      where: { code: p.code },
      create: data,
      update: data,
    });
  }
  console.info(`  ✓ ${pericias.length} perícias`);
}

// ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.info('🌱 Seed iniciado…');
  // Ordem importa: clãs referenciam vilas e KGs; poderes referenciam clãs e
  // KGs; efeitos referenciam códigos de poder via `availableFor`. Aptidões
  // e equipamentos vêm depois. Perícias são independentes — vão por último.
  await seedVillages();
  await seedKekkeiGenkais();
  await seedClans();
  await seedPowers();
  await seedPowerEffects();
  await seedAptitudes();
  await seedEquipment();
  await seedPericias();
  console.info('✅ Seed completo.');
}

main()
  .catch((error) => {
    console.error('[seed] falhou', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
