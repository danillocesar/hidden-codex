# Seed Data — Lote 4a (Efeitos Universais de Ninpou)

Primeira onda do **Lote 4 (Efeitos)** — o maior lote do seed em volume, dividido em 5 ondas pra entrega controlada.

## 📦 Conteúdo desta onda

| Arquivo | Itens | Observação |
|---|:---:|---|
| `effects-ninpou-universal.json` | 18 | Efeitos universais que servem pra Ninpou + todos os elementos básicos (Doton, Fuuton, Katon, Raiton, Suiton) e KGs elementais (Hyouton, Mokuton) |

## 🌊 Visão geral do Lote 4 inteiro

| Onda | Conteúdo | Status |
|:-:|---|:-:|
| **4a** | Núcleo Ninpou universal (18 efeitos) | ✅ **esta** |
| 4b | Efeitos exclusivos dos 5 elementos básicos | ⏳ Próxima |
| 4c | KGs e Hijutsus complexos (Hyouton, Mokuton, Sabaku, Jiton, Yonbi Youton, Aoi Katon, Sanbi Suiton, Senjutsu, Hachimon) | ⏳ |
| 4d | Poderes restritos de clã (Magen, Iryou, Fuuinjutsu, Rasengan, Kuchiyose, Juuken, Kagejutsu, Baika, Kikai, Shikakyu, Shintenshin) | ⏳ |
| 4e | Efeitos novos do Guia Avançado (Dano Contínuo, Deslocamento de Vácuo, Purificar, Repelir, Flutuar, Desastre) | ⏳ |

## 📋 Os 18 efeitos da onda 4a

| Nível | Efeito | Disponível pra | Observação chave |
|:-:|---|---|---|
| 1 | **Canhão** | Todos | Efeito básico, gratuito ao comprar o poder. 2 dano × nível usado |
| 2 | **Orbe** | Todos | Projétil esférico 0,5m, dano comum |
| 2 | **Criar Arma** | Ninpou, Doton, Suiton, Hyouton, Mokuton | Cria armas com elemento |
| 2 | **Energizar** | Todos | Energiza punho/arma. Permite trocar For/Des por Esp |
| 2 | **Raio** | Todos | Não pode ser bloqueado por arma comum. 2 dano × nível |
| 2 | **Restringente** | Ninpou, Doton, Suiton, Hyouton, Mokuton | Camada grudenta no chão; vítimas ficam lentas |
| 3 | **Flechas** | Todos | Múltiplos projéteis, 2 dano cada, 1 por nível usado |
| 3 | **Ricochete** | Todos | Salta entre alvos até alguém defender |
| 3 | **Barreira** | Ninpou, Doton, Fuuton, Suiton, Hyouton, Mokuton | Defesa reativa, LM+2 |
| 3 | **Lança** | Ninpou, Doton, Suiton, Hyouton, Mokuton | Atravessa proteções (-2 dureza, -3 no Guia Avançado) |
| 3 | **Sopro Destrutivo** | Todos | Cone, dano comum |
| 4 | **Coluna** | Todos | Cilindro vertical, 2 dano × nível |
| 4 | **Nuvem** | Ninpou, Doton, Fuuton, Suiton, Hyouton, Mokuton | Nuvem corrosiva, lentas + dano fixo |
| 5 | **Míssil** | Todos | Linha, reroll de ataque pra dano extra |
| 5 | **Onda Explosiva** | Todos | Meia-esfera, empurra vítimas |
| 5 | **Correnteza** | Ninpou, Doton, Fuuton, Suiton, Hyouton, Mokuton | Onda que empurra; colisão = +1 dano |
| 6 | **Algemar** | Ninpou, Doton, Suiton, Hyouton, Mokuton | Vítima impedida; duração concentração |
| 9 | **Meteoros** | Katon, Raiton | 6 meteoros, 1 dano fixo × nível por meteoro |

## 🔑 Pontos importantes

### 1. Campo `availableFor` é a fonte da verdade

Lista quais poderes podem comprar cada efeito. Motor deve validar:
- Não permite que usuário de Fuuton compre **Criar Arma** (Fuuton não está em `availableFor`)
- Não permite que usuário de Raiton compre **Algemar** (Raiton não está em `availableFor`)

KGs elementais (Hyouton, Mokuton) estão incluídas com base nas regras "todos os efeitos de Ninpou" descritas em suas próprias entradas.

### 2. Restrições adicionais por elemento (sutis)

Alguns efeitos têm versão restrita por elemento — o motor precisa usar a interseção:
- **Criar Arma**: imaterial (Fuuton/Raiton) não pode criar — só Ninpou/Doton/Suiton/Hyouton/Mokuton
- **Algemar**: imaterial (Fuuton/Katon/Raiton) não pode prender — só Ninpou/Doton/Suiton/Hyouton/Mokuton
- **Lança**: precisa de material rígido — só Ninpou/Doton/Suiton/Hyouton/Mokuton
- **Nuvem/Barreira**: Katon/Raiton ficam de fora (fogo/raio não formam nuvem prolongada nem barreira sólida)
- **Correnteza/Restringente**: Katon/Raiton ficam de fora

### 3. Evoluções não podem ser puladas

Regra crítica do livro: se quer Raio Nv 8, precisa ter escolhido Raio Nv 5 antes. Motor deve validar isso ao comprar evoluções.

### 4. Bônus de elemento

Cada elemento aplica seu próprio bônus de dano (Katon e Fuuton: +2; Hyouton: +0 mas +1 Dif resistência etc.) sobre o dano do efeito. Isso **já está modelado nos poderes (lote 3)** — não duplicar no efeito.

### 5. Meteoros é exceção

Único efeito da lista não-universal (só Katon e Raiton). Coloquei aqui mesmo porque sua mecânica segue o padrão dos universais. As **variantes Meteoros pra outros elementos** (ex: Yonbi Youton tem Vulcão que segue regras de Meteoros) vão nas ondas 4c/4d/4e.

## 📋 Shape do `PowerEffect`

```typescript
type PowerEffect = {
  code: string;                  // único, ex: "canhao", "sopro_destrutivo"
  name: string;
  minLevel: number;              // nível mínimo de poder pra comprar
  availableFor: string[];        // códigos dos poderes que podem comprar
  shortDescription: string;
  description: string;
  stats: PowerEffectStats;       // JSONB
  rules?: Record<string, any>;   // JSONB livre
  evolutions: PowerEffectEvolution[];
};

type PowerEffectStats = {
  action: 'LIVRE' | 'MOVIMENTO' | 'PARCIAL' | 'PADRAO' | 'COMPLETA' | 'CONCENTRACAO';
  range: string;                 // 'comum_do_poder', 'pessoal', 'toque', etc.
  target?: string;               // 'uma_criatura', 'uma_ou_mais_criaturas'
  areaOfEffect?: string;         // 'cone', 'cilindro', 'circulo', 'onda', etc.
  damage: string;                // texto livre descritivo
  damageFormula?: string;        // pra cálculo automático no motor
  duration: 'INSTANTANEA' | 'CONTINUA' | 'SUSTENTADA' | 'PERMANENTE' | 'CONCENTRACAO' | 'VER_DESCRICAO' | 'SUSTENTADA_OU_PERMANENTE';
  rollType?: 'CC' | 'CD' | 'LM' | 'sem_teste' | string;
  rollBonus?: number;
  chakraCost: string;            // geralmente "nivel_usado"
  selos?: boolean;
  type?: 'projetil' | 'ataque_em_area' | 'suporte' | 'toque' | 'cc';
};

type PowerEffectEvolution = {
  atLevel: number;               // ex: 6, 9
  name: string;                  // ex: "Barreira Nv 6"
  description: string;
};
```

## 🚨 AÇÕES REQUERIDAS no schema

Verifique se a tabela `PowerEffect` (ou `Effect`) no schema atual tem os campos acima. Se não existir, criar:

```prisma
model PowerEffect {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String
  minLevel        Int      @map("min_level")
  availableFor    String[] @map("available_for")
  shortDescription String  @map("short_description")
  description     String   @db.Text
  stats           Json
  rules           Json?
  evolutions      Json     // array de PowerEffectEvolution

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("power_effects")
}
```

Se schema não tem essa tabela, criar com:
```bash
pnpm prisma migrate dev --name add_power_effects_table
```

### Relação Character ↔ Effects

Quando um personagem compra um poder de nível N, ele escolhe N efeitos (1 por nível, do nível 1 ao N), respeitando `minLevel` e evoluções. **Modelar como tabela de junção** `CharacterPowerEffect`:

```prisma
model CharacterPowerEffect {
  characterId    String   @map("character_id")
  powerCode      String   @map("power_code")
  effectCode     String   @map("effect_code")
  chosenAtLevel  Int      @map("chosen_at_level")    // nível do poder quando escolheu
  evolutionLevel Int?     @map("evolution_level")    // se é evolução escolhida posteriormente

  character Character @relation(fields: [characterId], references: [id])

  @@id([characterId, powerCode, effectCode, evolutionLevel])
  @@map("character_power_effects")
}
```

## 🔧 Padrão de seed

```typescript
async function seedPowerEffects() {
  // Carregar TODOS os JSONs de efeitos (4a, 4b, 4c, 4d, 4e quando chegarem)
  const files = [
    'effects-ninpou-universal.json',
    // 4b, 4c, 4d, 4e adicionados conforme chegam
  ];

  let total = 0;
  for (const file of files) {
    const effects = loadSeedFile(file);
    for (const e of effects) {
      await prisma.powerEffect.upsert({
        where: { code: e.code },
        create: e,
        update: e,
      });
    }
    total += effects.length;
  }
  console.log(`✓ ${total} efeitos de poder`);
}

async function main() {
  // Ordem atualizada: vilas → KGs → clãs → poderes → EFEITOS → perícias
  await seedVillages();
  await seedKekkeiGenkais();
  await seedClans();
  await seedPowers();
  await seedPowerEffects();   // ← novo
  await seedPericias();
}
```

## ✅ Validação pós-seed

Depois de `pnpm prisma db seed`:

1. `pnpm prisma studio`
2. Tabela `power_effects` tem 18 linhas (mais quando 4b-e chegarem)
3. Verifique:
   - **Canhão**: `minLevel: 1`, `availableFor: ["ninpou", "doton", "fuuton", "katon", "raiton", "suiton", "hyouton", "mokuton"]`
   - **Criar Arma**: NÃO inclui Fuuton, Katon, Raiton em `availableFor`
   - **Barreira**: `stats.rollType: "LM"`, `stats.rollBonus: 2`
   - **Meteoros**: `availableFor: ["katon", "raiton"]` (exceção, só esses dois)
   - **Raio**: tem 2 evoluções (Nv 5 e Nv 8)
   - **Algemar**: tem 2 evoluções (Nv 8 e Nv 10)

## ⛔ Limites desta sessão

- **NÃO criar** validações no motor de regras pra restringir compra de efeitos por poder ainda — virá numa sessão dedicada após todas as ondas chegarem
- **NÃO criar** UI de seleção de efeitos durante criação de personagem — outra sessão
- **NÃO toque** em poderes (lote 3) — só leitura

---

# 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── schema.prisma                   ← talvez precise add tabela PowerEffect
│   ├── seed.ts                         ← atualizado: + seedPowerEffects()
│   ├── migrations/
│   │   ├── (migrations anteriores)
│   │   └── 20260512XXXXXX_add_power_effects_table/    ← NOVA (se necessário)
│   └── seed-data/
│       ├── attributes.json
│       ├── clans.json
│       ├── combat-skills.json
│       ├── kekkei-genkais.json
│       ├── pericias.json
│       ├── powers.json
│       ├── villages.json
│       └── effects-ninpou-universal.json    ← NOVO (lote 4a)
```

---

# 🛠️ Comandos manuais seus (passo a passo)

```bash
# Na raiz do projeto
cd ~/projects/arcana-forge

# 1. Confirma que lotes 1, 2 e 3 estão aplicados sem erros
pnpm prisma studio &
# Verifica: villages (5), clans (16-17), kekkei_genkais (5), powers (19)
# Fecha o studio (Ctrl+C)

# 2. Descompacta o lote 4a em pasta temporária
unzip ~/Downloads/seed-data-lote-4a.zip -d /tmp/

# 3. Copia APENAS o JSON pra prisma/seed-data/
cp /tmp/seed-data-lote-4a/effects-ninpou-universal.json prisma/seed-data/

# 4. (opcional) Mantém o README pra referência durante o trabalho do Claude Code
cp /tmp/seed-data-lote-4a/README.md /tmp/lote-4a-README.md

# 5. Confirma que o arquivo está no lugar
ls prisma/seed-data/
# Esperado: attributes.json clans.json combat-skills.json
#           effects-ninpou-universal.json (NOVO)
#           kekkei-genkais.json pericias.json powers.json villages.json
```

---

# 💬 Prompt pro Claude Code

```
# Aplicar Lote 4a do Seed: Efeitos Universais de Ninpou

Onda 4a do Lote 4 (Efeitos) pronta em `prisma/seed-data/effects-ninpou-universal.json`. Vamos aplicar ao banco.

## Arquivos novos

- `prisma/seed-data/effects-ninpou-universal.json` — 18 efeitos universais (Canhão, Orbe, Raio, Barreira, Sopro Destrutivo, Meteoros, etc.)

## Antes de codar

1. **Leia `/tmp/lote-4a-README.md`** — explica:
   - Shape do `PowerEffect` (campos `stats`, `rules`, `evolutions` em JSONB)
   - Regras críticas: `availableFor` é fonte da verdade, evoluções não podem ser puladas
   - Migration necessária pra criar tabela `PowerEffect` se não existir
   - Modelo de junção `CharacterPowerEffect` sugerido pro futuro

2. **Verifique o schema atual**:
   - Existe tabela `PowerEffect` (ou `Effect`)?
   - Se não, criar conforme shape do README
   - Se existe, conferir se tem os campos esperados (code, minLevel, availableFor, stats Json, rules Json, evolutions Json)

3. **Não invente shape diferente** — siga exatamente o README. Os campos JSONB são propositais (variam por efeito).

## Tarefas

1. Criar tabela `PowerEffect` no schema se não existir
2. Migration: `pnpm prisma migrate dev --name add_power_effects_table`
3. Adicionar função `seedPowerEffects()` em `prisma/seed.ts` (carrega `effects-ninpou-universal.json` por enquanto, com previsão de carregar outros arquivos `effects-*.json` futuros)
4. Atualizar `main()`: ordem villages → kekkeiGenkais → clans → powers → **powerEffects** → pericias
5. Rodar `pnpm prisma db seed`
6. Validar no Prisma Studio conforme checklist no README:
   - 18 efeitos no banco
   - Canhão: `minLevel: 1`, availableFor com todos os elementos
   - Criar Arma: availableFor SEM Fuuton/Katon/Raiton
   - Meteoros: availableFor apenas com `katon` e `raiton`
   - Raio tem 2 evoluções

## ⛔ Limites

- **NÃO criar** validações no motor de regras ainda
- **NÃO criar** UI nem tabela `CharacterPowerEffect` ainda (só sugerida no README pro futuro)
- **NÃO toque** em outros JSONs do seed
- **NÃO faça** `git push`

## Após aplicar

Documente no `SESSION-LOG.md`:
- Resumo do que foi feito
- Schema mudou? Migration aplicada?
- 18 efeitos validados no Studio?
- Próximo passo: aguardando ondas 4b, 4c, 4d, 4e
```
