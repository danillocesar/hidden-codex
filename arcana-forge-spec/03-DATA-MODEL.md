# 03 — Modelo de Dados

## 🎯 Visão geral

O banco é **Postgres** acessado via **Prisma ORM**. Princípios:

- **Catálogos** (atributos, perícias, aptidões, poderes, efeitos, kekkei genkais, clãs, vilas, equipamentos) são **tabelas seedadas** — fonte de verdade do livro, raramente mudam.
- **Conteúdo do usuário** (User, Character, Jutsu, DiaryEntry, etc.) é mutável e cresce com o tempo.
- **Relacionamentos** preferem foreign keys explícitas. JSONB usado **apenas** onde estrutura é volátil ou específica do personagem (state de UI, customizações).
- **Soft delete** com `deletedAt` em entidades onde recuperação importa (Character, DiaryEntry). Hard delete em logs e auxiliares.

---

## 📐 Diagrama de alto nível

```
┌──────────┐       ┌────────────┐       ┌─────────────┐
│   User   │ 1───* │ Character  │ 1───* │ CharacterImage│
└──────────┘       └─────┬──────┘       └─────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        │  1───*         │  1───*         │  1───*
        ▼                ▼                ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│CharacterJutsu│  │DiaryEntry   │  │CharInventory │
└──────┬───────┘  └─────────────┘  └──────────────┘
       │
       │ *───1
       ▼
┌──────────────┐
│   Catalog    │  (Power, PowerEffect, Aptitude, etc.)
└──────────────┘

        ┌──────────────┐
        │   ShareLink  │  *───1 Character (token público read-only)
        └──────────────┘
```

---

## 🗂️ Schema Prisma completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ════════════════════════════════════════════════════════════
// USUÁRIOS E AUTENTICAÇÃO
// ════════════════════════════════════════════════════════════

model User {
  id           String   @id @default(uuid()) @db.Uuid
  firebaseUid  String   @unique @map("firebase_uid")
  email        String   @unique
  displayName  String?  @map("display_name")
  avatarUrl    String?  @map("avatar_url")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  characters   Character[]
  shareLinks   ShareLink[]

  @@map("users")
}

// ════════════════════════════════════════════════════════════
// PERSONAGENS
// ════════════════════════════════════════════════════════════

model Character {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Identidade
  name              String
  age               Int?
  gender            String?
  campaignLevel     Int       @map("campaign_level") // NC
  rank              CharacterRank @default(GENIN)
  tendency          String?   // Tendência (Boa, Neutra, Má, etc.)
  size              CharacterSize @default(MEDIUM)

  // Referencial (FK opcionais para catálogos)
  clanId            String?   @map("clan_id") @db.Uuid
  clan              Clan?     @relation(fields: [clanId], references: [id])
  villageId         String?   @map("village_id") @db.Uuid
  village           Village?  @relation(fields: [villageId], references: [id])
  kekkeiGenkaiId    String?   @map("kekkei_genkai_id") @db.Uuid
  kekkeiGenkai      KekkeiGenkai? @relation(fields: [kekkeiGenkaiId], references: [id])

  // Atributos primários (7)
  attrFor           Int       @default(1) @map("attr_for")
  attrDes           Int       @default(1) @map("attr_des")
  attrAgi           Int       @default(1) @map("attr_agi")
  attrPer           Int       @default(1) @map("attr_per")
  attrInt           Int       @default(1) @map("attr_int")
  attrVig           Int       @default(1) @map("attr_vig")
  attrEsp           Int       @default(1) @map("attr_esp")

  // Habilidades de combate (bases — remanejamento permitido)
  baseCc            Int       @default(5) @map("base_cc")
  baseCd            Int       @default(3) @map("base_cd")
  baseEsq           Int       @default(3) @map("base_esq")
  baseLm            Int       @default(1) @map("base_lm")

  // Sociais
  socialCarisma     Int       @default(0) @map("social_carisma")
  socialManipulacao Int       @default(0) @map("social_manipulacao")

  // Energias atuais (vitalidade e chakra correntes)
  currentVitality   Int       @map("current_vitality")
  currentChakra     Int       @map("current_chakra")

  // Bio/lore (texto livre opcional)
  biography         String?   @db.Text

  // Estado de UI (seções colapsadas, layout custom, imagens por slot)
  // Shape detalhado abaixo na seção "JSONB shapes"
  uiState           Json      @default("{}") @map("ui_state")

  // Recursos
  ryos              Int       @default(0)

  // Visibilidade pública (controlada por ShareLink — este campo é "perfil público mostra esse PJ?")
  isPublicOnProfile Boolean   @default(false) @map("is_public_on_profile")

  // Metadados
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  // Relações
  pericias          CharacterPericia[]
  aptitudes         CharacterAptitude[]
  powers            CharacterPower[]
  jutsus            CharacterJutsu[]
  inventory         CharacterInventoryItem[]
  diaryEntries      DiaryEntry[]
  shareLinks        ShareLink[]
  images            CharacterImage[]

  @@index([userId])
  @@index([deletedAt])
  @@map("characters")
}

enum CharacterRank {
  ACADEMICO   // NC 1-3
  GENIN       // NC 4-6
  CHUUNIN     // NC 7-9
  JOUNIN      // NC 10-12
  ANBU        // NC 13-15
  KAGE        // NC 16+
}

enum CharacterSize {
  MINUSCULO
  MIUDO
  PEQUENO
  MEDIUM
  GRANDE
  ENORME
  COLOSSAL
}

// ════════════════════════════════════════════════════════════
// PERÍCIAS (associativa Character ↔ Pericia)
// ════════════════════════════════════════════════════════════

model CharacterPericia {
  id          String    @id @default(uuid()) @db.Uuid
  characterId String    @map("character_id") @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  periciaCode String    @map("pericia_code") // FK lógica (perícias são hardcoded no domínio)
  points      Int       @default(0) // Pontos investidos pelo jogador

  @@unique([characterId, periciaCode])
  @@map("character_pericias")
}

// ════════════════════════════════════════════════════════════
// APTIDÕES
// ════════════════════════════════════════════════════════════

model Aptitude {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique // ex: "acuidade", "especialista_katana"
  name            String
  category        AptitudeCategory
  costPoints      Int      @default(2) @map("cost_points")
  description     String   @db.Text  // Descrição completa do livro
  shortDescription String? @map("short_description") // Versão resumida pra UI

  // Pré-requisitos (texto livre estruturado em JSONB)
  // Shape: { attributes?: { for?: 6, ... }, skills?: { cc: 12 }, aptitudes?: ["acuidade"], ... }
  prerequisites   Json     @default("{}")

  // Restrições (clãs específicos, etc.)
  // Shape: { restrictedToClans?: ["yuki"], restrictedToKekkei?: ["hyouton"] }
  restrictions    Json     @default("{}")

  // Se é selecionável livremente ou só por clã/KG
  isFree          Boolean  @default(false) @map("is_free")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  characterAptitudes CharacterAptitude[]

  @@map("aptitudes")
}

enum AptitudeCategory {
  COMBATE
  PODER
  PERICIA
  GERAL
  RESTRITA
}

model CharacterAptitude {
  id          String    @id @default(uuid()) @db.Uuid
  characterId String    @map("character_id") @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  aptitudeId  String    @map("aptitude_id") @db.Uuid
  aptitude    Aptitude  @relation(fields: [aptitudeId], references: [id])

  // Specialização (para aptidões com argumento, ex: "Especialista (Katana)")
  parameter   String?

  // Foi obtida grátis (kekkei genkai, clã) ou paga?
  isFreeFromOrigin Boolean @default(false) @map("is_free_from_origin")

  @@unique([characterId, aptitudeId, parameter])
  @@map("character_aptitudes")
}

// ════════════════════════════════════════════════════════════
// PODERES E EFEITOS
// ════════════════════════════════════════════════════════════

model Power {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique // "hyouton", "suiton", "fuuton", "katon", "raiton", "doton", "ninpou", "taijutsu", etc.
  name            String
  category        PowerCategory
  description     String   @db.Text
  shortDescription String? @map("short_description")

  // Custo em pontos por nível (geralmente 1 ponto = 1 nível)
  costPerLevel    Int      @default(1) @map("cost_per_level")

  // Restrições e gratuidades
  // Shape JSON: { freeLevelsFromKekkei?: ["hyouton"], requiredAttribute?: { esp: 3 }, restrictedToClans?: [...] }
  restrictions    Json     @default("{}")

  // Tipo de elemento (para vantagem/desvantagem elemental)
  element         String?  // "fogo", "agua", "vento", "raio", "terra", "gelo", null

  createdAt       DateTime @default(now()) @map("created_at")

  effects         PowerEffect[]
  characterPowers CharacterPower[]

  @@map("powers")
}

enum PowerCategory {
  NINPOU         // Elementar básico
  TAIJUTSU       // Combate corporal
  GENJUTSU       // Ilusões
  KEKKEI_GENKAI  // Linhagem sanguínea (Hyouton, Sharingan, etc.)
  HIJUTSU        // Técnicas secretas
}

model PowerEffect {
  id          String   @id @default(uuid()) @db.Uuid
  powerId     String   @map("power_id") @db.Uuid
  power       Power    @relation(fields: [powerId], references: [id], onDelete: Cascade)
  code        String   // "canhao", "nevoa", "criar_arma", "energizar", etc.
  name        String
  minLevel    Int      @map("min_level") // Nível mínimo do poder para destravar
  description String   @db.Text
  shortDescription String? @map("short_description")

  // Stats do efeito (estrutura varia por tipo de efeito — JSONB pra flexibilidade)
  // Shape pra Canhão: { action: "PADRAO", target: "uma_criatura", duration: "INSTANTANEA", chakraCost: { base: 1, perLevel: 1 }, damage: { base: 2, perLevel: 2 }, range: { base: 10, perEsp: 2 } }
  // Documentado em detalhes em 04-RULES-ENGINE.md
  stats       Json

  // Tags pra UI (mostrar como pills no card)
  tags        String[] @default([])

  @@unique([powerId, code])
  @@map("power_effects")
}

model CharacterPower {
  id          String    @id @default(uuid()) @db.Uuid
  characterId String    @map("character_id") @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  powerId     String    @map("power_id") @db.Uuid
  power       Power     @relation(fields: [powerId], references: [id])
  level       Int       // Nível atual investido pelo personagem

  @@unique([characterId, powerId])
  @@map("character_powers")
}

// ════════════════════════════════════════════════════════════
// JUTSUS (técnicas específicas — instanciações de poder+efeito)
// ════════════════════════════════════════════════════════════

model CharacterJutsu {
  id              String    @id @default(uuid()) @db.Uuid
  characterId     String    @map("character_id") @db.Uuid
  character       Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  powerId         String    @map("power_id") @db.Uuid // Qual poder usa
  powerEffectId   String    @map("power_effect_id") @db.Uuid // Qual efeito do poder

  // Identidade narrativa
  name            String    // "Hyouton: Gekkōken no Jutsu"
  kanjiName       String?   @map("kanji_name") // "月光剣の術"
  translation     String?   // "Lâmina da Luz da Lua"
  flavorText      String?   @db.Text @map("flavor_text") // Descrição narrativa
  imageUrl        String?   @map("image_url")

  // Customizações em cima do efeito base (raro mas possível)
  // Shape: { customDamage?: number, customCost?: number, customRange?: number }
  overrides       Json      @default("{}")

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("character_jutsus")
}

// ════════════════════════════════════════════════════════════
// INVENTÁRIO
// ════════════════════════════════════════════════════════════

model Equipment {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique // "tachi", "wakizashi", "shuriken", etc.
  name            String
  category        EquipmentCategory
  description     String   @db.Text
  shortDescription String? @map("short_description")

  // Stats em JSONB pela variabilidade
  // Armas: { damage: 2, type: "corte", critical: [15,16], weight: 0, slots: 1 }
  // Armadura: { absorption: 10, hardness: 0, penalty: 0 }
  stats           Json     @default("{}")

  // Tags pra UI
  tags            String[] @default([])

  // Preço base (Ryos)
  basePrice       Int      @default(0) @map("base_price")

  createdAt       DateTime @default(now()) @map("created_at")

  inventoryItems  CharacterInventoryItem[]

  @@map("equipments")
}

enum EquipmentCategory {
  ARMA_CC         // Combate corporal
  ARMA_CD         // À distância
  ARMA_ARREMESSO
  ARMADURA
  ESCUDO
  ITEM_NINJA      // Bombas, tarjas, etc.
  CONSUMIVEL
  MISC            // Ryos, pergaminhos, livros
}

model CharacterInventoryItem {
  id            String    @id @default(uuid()) @db.Uuid
  characterId   String    @map("character_id") @db.Uuid
  character     Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  // Pode ser um item de catálogo OU custom (texto livre)
  equipmentId   String?   @map("equipment_id") @db.Uuid
  equipment     Equipment? @relation(fields: [equipmentId], references: [id])
  customName    String?   @map("custom_name") // Quando não é de catálogo
  customStats   Json?     @map("custom_stats") // Stats livres para item custom

  quantity      Int       @default(1)
  notes         String?   @db.Text

  createdAt     DateTime  @default(now()) @map("created_at")

  @@map("character_inventory_items")
}

// ════════════════════════════════════════════════════════════
// CATÁLOGOS DE REFERÊNCIA (CLÃS, VILAS, KEKKEI GENKAIS)
// ════════════════════════════════════════════════════════════

model Clan {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique // "yuki", "uchiha", "hyuuga"
  name            String
  description     String   @db.Text
  shortDescription String? @map("short_description")

  // Aptidões e poderes recebidos automaticamente
  // Shape: { aptitudes: ["..."], powers: [{ code: "hyouton", level: 1 }], restrictions: {...} }
  benefits        Json     @default("{}")

  createdAt       DateTime @default(now()) @map("created_at")
  characters      Character[]

  @@map("clans")
}

model Village {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique // "konoha", "nami", "kiri"
  name            String
  fullName        String?  @map("full_name") // "Vila Oculta da Folha"
  description     String   @db.Text
  shortDescription String? @map("short_description")

  // Benefícios opcionais
  benefits        Json     @default("{}")

  createdAt       DateTime @default(now()) @map("created_at")
  characters      Character[]

  @@map("villages")
}

model KekkeiGenkai {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique // "hyouton", "sharingan", "byakugan"
  name            String
  description     String   @db.Text
  shortDescription String? @map("short_description")

  // Poder principal e benefícios
  // Shape: { mainPowerCode: "hyouton", freeAptitudes: [...], specialRules: "..." }
  benefits        Json     @default("{}")

  createdAt       DateTime @default(now()) @map("created_at")
  characters      Character[]

  @@map("kekkei_genkais")
}

// ════════════════════════════════════════════════════════════
// IMAGENS DO PERSONAGEM (galeria)
// ════════════════════════════════════════════════════════════

model CharacterImage {
  id          String    @id @default(uuid()) @db.Uuid
  characterId String    @map("character_id") @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  url         String
  storagePath String    @map("storage_path") // Path no Supabase Storage
  fileName    String?   @map("file_name")
  width       Int?
  height      Int?
  fileSizeBytes Int?    @map("file_size_bytes")

  // Tag opcional pra organização ("hero", "combate", etc.) — não vinculado a slot
  // O slot é controlado pelo uiState do Character
  label       String?

  uploadedAt  DateTime  @default(now()) @map("uploaded_at")

  @@index([characterId])
  @@map("character_images")
}

// ════════════════════════════════════════════════════════════
// DIÁRIO
// ════════════════════════════════════════════════════════════

model DiaryEntry {
  id          String    @id @default(uuid()) @db.Uuid
  characterId String    @map("character_id") @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  title       String
  body        String    @db.Text // Markdown
  entryDate   DateTime? @map("entry_date") // Data in-game ou real (escolha do user)
  tag         String?   // Tag opcional: "Ato 2", "Sessão 5", etc.

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  @@index([characterId])
  @@index([deletedAt])
  @@map("diary_entries")
}

// ════════════════════════════════════════════════════════════
// COMPARTILHAMENTO
// ════════════════════════════════════════════════════════════

model ShareLink {
  id          String    @id @default(uuid()) @db.Uuid
  token       String    @unique // URL slug aleatório (24+ chars)
  characterId String    @map("character_id") @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  userId      String    @map("user_id") @db.Uuid // Dono
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  isActive    Boolean   @default(true) @map("is_active")
  viewCount   Int       @default(0) @map("view_count")
  lastViewedAt DateTime? @map("last_viewed_at")

  createdAt   DateTime  @default(now()) @map("created_at")
  expiresAt   DateTime? @map("expires_at") // null = nunca expira

  @@index([token])
  @@index([characterId])
  @@map("share_links")
}
```

---

## 📋 JSONB Shapes — referência detalhada

### `Character.uiState`

Estado de UI persistente. Inicia vazio `{}`. Estrutura esperada:

```typescript
type UIState = {
  collapsedSections?: {
    socials?: boolean;
    combatSkills?: boolean;
    aptitudes?: boolean;
    pericias?: boolean;
    periciasTrainedOnly?: boolean; // sub-collapse
    jutsus?: boolean;
    combat?: boolean;
    inventory?: boolean;
    inventoryArmamentOnly?: boolean; // sub-collapse
    diary?: boolean;
  };
  imageSlots?: {
    header?: string;     // ID de uma CharacterImage
    hero?: string;
    banner?: string;
    jutsu1?: string;
    jutsu2?: string;
    jutsu3?: string;
    jutsu4?: string;
    aptidoes?: string;
    combat?: string;
    inventory?: string;
    footer?: string;
    bgFull?: string;
  };
  theme?: 'dark-ice' | 'custom'; // v2 terá mais
  quote?: string; // Quote personalizada exibida no hero
};
```

### `Aptitude.prerequisites`

```typescript
type AptitudePrerequisites = {
  attributes?: { for?: number; des?: number; agi?: number; per?: number; int?: number; vig?: number; esp?: number };
  combatSkills?: { cc?: number; cd?: number; esq?: number; lm?: number };
  pericias?: { [code: string]: number };
  powers?: { [code: string]: number };
  aptitudes?: string[]; // codes de outras aptidões
  kekkeiGenkai?: string[];
  clans?: string[];
  custom?: string; // texto livre para casos complexos
};
```

### `Aptitude.restrictions`

```typescript
type AptitudeRestrictions = {
  restrictedToClans?: string[]; // só clã Yuki pode comprar
  restrictedToKekkeiGenkai?: string[];
  restrictedToVillages?: string[];
  forbiddenWith?: string[]; // não pode ter junto com X aptidões
};
```

### `Power.restrictions`

```typescript
type PowerRestrictions = {
  freeLevelsFromKekkeiGenkai?: { [kgCode: string]: number }; // hyouton dá 1 nível de fuuton + 1 de suiton grátis
  requiredAttribute?: { [attrCode: string]: number };
  restrictedToClans?: string[];
  restrictedToKekkeiGenkai?: string[];
};
```

### `PowerEffect.stats` (varia por tipo de efeito)

**Exemplo: Canhão (Hyouton/Suiton/Fuuton):**
```typescript
type CanhaoStats = {
  effectType: 'canhao';
  action: 'PADRAO';
  target: 'uma_criatura';
  duration: 'INSTANTANEA';
  rollType: 'CD'; // Teste de acerto
  chakraCost: { base: number; perLevel: number };
  damage: { perLevel: number }; // dano = perLevel × nível do poder
  range: { base: number; perEsp: number }; // em metros
  damageFormula?: '2_times_power_level';
};
```

**Exemplo: Névoa (Suiton):**
```typescript
type NevoaStats = {
  effectType: 'nevoa';
  action: 'PADRAO';
  target: 'environment';
  duration: 'SUSTAINED';
  chakraCost: { base: number; perLevel: number };
  area: { base: number; perEsp: number }; // diâmetro em metros
  camouflageChance: number; // % de chance de falha de detecção
  blindFightingRequired: boolean;
};
```

**Exemplo: Criar Arma (Hyouton):**
```typescript
type CriarArmaStats = {
  effectType: 'criar_arma';
  action: 'PARCIAL';
  target: 'personal';
  duration: 'PERMANENT_IF_SOLID'; // ou SUSTAINED se não-sólida
  chakraCost: { byCategory: { leve: 1; mediana: 2; longa: 3; pesada: 3 } };
  allowedCategories: ['leve', 'mediana', 'longa', 'pesada'];
  damageTypes: ['corte', 'perfuracao'];
};
```

**Exemplo: Energizar (Ninpou em arma):**
```typescript
type EnergizarStats = {
  effectType: 'energizar';
  action: 'PARCIAL';
  target: 'weapon';
  duration: 'SUSTAINED';
  chakraCost: { base: number; perLevel: number };
  damageBonus: { perLevel: number };
  appliesAptitudeEffects: boolean; // dispara congelamento, etc.
};
```

---

### `Equipment.stats` (varia por categoria)

**Arma CC/CD:**
```typescript
type WeaponStats = {
  damage: number;          // bônus de dano
  damageType: 'corte' | 'perfuracao' | 'esmagamento';
  category: 'leve' | 'mediana' | 'longa' | 'pesada';
  critical: [number, number]; // ex: [15, 16]
  slots: number;           // ocupação no inventário
  reach?: number;          // para armas com alcance especial
  twoHanded?: boolean;
  isProjectile?: boolean;
  range?: number;          // para CD
  ammunition?: number;     // para projéteis
};
```

**Armadura:**
```typescript
type ArmorStats = {
  absorption: number;
  hardness: number;
  penalty: number;          // penalidade de armadura
  category: 'leve' | 'mediana' | 'pesada';
};
```

**Item ninja (bomba, tarja):**
```typescript
type NinjaItemStats = {
  effect: string;           // descrição do efeito
  uses: number;             // usos por unidade
  damage?: number;
  range?: number;
  area?: number;
};
```

---

### `Clan.benefits`

```typescript
type ClanBenefits = {
  freeAptitudes?: string[];           // aptidões automáticas (códigos)
  freePowers?: { code: string; level: number }[]; // poderes automáticos
  freeKekkeiGenkai?: string;          // KG associado ao clã
  attributeBonus?: { [attr: string]: number }; // bônus de atributo (raro)
  restrictedAptitudes?: string[];     // aptidões que SÓ esse clã pode pegar
  specialRules?: string;              // texto livre pra casos únicos
};
```

### `KekkeiGenkai.benefits`

```typescript
type KekkeiGenkaiBenefits = {
  mainPowerCode: string;              // poder principal (ex: "hyouton")
  freePowerLevelsByElement?: { [elementCode: string]: number }; // hyouton dá 1 nível grátis em fuuton e suiton
  freeAptitudes?: string[];
  restrictedAptitudes?: string[];     // ex: "congelamento" só pra clã Yuki
  specialRules?: string;
};
```

---

## 🔑 Índices e otimizações

```sql
-- Índices Prisma já gera (chaves primárias, uniques, FKs)
-- Índices adicionais necessários:

CREATE INDEX idx_characters_user_active ON characters(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_diary_character_recent ON diary_entries(character_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_share_links_active ON share_links(token) WHERE is_active = true;
```

Esses índices vão na migração inicial ou em migração separada como performance optimization. Prisma 5+ aceita `@@index` com `where` condition.

---

## 🛡️ Constraints e validações no banco

```sql
-- Constraints adicionais via raw SQL nas migrações
ALTER TABLE characters ADD CONSTRAINT campaign_level_range CHECK (campaign_level >= 1 AND campaign_level <= 20);
ALTER TABLE characters ADD CONSTRAINT current_vit_nonneg CHECK (current_vitality >= 0);
ALTER TABLE characters ADD CONSTRAINT current_chk_nonneg CHECK (current_chakra >= 0);
ALTER TABLE characters ADD CONSTRAINT attr_min CHECK (
  attr_for >= 0 AND attr_des >= 0 AND attr_agi >= 0 AND
  attr_per >= 0 AND attr_int >= 0 AND attr_vig >= 0 AND attr_esp >= 0
);
ALTER TABLE characters ADD CONSTRAINT attr_max CHECK (
  attr_for <= 20 AND attr_des <= 20 AND attr_agi <= 20 AND
  attr_per <= 20 AND attr_int <= 20 AND attr_vig <= 20 AND attr_esp <= 20
);
ALTER TABLE character_pericias ADD CONSTRAINT points_nonneg CHECK (points >= 0);
ALTER TABLE character_powers ADD CONSTRAINT level_range CHECK (level >= 1 AND level <= 10);
```

Defesa em profundidade: Zod no client, Zod no server, constraints no banco.

---

## 🌱 Estratégia de seed

Catálogos seedados em `prisma/seed.ts`. Estrutura:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import aptidoes from './seed-data/aptidoes.json';
import poderes from './seed-data/powers.json';
import equipamentos from './seed-data/equipments.json';
import clas from './seed-data/clans.json';
import vilas from './seed-data/villages.json';
import kekkeis from './seed-data/kekkei-genkais.json';

const prisma = new PrismaClient();

async function main() {
  // Upsert para idempotência (rodar várias vezes não duplica)
  for (const aptidao of aptidoes) {
    await prisma.aptitude.upsert({
      where: { code: aptidao.code },
      create: aptidao,
      update: aptidao,
    });
  }
  // ... resto
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

Os JSONs são produzidos a partir do livro (ver `07-SEED-DATA-PLAN.md`).

---

## 🔄 Soft delete pattern

`Character` e `DiaryEntry` têm `deletedAt` nullable.

- **Delete** = `update set deletedAt = NOW()`
- **Queries default filtram** `where: { deletedAt: null }` — encapsulado em helpers de query.
- **Restore** = `update set deletedAt = null`
- **Hard delete** após 30 dias via cron (v2).

```typescript
// src/server/queries/characters.ts
export async function findActiveCharacters(userId: string) {
  return prisma.character.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function softDeleteCharacter(characterId: string, userId: string) {
  return prisma.character.update({
    where: { id: characterId, userId }, // garante ownership
    data: { deletedAt: new Date() },
  });
}
```

---

## 📊 Estimativa de tamanho do banco

Para 1000 usuários ativos com 5 personagens cada:

| Tabela | Linhas estimadas | Tamanho (~) |
|---|---:|---:|
| User | 1k | 100 KB |
| Character | 5k | 5 MB |
| CharacterPericia | 60k (12 perícias × 5k pjs) | 6 MB |
| CharacterAptitude | 25k (5 médias × 5k pjs) | 3 MB |
| CharacterPower | 15k | 1.5 MB |
| CharacterJutsu | 30k | 6 MB |
| CharacterInventoryItem | 50k | 5 MB |
| CharacterImage | 50k (10 médias × 5k pjs) | 10 MB |
| DiaryEntry | 100k | 50 MB (markdown) |
| ShareLink | 5k | 1 MB |
| **Total app** | | **~90 MB** |
| **Catálogos** | ~500 linhas | < 5 MB |

Supabase free tier dá 500 MB — folgado.

**Storage de imagens (Supabase Storage):** 50k imagens × 100KB médio = **5 GB**. Free tier do Supabase é 1 GB. Provavelmente migrar pra Cloudinary ou Vercel Blob na primeira centena de usuários ativos.

---

## ⚠️ Decisões e trade-offs explícitos

### Por que JSONB em vez de tabelas normalizadas para `stats` de Equipment/PowerEffect?

**Trade-off:** validação fraca no banco (Postgres não valida shape do JSONB).
**Por quê fizemos:** flexibilidade. Cada tipo de efeito tem stats radicalmente diferentes; normalizar exigiria 10+ tabelas auxiliares. Validação fica no domínio (Zod). Ganho de produtividade > custo.

### Por que `CharacterPericia` é tabela e não JSONB no Character?

**Trade-off:** mais joins.
**Por quê fizemos:** queries de busca ("encontre PJs com Furtividade > 3") ficam viáveis. Crescimento controlado (12 perícias × N PJs = bounded).

### Por que perícias têm `periciaCode` string em vez de FK?

**Trade-off:** sem garantia referencial no banco.
**Por quê fizemos:** perícias são **hardcoded** no domínio (constante de 12 itens, nunca muda). FK seria over-engineering. O domínio garante consistência.

### Por que Snapshots de versão NÃO estão no schema?

Falamos disso na conversa de spec. Decisão: **v2**, não MVP. Implementação futura seria uma tabela `CharacterSnapshot` com `characterId`, `snapshotData JSONB`, `createdAt`, `reason` (ex: "Subiu para NC 7"). Hoje o histórico se perde se a ficha for editada.

### Por que User não tem múltiplos auth providers?

MVP só tem Google. Quando v2 trouxer login com email/senha ou GitHub, adicionamos tabela `UserAuthProvider` ou colunas alternativas.

> 🔶 **ABERTO:** algumas decisões podem mudar com o Claude Code apontando casos durante implementação. Schema não é imutável até a primeira migração entrar em produção.

---

*Próximo documento: `04-RULES-ENGINE.md` — fórmulas e validações do sistema SnS.*
