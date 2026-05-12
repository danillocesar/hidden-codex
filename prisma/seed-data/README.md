# Seed Data — Lote 3

Terceira entrega: **Poderes** — destrava a lista de poderes selecionáveis na criação de personagem.

## 📦 Conteúdo

| Arquivo | Itens | Observação |
|---|:---:|---|
| `powers.json` | 19 | 13 comuns/restritos + 6 elementais (Ninpou + 5 básicos + Hyouton) |

## 🎯 Categorias incluídas

### Elementais básicos (6)
- **Ninpou** — base genérica, sem elemento
- **Katon** — Fogo (forte vs Fuuton, fraco vs Suiton)
- **Suiton** — Água (forte vs Katon, fraco vs Doton)
- **Fuuton** — Vento (forte vs Raiton, fraco vs Katon)
- **Doton** — Terra (forte vs Suiton, fraco vs Raiton)
- **Raiton** — Trovão (forte vs Doton, fraco vs Fuuton)

### Kekkei Genkai (2)
- **Hyouton** — Gelo (clã Yuki) — combina Fuuton + Suiton ✨ **Satsuki**
- **Mokuton** — Madeira (clã Senju) — combina Doton + Suiton

### Comuns especiais (4)
- **Magen** — Genjutsu avançado
- **Iryou Ninjutsu** — Cura
- **Fuuinjutsu** — Selamento
- **Rasengan** — Bola de chakra
- **Kuchiyose** — Invocação

### Restritos de clã (6)
- **Juuken** (Hyuuga)
- **Kagejutsu** (Nara)
- **Baika Ninpou** (Akimichi)
- **Kikai Ninpou** (Aburame)
- **Shintenshin** (Yamanaka)
- **Shikakyu** (Inuzuka)

## 🔑 Pontos importantes

### 1. Limite de nível (motor de regras)

Limite máximo de qualquer poder = **NC ÷ 2 (round DOWN)**.

Exemplo: NC 6 → poder máximo nível 3. NC 11 → poder máximo nível 5.

Esse é o **único caso de arredondamento para baixo no sistema** — todos os outros são para cima.

### 2. Restrições de elemento (Hyouton/Mokuton)

Personagens com Hyouton **não podem aprender** Katon, Raiton, Doton.
Personagens com Mokuton **não podem aprender** Katon, Raiton, Fuuton.

Campo `rules.restrictedElements` lista quais elementos são permitidos. Motor precisa validar quando o usuário tentar comprar um novo poder elemental.

### 3. Níveis grátis em outros poderes

Hyouton e Mokuton dão **1 nível grátis** em poderes elementais associados:
- Hyouton: 1 grátis em Fuuton + 1 grátis em Suiton
- Mokuton: 1 grátis em Doton + 1 grátis em Suiton

Esses níveis grátis **não contam pro budget de pontos**. Permite usar o efeito Canhão dos elementos secundários usando o nível do poder principal como parâmetro.

### 4. Efeitos exclusivos não estão neste lote

Cada poder tem efeitos exclusivos (ex: Hyouton tem Espelhos Demoníacos, Suiton tem Névoa, Doton tem Imergir). **Os efeitos estão no Lote 4.**

O campo `rules.exclusiveEffects` lista os códigos por enquanto — referencia futura.

### 5. Categorias de poder

Três categorias usadas no campo `category`:

| Categoria | Significado |
|---|---|
| `COMUM` | Qualquer personagem pode comprar |
| `RESTRITO_CLA` | Precisa do clã específico (campo `associatedClan`) |
| `KEKKEI_GENKAI` | KG vinculada a um clã específico (campos `associatedKekkeiGenkai` + `associatedClan`) |
| `RESTRITO` | Restrito por pré-requisitos (Magen requer Int 6 + 3 aptidões) |

### 6. Confronto de elementos

Vantagens elementais (campo `stats.elementAdvantage` e `elementDisadvantage`):

```
Katon → Fuuton → Raiton → Doton → Suiton → Katon (ciclo)
```

Quando elementos rivais se confrontam, o elemento de desvantagem tem **dureza e dano cortados pela metade**. Motor precisa aplicar isso em confrontos de jutsus.

Ninpou e KGs (Mokuton, Hyouton) **não têm vantagem nem desvantagem** contra ninguém — exceto onde explicitamente especificado.

### 7. Combo de elementos (NC alto)

Em Espírito 12 ou Inteligência 12, personagem pode unir 2 elementos diferentes em uma técnica única (Técnica Acelerada). Não modelado no MVP — virá em lote futuro/v2.

## 📋 Shape do `Power.stats`

JSONB com formato variável por poder. Estrutura comum:

```typescript
type PowerStats = {
  rangeFormula?: {
    base: number;          // metros base (ex: 10)
    perEsp?: number;       // metros adicionais por nível de Espírito
    perPowerLevel?: number; // alternativa: metros por nível do poder
    category: 'Toque' | 'Curto' | 'Médio' | 'Longo';
  } | 'pessoal' | 'toque' | 'corpo_a_corpo';

  sizeFormula?: {
    perEsp: number;        // metros de área por nível de Espírito
    unit: 'm';
  };

  defaultDamageFormula?: string;       // ex: "nivel_usado + ceil(esp / 2)"
  defaultDifficultyFormula?: string;
  defaultHardnessFormula?: string;
  chakraCostFormula?: string;

  elementBonus?: number;               // bônus de dano extra (Katon: +2)
  elementBonusType?: 'dano' | 'alcance';
  elementAdvantage?: string[];         // códigos de elementos contra os quais tem vantagem
  elementDisadvantage?: string[];

  additionalHardness?: number;         // Hyouton: +2 em criações
  resistanceDifficultyBonus?: number;  // Hyouton: +1 na Dif dos testes

  damageFormula?: string;              // override pra poderes com fórmula única (Rasengan)
  healFormula?: string;                // Iryou
  rollType?: 'CC' | 'CD' | 'sem_teste';
};
```

## 📋 Shape do `Power.rules`

```typescript
type PowerRules = {
  selosDefault?: boolean;              // Requer selos de mão por padrão?
  canBeBoughtMultipleTimes?: boolean;  // Apenas Ninpou
  secondPurchaseNote?: string;
  freePowerLevelsByElement?: {         // Hyouton/Mokuton
    [powerCode: string]: number;
  };
  restrictedElements?: string[];       // Hyouton só pode aprender Hyouton/Suiton/Fuuton
  permanentDurationsMelt?: string;     // Hyouton: criações derretem 1h por nível
  allowedEffects?: string[];           // Códigos de efeitos permitidos
  exclusiveEffects?: string[];         // Efeitos exclusivos (Espelhos Demoníacos, etc.)
  prerequisites?: {
    attributes?: { [attr: string]: number };
    skills?: { [skill: string]: number };
    aptitudes?: string[];
    clan?: string;
  };
  requiresContract?: boolean;          // Kuchiyose
  keySkill?: string;                   // Kikai Ninpou usa Lidar com Animais
  illusionTypes?: string[];            // Magen
  noPrecisionTest?: boolean;           // Magen (não usa teste de acerto)
};
```

## 🚨 AÇÕES REQUERIDAS no schema

Verifique se a tabela `Power` no schema atual tem:

| Campo | Tipo | Observação |
|---|---|---|
| `code` | string unique | ✓ Provavelmente já tem |
| `name` | string | ✓ |
| `translation` | string opcional | Adicionar se faltar |
| `category` | enum (PowerCategory) | Verificar se tem todos os valores: `COMUM`, `RESTRITO`, `RESTRITO_CLA`, `KEKKEI_GENKAI` |
| `element` | string opcional | Pra poderes elementais |
| `associatedKekkeiGenkai` | FK string opcional | Pra KGs |
| `associatedClan` | FK string opcional | Pra poderes restritos de clã |
| `shortDescription` | string | |
| `description` | text | |
| `stats` | Json | JSONB shape acima |
| `rules` | Json | JSONB shape acima |

**Migration sugerida se faltar campos:** `pnpm prisma migrate dev --name extend_power_table`

## 🔧 Padrão de seed (continuação)

```typescript
async function seedPowers() {
  const powers = loadSeedFile('powers.json');
  for (const p of powers) {
    await prisma.power.upsert({
      where: { code: p.code },
      create: p,
      update: p,
    });
  }
  console.log(`✓ ${powers.length} poderes`);
}

async function main() {
  console.log('🌱 Iniciando seed...');
  // Ordem: vilas → KGs → clãs → poderes → perícias
  await seedVillages();
  await seedKekkeiGenkais();
  await seedClans();
  await seedPowers();      // ← novo
  await seedPericias();
  console.log('✅ Seed completo.');
}
```

## ✅ Validação pós-seed

Depois de `pnpm prisma db seed`:

1. `pnpm prisma studio`
2. Tabela `powers` tem 19 linhas
3. Verifique entradas críticas:
   - **Ninpou**: `category: "COMUM"`, sem element, `rules.canBeBoughtMultipleTimes: true`
   - **Hyouton**: `category: "KEKKEI_GENKAI"`, `associatedKekkeiGenkai: "hyouton"`, `associatedClan: "yuki"`, `rules.freePowerLevelsByElement: {fuuton: 1, suiton: 1}`, `rules.restrictedElements: ["hyouton", "suiton", "fuuton"]`
   - **Katon**: `category: "COMUM"`, `element: "fogo"`, `stats.elementBonus: 2`, `stats.elementAdvantage: ["fuuton"]`, `stats.elementDisadvantage: ["suiton"]`
   - **Juuken**: `category: "RESTRITO_CLA"`, `associatedClan: "hyuuga"`, `rules.prerequisites.aptitudes: ["byakugan"]`

## 🔮 Próximos lotes

| Lote | Conteúdo | Status |
|---|---|---|
| **Lote 4** | Efeitos de poder (~150): Canhão, Orbe, Barreira, Sopro Destrutivo, Raio, Energizar, Criar Arma, Névoa, etc. | Próximo |
| Lote 5 | Aptidões (~80) | Pendente |
| Lote 6 | Equipamentos (~50) | Pendente |
