# 07 — Plano de Seed de Dados

## 🎯 Objetivo

Popular o banco com **todos os catálogos do livro Shinobi no Sho 4.1b** que o motor de regras precisa para validar e operar. Sem dados seedados, o sistema não tem aptidões, poderes, equipamentos, clãs — fica vazio.

---

## 📦 O que precisa ser seedado

| Catálogo | Quantidade aprox. | Prioridade | Fonte no livro |
|---|:---:|---|---|
| **Aptidões** | ~80 | 🔴 Crítica | Cap. Aptidões + Guia Avançado |
| **Poderes** | ~25 | 🔴 Crítica | Cap. Poderes (pág 84-141) |
| **Efeitos de poder** | ~150 | 🔴 Crítica | Embedded em cada poder |
| **Equipamentos** | ~50 | 🟠 Alta | Cap. Equipamentos |
| **Clãs** | ~30 | 🟠 Alta | Cap. Clãs (pág 142-200) |
| **Vilas** | ~10 | 🟡 Média | Cap. Mundo |
| **Kekkei Genkais** | ~15 | 🟠 Alta | Embedded em clãs |
| **Itens consumíveis** | ~20 | 🟡 Média | Cap. Equipamentos |

**Total:** ~380 entidades a serem extraídas.

---

## 🛠️ Estratégia de extração

### Fluxo proposto

```
1. Eu (Claude) extraio do PDF → JSONs estruturados
   ↓
2. Você revisa os JSONs (spot-check em alguns)
   ↓
3. Coloca os JSONs em prisma/seed-data/
   ↓
4. Claude Code roda pnpm prisma db seed
   ↓
5. Banco populado, sistema operacional
```

### Por que assim e não "Claude Code extrai sozinho"

- **Confiabilidade.** PDFs têm formatação inconsistente, tabelas quebradas, símbolos especiais. Erros em catálogos = bugs silenciosos pro resto do projeto.
- **Custo.** Claude Code rodando extração interativamente é caro em tokens. Pré-processar uma vez é mais barato.
- **Revisão humana.** Você consegue validar samples ("essa aptidão tá certa?") sem reler o livro todo.
- **Versionamento.** JSONs no Git = histórico de mudanças. Posso reextrair partes específicas quando o livro for atualizado.

---

## 📁 Estrutura de entrega

Vou entregar a pasta `prisma/seed-data/` com:

```
prisma/seed-data/
├── README.md                         # Como usar, fontes, decisões
├── aptidoes.json                     # ~80 aptidões
├── powers.json                       # ~25 poderes (sem efeitos)
├── power-effects.json                # ~150 efeitos de poderes
├── equipments.json                   # ~50 equipamentos
├── clans.json                        # ~30 clãs
├── villages.json                     # ~10 vilas
├── kekkei-genkais.json               # ~15 KGs
├── pericias.json                     # 18 perícias (hardcoded no domínio também)
└── attributes.json                   # 7 atributos (hardcoded no domínio também)
```

E o script Prisma:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Ordem importa por causa de foreign keys
  await seedClans();
  await seedVillages();
  await seedKekkeiGenkais();
  await seedPowers();           // antes de aptidões (pré-requisitos referenciam poderes)
  await seedPowerEffects();
  await seedAptitudes();
  await seedEquipments();

  console.log('✅ Seed completo.');
}

async function seedAptitudes() {
  const data = JSON.parse(readFileSync('prisma/seed-data/aptidoes.json', 'utf-8'));
  for (const apt of data) {
    await prisma.aptitude.upsert({
      where: { code: apt.code },
      create: apt,
      update: apt,
    });
  }
  console.log(`   ✓ ${data.length} aptidões`);
}

// ... outras funções similares

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

---

## 📋 Formato de cada JSON

### Aptidões (`aptidoes.json`)

```json
[
  {
    "code": "acuidade",
    "name": "Acuidade",
    "category": "COMBATE",
    "costPoints": 2,
    "shortDescription": "Usa Destreza no lugar de Força para calcular CC.",
    "description": "Você é especialmente ágil com armas leves, que usam mais destreza do que força bruta.\n\nBenefício: Você é capaz de utilizar sua Destreza para calcular seu nível de Combate Corporal. Ou seja, seu nível de CC passa a ser igual ao Valor Base + Destreza.\n\n**Ataques:** Esta aptidão somente pode ser usada para: ataques desarmados, técnicas com alcance de toque, armas leves e qualquer outra arma na qual o texto diga que esta aptidão é aplicável...\n\n**Dano:** O dano do ataque não é alterado por esta aptidão.\n\n**Bloqueio:** pode ser usada na reação de Bloqueio, desde que seja com um tipo de arma permitido ou desarmado.\n\n**Pré-requisitos:** Você pode utilizar o seu novo nível de CC com Acuidade para cumprir pré-requisitos...",
    "prerequisites": { "attributes": { "des": 3 } },
    "restrictions": {},
    "isFree": false
  },
  {
    "code": "especialista",
    "name": "Especialista",
    "category": "COMBATE",
    "costPoints": 2,
    "shortDescription": "+1 de precisão em CC ou CD com uma categoria específica de arma.",
    "description": "Você é treinado com um tipo específico de arma...",
    "prerequisites": { "combatSkills": { "cc": 4 } },
    "restrictions": {},
    "isFree": false,
    "requiresParameter": true,
    "parameterOptions": ["katana", "espada_curta", "machado", "lanca", "arco", "shuriken", "kunai", "..."]
  }
]
```

### Poderes (`powers.json`)

```json
[
  {
    "code": "hyouton",
    "name": "Hyouton",
    "category": "KEKKEI_GENKAI",
    "shortDescription": "Elemento Gelo — combinação avançada de Suiton e Fuuton.",
    "description": "Texto completo do livro sobre o poder Hyouton, suas regras especiais, restrições...",
    "costPerLevel": 1,
    "element": "gelo",
    "restrictions": {
      "freeLevelsFromKekkeiGenkai": { "hyouton": 0 },
      "restrictedToKekkeiGenkai": ["hyouton"]
    }
  },
  {
    "code": "suiton",
    "name": "Suiton",
    "category": "NINPOU",
    "shortDescription": "Elemento Água.",
    "description": "...",
    "costPerLevel": 1,
    "element": "agua",
    "restrictions": {}
  }
]
```

### Efeitos de Poder (`power-effects.json`)

```json
[
  {
    "powerCode": "hyouton",
    "code": "canhao",
    "name": "Canhão",
    "minLevel": 1,
    "shortDescription": "Disparo de projétil de gelo à distância.",
    "description": "Texto completo do livro descrevendo o efeito Canhão para Hyouton...",
    "stats": {
      "effectType": "canhao",
      "action": "PADRAO",
      "target": "uma_criatura",
      "duration": "INSTANTANEA",
      "rollType": "CD",
      "chakraCost": { "base": 1, "perLevel": 1 },
      "damage": { "perLevel": 2 },
      "range": { "base": 10, "perEsp": 2 },
      "damageFormula": "2_times_power_level"
    },
    "tags": ["projectile", "Padrão", "Uma criatura", "Comum do poder (à distância)", "Instantânea"]
  },
  {
    "powerCode": "suiton",
    "code": "nevoa",
    "name": "Névoa",
    "minLevel": 2,
    "shortDescription": "Cria nevoeiro que dificulta a visão.",
    "description": "...",
    "stats": {
      "effectType": "nevoa",
      "action": "PADRAO",
      "target": "environment",
      "duration": "SUSTAINED",
      "chakraCost": { "base": 2, "perLevel": 0 },
      "area": { "base": 30, "perEsp": 5 },
      "camouflageChance": 0.25,
      "blindFightingRequired": true
    },
    "tags": ["Padrão", "Área", "Sustentada"]
  }
]
```

### Equipamentos (`equipments.json`)

```json
[
  {
    "code": "tachi",
    "name": "Tachi",
    "category": "ARMA_CC",
    "shortDescription": "Espada de corte mediana, similar à katana.",
    "description": "...",
    "stats": {
      "damage": 2,
      "damageType": "corte",
      "category": "mediana",
      "critical": [15, 16],
      "slots": 1
    },
    "tags": ["lâmina", "tradicional"],
    "basePrice": 80
  },
  {
    "code": "shuriken",
    "name": "Shuriken",
    "category": "ARMA_ARREMESSO",
    "shortDescription": "Estrela ninja para arremesso.",
    "description": "...",
    "stats": {
      "damage": 1,
      "damageType": "corte",
      "category": "leve",
      "critical": [15, 16],
      "slots": 0,
      "isProjectile": true,
      "range": 10
    },
    "tags": ["projétil", "ninja"],
    "basePrice": 5
  }
]
```

### Clãs (`clans.json`)

```json
[
  {
    "code": "yuki",
    "name": "Yuki",
    "shortDescription": "Clã do elemento Gelo, originário da Vila Oculta da Névoa.",
    "description": "Texto completo do livro sobre o clã Yuki, sua história, características...",
    "benefits": {
      "freeKekkeiGenkai": "hyouton",
      "specialRules": "Membros do clã Yuki podem comprar a aptidão Congelamento (restrita)."
    }
  },
  {
    "code": "uchiha",
    "name": "Uchiha",
    "shortDescription": "Clã dos olhos vermelhos, mestres do Sharingan e do Katon.",
    "description": "...",
    "benefits": {
      "freeKekkeiGenkai": "sharingan",
      "freePowers": [{ "code": "katon", "level": 1 }]
    }
  }
]
```

### Vilas (`villages.json`)

```json
[
  {
    "code": "konoha",
    "name": "Konoha",
    "fullName": "Vila Oculta da Folha",
    "shortDescription": "Maior vila ninja do País do Fogo.",
    "description": "...",
    "benefits": {}
  },
  {
    "code": "nami",
    "name": "Nami",
    "fullName": "Vila Oculta das Ondas",
    "shortDescription": "Pequena vila do País do Mar, conhecida por seus shinobi aquáticos.",
    "description": "...",
    "benefits": {}
  }
]
```

### Kekkei Genkais (`kekkei-genkais.json`)

```json
[
  {
    "code": "hyouton",
    "name": "Hyouton",
    "shortDescription": "Linhagem do Gelo. Combina Suiton e Fuuton.",
    "description": "...",
    "benefits": {
      "mainPowerCode": "hyouton",
      "freePowerLevelsByElement": { "fuuton": 1, "suiton": 1 },
      "specialRules": "Acesso a efeitos exclusivos de Hyouton (Espelhos Demoníacos, Congelamento)."
    }
  }
]
```

---

## 🎯 Plano de execução

### Fase A — Extração core (eu faço)

**O que vou entregar (em ordem):**

1. **`pericias.json` + `attributes.json`** — fácil, 1 hora de trabalho. Lista fechada, alta confiança.
2. **`villages.json`** — pequeno, ~10 entradas.
3. **`clans.json`** — médio, ~30 entradas. Cuidado com benefícios complexos.
4. **`kekkei-genkais.json`** — ~15 entradas, mas com regras intricadas (especialmente Hyouton e Sharingan).
5. **`powers.json`** — ~25 poderes. Sem efeitos ainda.
6. **`power-effects.json`** — ~150 efeitos. Mais demorado, JSON do `stats` precisa de cuidado.
7. **`aptidoes.json`** — ~80 aptidões. Cuidado com prerequisites estruturados.
8. **`equipments.json`** — ~50 itens. Stats por categoria.

**Estimativa de tempo:** ~3-5 sessões de trabalho minhas (não da sua parte).

### Fase B — Revisão humana (você faz)

Pra cada arquivo, sugiro **spot-check** de:
- 5-10 entradas aleatórias completas (descrição bate com livro?)
- 2-3 entradas críticas conhecidas (Satsuki usa Hyouton — Hyouton tá certo?)
- Casos de borda (aptidões restritas, KGs raras)

Não precisa revisar tudo — é amostragem. Se 10/10 baterem, confio nos outros 50.

### Fase C — Integração (Claude Code faz)

1. Coloca JSONs em `prisma/seed-data/`
2. Implementa `prisma/seed.ts`
3. Roda `pnpm prisma db seed`
4. Verifica via Prisma Studio que tabelas estão populadas
5. Testa motor de regras com dados reais

---

## ⚠️ Decisões e ambiguidades

Durante extração, alguns pontos do livro são ambíguos ou contraditórios. Decisões padrão:

### Aptidões com múltiplas parametrizações

Aptidões como "Especialista", "Maestria", "Domínio" precisam de **argumento** (ex: Especialista de Katana vs de Espada Curta).

**Decisão:** modelar como **uma única aptidão com `requiresParameter: true`** + `parameterOptions: [...]`. No `CharacterAptitude`, salva o parâmetro escolhido.

### Aptidões restritas a clãs

Algumas aptidões (Congelamento → Yuki) só são compráveis por clãs específicos.

**Decisão:** `restrictions.restrictedToClans: ["yuki"]`. Motor valida na compra.

### Poderes "Hijutsu" especiais

Hijutsus (Jinchuuriki, Senjutsu) têm regras únicas (caudas, modo bijuu).

**Decisão:** modelar como `PowerCategory.HIJUTSU`. Stats no JSONB com campos específicos por hijutsu. Aceitar que alguns efeitos terão **descrição textual rica** mas implementação mecânica limitada no MVP (motor só calcula o que está estruturado).

### Efeitos com regras "extras" muito específicas

Alguns efeitos têm parágrafos inteiros de regras (Ataque Pesado, Manto Bijuu).

**Decisão:** colocar a regra completa na `description` (markdown). Motor implementa só o **núcleo estatístico** (custo, dano, alcance). Texto rico fica pra UI mostrar ao jogador.

### Equipamentos sem stats claros (itens narrativos)

Alguns itens são puramente narrativos (pergaminhos, livros).

**Decisão:** categoria `MISC`, `stats: {}`. Aparecem no inventário mas não interagem com motor.

### Valores em Ryos

Preços base do livro são em Ryos. Algumas armas têm preço variável (artesanais, mestres).

**Decisão:** usar valor **médio**. Mestres podem ajustar via custom inventory items.

---

## 🔄 Manutenção e atualizações futuras

### Quando o livro for atualizado (4.1c, 4.2, etc.)

Estratégia:
1. Comparar PDF novo vs versão atual (manual)
2. Identificar entradas mudadas
3. Atualizar JSONs específicos
4. Rerodar seed (upsert é idempotente)
5. Bump em `schemaVersion` se mudanças quebram (raro)

### Quando comunidade contribuir

PRs em JSON são fáceis de revisar. Sugestões:
- Validação de schema via Zod no script de seed
- CI valida JSONs antes de aceitar PR
- Issue template "Sugerir aptidão / poder / item"

### Homebrew em produção (v2+)

Adicionar:
- Tabela `UserCustomAptitude` (aptidões custom de mestres)
- Permissão de propor "subir pro catálogo oficial" via flag
- Sistema de aprovação se for público

---

## 📊 Estimativa final

| Item | Tempo meu | Tempo seu | Tempo Claude Code |
|---|---|---|---|
| Extração de JSONs | ~10-15 horas | — | — |
| Revisão (spot-check) | — | ~2-3 horas | — |
| Integração (seed.ts + execução) | — | — | ~3-4 horas |

**Total:** ~15-20 horas distribuídas. Pode rolar em paralelo com F0/F1 do roadmap (não bloqueia auth/setup).

---

## 🚀 Quando começamos a extração?

A extração dos catálogos pode acontecer de duas formas:

**Opção 1 — Agora, em paralelo:** depois que você confirmar essa spec, eu já começo a extrair os primeiros JSONs (perícias, vilas, clãs). Você recebe entregas incrementais.

**Opção 2 — Depois, quando F1 acabar:** Claude Code começa o projeto, faz F0 e F1, e a extração rola perto de F2.3. Mais "just in time".

**Recomendação:** **Opção 1**. Adianta trabalho que está no caminho crítico. Se ficar pronto antes, não atrapalha. Se atrasar, F2 espera.

---

## 📝 Checklist pré-extração

Antes de eu começar:

- [ ] Você confirma o formato dos JSONs (acima)?
- [ ] Você confirma a ordem de extração (perícias → vilas → clãs → KGs → poderes → efeitos → aptidões → equipamentos)?
- [ ] Você prefere Opção 1 (paralelo agora) ou Opção 2 (just in time)?
- [ ] Tem algum catálogo específico que você quer **priorizado** (ex: clã Yuki + tudo do Hyouton primeiro pra recriar Satsuki)?

---

*Fim da especificação. Documentos 00-07 completos. Próximo passo: ação do usuário sobre extração.*
