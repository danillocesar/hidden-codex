# Seed Data — Lote 2

Segunda entrega: **Clãs e Kekkei Genkais** — destrava criação de personagens completos com origem definida.

## 📦 Conteúdo deste lote

| Arquivo | Itens | Status |
|---|:---:|---|
| `clans.json` | 17 | ✅ 11 do Livro Básico + 6 do Livro de Hijutsus |
| `kekkei-genkais.json` | 6 | ✅ Hyouton, Sharingan, Byakugan, Mokuton, Shikotsumyaku + Juuken (com nota) |

## 🎯 Por que esse lote é crítico

Esse lote destrava a **criação da Satsuki Yuki** no sistema:
- Clã Yuki ✅
- Kekkei Genkai Hyouton ✅ (com 1 nível grátis em Fuuton e 1 em Suiton)

Sem ele, o motor pode validar regras mas o usuário não consegue construir o personagem completo.

## ⚠️ AÇÕES REQUERIDAS DE SCHEMA

### 1. Campo `customClanName` no `Character`

Mesma lógica de `customVillageName` do lote 1. O personagem pode:
- Ter `clanId` (FK para `Clan` do catálogo), **OU**
- Ter `customClanName` (string, vinculado a clã customizado/órfão), **OU**
- Nenhum dos dois (personagem sem clã definido)

**Migration sugerida:** `pnpm prisma migrate dev --name add_custom_clan_name`

### 2. Verificar campos do `Clan` no schema

O JSON tem campos que talvez não estejam no schema atual de `Clan`:

| Campo no JSON | Comentário |
|---|---|
| `code` | ✓ Provavelmente já tem |
| `name` | ✓ Provavelmente já tem |
| `village` | Código da vila associada (FK string opcional para `Village.code`). Verificar se schema tem isso. |
| `shortDescription` | Texto curto pra UI |
| `description` | Texto completo do livro |
| `benefits` | JSONB com estrutura específica — ver shapes abaixo |

### 3. Verificar campos do `KekkeiGenkai` no schema

| Campo no JSON | Comentário |
|---|---|
| `code` | ✓ |
| `name` | ✓ |
| `translation` | Adicionar se não existir (string opcional) — ex: "Olho que Copia" para Sharingan |
| `associatedClan` | FK string para `Clan.code` |
| `shortDescription` | Pra UI |
| `description` | Texto completo |
| `benefits` | JSONB |

### 4. Campo `kekkeiGenkaiId` no `Character`

Esse campo já está no schema conforme `03-DATA-MODEL.md`. Apenas validar.

## 📋 Shapes do JSONB `benefits`

### `Clan.benefits`

```typescript
type ClanBenefits = {
  restrictedAptitudes?: string[];        // Aptidões compráveis APENAS por este clã
  restrictedPowers?: string[];           // Poderes compráveis APENAS por este clã
  requiredFromOrigin?: string;           // Texto livre: coisas obrigatórias na criação
  kekkeiGenkai?: string;                 // Código da KG associada (FK lógica)
  hijutsuOptions?: Array<{               // Para clãs com opção de hijutsu
    name: string;
    type: 'invocacao' | 'tensai' | 'kekkei_genkai';
  }>;
  exclusiveInvocation?: string;          // Ex: "Tubarão" para Hoshigaki
  specialRules?: string;                 // Texto livre
};
```

### `KekkeiGenkai.benefits`

```typescript
type KekkeiGenkaiBenefits = {
  mainPowerCode?: string;                // Poder principal (ex: "hyouton")
  freePowerLevelsByElement?: {           // Níveis grátis em outros poderes
    [powerCode: string]: number;
  };
  linkedAptitudes?: string[];            // Aptidões que pertencem a esta KG
  linkedPowers?: string[];               // Poderes vinculados (ex: Byakugan → Juuken)
  additionalHardness?: number;           // Bônus de dureza em criações (Hyouton: +2)
  resistanceDifficultyBonus?: number;    // Bônus na Dif dos testes de resistência
  restrictedElements?: string[];         // Lista de elementos permitidos (Hyouton só pode aprender Hyouton/Suiton/Fuuton)
  specialRules?: string;                 // Texto livre
};
```

## 🚨 Pontos de atenção

### 1. Clãs sem vila padrão

Dois clãs têm `village: null`:
- **Fuuma** (proscritos do País do Arroz)
- **Kaguya** (extinto, sem vila base)

Trate `village: null` como "clã sem vila padrão" — o personagem ainda escolhe sua vila normalmente.

### 2. Aptidões e poderes não estão no banco ainda

Os arrays `restrictedAptitudes` e `restrictedPowers` referenciam **códigos** que virão nos próximos lotes:
- Lote 3: Poderes (`hyouton`, `katon`, `juuken`, etc.)
- Lote 5: Aptidões (`congelamento`, `byakugan`, etc.)

**Por ora, esses arrays são apenas strings.** Quando os JSONs de aptidões e poderes chegarem, o motor pode validar referências. **Não crie tabelas de associação ainda** — os arrays JSONB são suficientes.

### 3. Juuken — caso especial

Juuken está no `kekkei-genkais.json` apenas como referência/clareza. Tecnicamente é um **Poder Restrito**, não uma KG. **No banco, modelar como `Power` (não `KekkeiGenkai`).** A entrada pode ser removida do JSON ou marcada como `"_skipInSeed": true`.

### 4. Hijutsu options (Sarutobi, Hatake, Senju, Yotsuki)

Alguns clãs oferecem **2 caminhos** distintos durante a criação (`hijutsuOptions`). Por exemplo, Hatake:
- Opção A: Kuchiyose Restrito (Cães)
- Opção B: Tensai + Presa de Prata

**No MVP, isso pode ser modelado como:** o usuário escolhe a opção durante criação, e o sistema aplica os benefícios correspondentes. **Fora do escopo do seed** — é decisão de UX.

Por ora, **importe o `hijutsuOptions` como JSONB** e deixe a UI/motor decidir como usar depois.

### 5. Restrições do Hyouton (importante pra Satsuki)

A KG Hyouton tem `restrictedElements: ["hyouton", "suiton", "fuuton"]`. Isso significa:
- Personagem com clã Yuki **NÃO PODE** aprender Katon, Raiton, Doton, etc.
- Pode aprender apenas Hyouton (KG), Suiton e Fuuton.

**O motor de regras precisa validar isso** quando o personagem tentar comprar um novo poder.

## 🔧 Padrão de seed (continuação)

Adicione ao `prisma/seed.ts`:

```typescript
async function seedClans() {
  const clans = loadSeedFile('clans.json');
  for (const c of clans) {
    await prisma.clan.upsert({
      where: { code: c.code },
      create: c,
      update: c,
    });
  }
  console.log(`✓ ${clans.length} clãs`);
}

async function seedKekkeiGenkais() {
  const kgs = loadSeedFile('kekkei-genkais.json');
  for (const kg of kgs) {
    // Pular Juuken — não é KG real
    if (kg.code === 'juuken') continue;
    await prisma.kekkeiGenkai.upsert({
      where: { code: kg.code },
      create: kg,
      update: kg,
    });
  }
  console.log(`✓ ${kgs.length - 1} kekkei genkais (juuken pulado — é poder)`);
}

async function main() {
  console.log('🌱 Iniciando seed...');
  // Ordem: vilas e KGs antes de clãs (clãs referenciam ambas)
  await seedVillages();
  await seedKekkeiGenkais();
  await seedClans();
  await seedPericias();
  console.log('✅ Seed completo.');
}
```

## ✅ Validação pós-seed

Depois de rodar `pnpm prisma db seed`:

1. Abra `pnpm prisma studio`
2. Verifique tabela `clans`:
   - 17 linhas (16 se contar que Juuken não vai)
   - **Yuki**: `village: "kiri"`, `benefits.kekkeiGenkai: "hyouton"`, `benefits.restrictedPowers: ["hyouton"]`
   - **Uchiha**: `village: "konoha"`, `benefits.kekkeiGenkai: "sharingan"`, `benefits.requiredFromOrigin` preenchido
   - **Aburame**: `benefits.restrictedAptitudes` tem 4 entradas
3. Verifique tabela `kekkei_genkais`:
   - 5 linhas (Hyouton, Sharingan, Byakugan, Mokuton, Shikotsumyaku)
   - **Hyouton**: `benefits.freePowerLevelsByElement = { fuuton: 1, suiton: 1 }`
   - **Hyouton**: `benefits.restrictedElements = ["hyouton", "suiton", "fuuton"]`

## 🔮 Próximos lotes

| Lote | Conteúdo | Estimativa |
|---|---|---|
| **Lote 3** | Poderes (~25): Ninpou, Suiton, Fuuton, Hyouton, Katon, Raiton, Doton, Genjutsu, Iryou, Fuuinjutsu, etc. | Em breve |
| **Lote 4** | Efeitos de poder (~150): Canhão, Névoa, Barreira, Criar Arma, Energizar, etc. | Em breve |
| **Lote 5** | Aptidões (~80): Acuidade, Especialista, Ataque Poderoso, Velocista, Lutar às Cegas, Congelamento, Selos Especiais, etc. | Em breve |
| **Lote 6** | Equipamentos (~50): Tachi, Wakizashi, Shuriken, Kunai, Colete Ninja, bombas, etc. | Em breve |
