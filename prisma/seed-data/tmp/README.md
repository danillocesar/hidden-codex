# Seed Data — Lote 5a (Aptidões Comuns + Combate)

Primeiro lote da fase 5 (Aptidões). Cobre as ~50 aptidões mais usadas — comuns, de habilidade, de combate básico, manobras básicas, e gerais (Ninja Médico, Químico, Engenheiro, etc.). **Não inclui restritas de clã** (Lote 5b), **manobras avançadas** (5c) nem **meta-aptidões de poder** (5d).

## 📦 Conteúdo

| Arquivo | Aptidões |
|---|:---:|
| `aptitudes-common-combat.json` | **51** |

## 🎯 Categorias

| Categoria | Quantidade | Exemplos |
|---|:---:|---|
| **HABILIDADE** | 12 | Acuidade, Ataque em Movimento, De Pé, Diligente, Especialista, Intuição, Maestria, Perito, Perícia Inata, Reflexos, Rolamento, Velocista |
| **COMBATE** | 22 | Ambidestria, Atirador, Bloqueio Ambidestro, Combate Defensivo, Crítico Aprimorado, Dano Extra, Esquiva de Risco, Guerreiro, Lutador, Lutar às Cegas, Mestre dos Selos, Mira Apurada, Mobilidade, Oportunista, Ponto Cego, Punho de Ferro, Retirada Rápida, Saque Rápido, Tiro Longo, Tiro Preciso, Trespassar, Usar Armaduras Pesadas |
| **MANOBRA** | 7 | Apanhar Objetos, Arremessar, Ataque Atordoante, Ataque Giratório, Ataque Múltiplo, Ataque Poderoso, Ataque Progressivo |
| **GERAL** | 10 | Auxiliador Especialista, Avaliador do Perigo, Corpo Esguio, Duro de Matar, Engenheiro, Ninja Médico, Químico, Resistência Maior, Sensor, Usar Arma |

## 🔑 Decisões importantes

### 1. Schema JSONB amorfo (como combinado)

Cada aptidão tem `effects` em JSONB com campo `type` que classifica a mecânica. Tipos usados:

- `precision_bonus` — +X em testes (Especialista, Perito, Intuição, Maestria, Mira Apurada)
- `skill_bonus` — bônus em perícia específica (Bloqueio Ambidestro, Diligente)
- `damage_bonus` — +dano em ataques (Atirador, Dano Extra, Ataque Poderoso)
- `manuever` — manobra nova/modificada (Ataque Atordoante, Ataque Giratório, Ataque Múltiplo)
- `manuever_permission` — remove penalidade de manobras (Lutador, Guerreiro)
- `manuever_modifier` — modifica manobra existente (Arremessar modifica derrubar; Ataque Progressivo modifica Múltiplo)
- `movement_modifier` — afeta deslocamento (Velocista, Ataque em Movimento, Retirada Rápida)
- `action_economy` — muda tipo de ação (De Pé, Ponto Cego, Saque Rápido)
- `esquiva_bonus` — bônus em Esquiva (Reflexos, Mobilidade, Esquiva de Risco)
- `critical_range_modifier` — afeta crítico (Crítico Aprimorado)
- `stat_substitution` — troca atributo no teste (Acuidade)
- `permission` — desbloqueia capability (Ninja Médico, Químico, Engenheiro)
- `reroll` — re-rolagem (Perícia Inata, Diligente, Resistência Maior)
- `death_saving_throw` — escape da morte (Duro de Matar)
- `weapon_proficiency` — proficiência em arma (Usar Arma)
- `armor_proficiency` — proficiência em armadura (Usar Armaduras Pesadas)
- `dual_wielding` — duas armas (Ambidestria)
- `sensor` — habilidade sensora (Sensor)
- `extra_attack_on_kill` — ataque extra ao matar (Trespassar)
- `opportunity_attack` — modifica ataques oportunos (Oportunista)
- `range_modifier` — dobra alcance (Tiro Longo)
- `aim_bonus` — bônus de mira (Mira Apurada)
- `ignore_cover` — ignora cobertura (Tiro Preciso)
- `fall_damage_reduction` — reduz dano de queda (Rolamento)
- `defensive_reaction` — nova reação defensiva (Esquiva de Risco)
- `escape_bonus` — escapar de amarras (Corpo Esguio)
- `blind_combat` — combate cego (Lutar às Cegas)
- `combat_modifier` — modificador geral (Combate Defensivo)
- `skill_grants` — concede aptidões em perícia (Mestre dos Selos)
- `unarmed_weapon_damage` — dano de arma desarmado (Punho de Ferro)
- `ally_support` — apoio a aliados (Auxiliador Especialista)

**Motor de regra futuro vai precisar entender esses tipos.** Está documentado em `effects.type` exatamente pra isso.

### 2. Acuidade modelada com RAW estrito (como combinado)

Conforme decisão crítica #1 do projeto: **Acuidade NÃO afeta dano de CC**. Modelei `stat_substitution.substituteAttribute: "destreza_for_forca"` mas com a nota explícita no `notes`: "RAW estrito — não dá dano de Destreza em ataque CC desarmado, só substitui pra arma compatível".

### 3. Evoluções de Nv 2 (entrada única + array)

Conforme combinado, modelei como array `evolutions` na própria entrada base:

- **Diligente** → Diligente Nv 2 (Iniciativa 21, fintado em primeira rodada, etc.)
- **Lutar às Cegas** → Nv 2 (Pron 12, sem contato visual)
- **Tiro Preciso** → Nv 2 (Des 13, ignora camuflagem total)
- **Trespassar** → Nv 2 (CC 9, quantas vezes quiser por rodada)

Cada evolução tem `prerequisites` próprio.

### 4. Revisões do GAS embutidas (não duplicadas)

Onde o Guia Avançado revisa uma aptidão existente, embuti as melhorias num campo `gasReview` dentro de `effects`, em vez de criar entrada duplicada. Exemplos:

- **Mobilidade**: GAS adiciona +2 Cambalhota
- **Retirada Rápida**: GAS adiciona +10m 1x/cena
- **Saque Rápido**: GAS adiciona Recarga Rápida de Pólvora
- **Tiro Longo**: GAS reduz pré-req pra Des 11 + afeta arremesso
- **Usar Arma**: GAS permite upgrade grátis em For/Des 10+12

Motor pode optar por aplicar `gasReview` baseado em flag global do banco ou da campanha.

### 5. Pré-requisitos cruzados catalogados (não validados)

Aptidões com pré-req em outras aptidões:

- **Crítico Aprimorado** → Especialista
- **Ataque Progressivo** → Ataque Múltiplo
- **Mestre dos Selos** → Ponto Cego (+ Prestidigitação 12)
- **Mira Apurada** → Tiro Longo (+ Des 12)
- **Bloqueio Ambidestro** → Ambidestria
- **Mobilidade** → Reflexos (+ Agi 3)
- **Esquiva de Risco** → Reflexos (+ Esquiva 11)
- **Arremessar** → Lutador OU Guerreiro (+ For 6)

Tudo registrado em `prerequisites.aptitudes` ou `prerequisites.aptitudes_one_of`. **Não validei em runtime** — fica pro motor futuro.

## ⚠️ O que NÃO entrou (transparência)

### 1. Aptidões restritas de clã — vão no **Lote 5b**

Não modelei:
- **Byakugan, Tenketsu Byakugan** (Hyuuga)
- **Sharingan, Mangekyou** (Uchiha)
- **Corpulência, Resiliência** (Akimichi)
- **Kikaichuu, Shōkaichuu, Kidaichuu, Rinkaichuu** (Aburame)
- **Companheiro Animal, Hakken no Jutsu** (Inuzuka)
- **Predador Aquático, Elemento Natural Suiton, Reserva de Água** (Hoshigaki)
- **Suika, Imunidade Fluida** (Hozuki)
- **Shikotsumyaku, Artesão de Ossos** (Kaguya)
- **Chakra Expandido** (Uzumaki)
- **Demônio do Vento** (Fuuma)
- **Tensai** + suas escolhas (genialidade)
- **Senjutsu** aptitudes (Sennin Modo)
- **Senninka** (Selo Amaldiçoado)
- **Shikigami no Mai** (Kamijutsu)
- **Armadura de Raios** (Nintaijutsu)
- **Espadachim, Sabre Samurai, Iaido, Yojinbo, Issen, Hadan** (Samurai)
- **Tendō / Caminho Deva** (Rinnegan)
- **Estilo Zui Quan, Imobilização, Instância de Falange** (raras do GAS)

### 2. Aptidões de manobra avançadas — vão no **Lote 5c**

Não modelei:
- Bloquear Arma, Contragolpe
- Chute Duplo, Chute Giratório, Chute Inverso
- Derrubar Agressivo, Desarme Agressivo, Rasteira
- Golpe Atemi, Golpe Caratê, Seguir Sombra
- Soco Agarrado, Soco em Gancho, Voadora
- Agarrar Agressivo (GAS)
- Roubar, Henge Perfeito, Furtividade Ágil, Burro de Carga (GAS)

### 3. Meta-aptidões de técnica — vão no **Lote 5d**

Não modelei:
- Maximizar, Potencializar, Técnica Poderosa, Técnica Acelerada, Técnica Eficiente, Técnica Elevada
- Domínio da Água/Fogo/Raio/Terra/Vento/Ninpou
- Ilusão Profunda, Ilusão Fluida
- Clone (Bunshin, Kage Bunshin, Mizu Bunshin, Doro Bunshin, Tsuchi Bunshin, etc. — pode virar lote próprio)
- Fascinar, Miragem (pré-reqs de Magen)

### 4. Aptidões "duplicadas" ou "mencionadas só em listas"

Aptidões que aparecem listadas em criaturas/invocações do GAS mas sem entrada própria detalhada (Estilo Zui Quan, Henge Perfeito, Burro de Carga, Furtividade Ágil) — modelei só **Auxiliador Especialista** como exemplo, com `notes: "consultar regra completa GAS"`. As outras seguem mesmo padrão e ficam pro 5c.

## ✅ Validação pós-seed

Total no banco depois do 5a: **51 aptidões**.

Verifique:
- `acuidade` tem `effects.notes` com "RAW estrito"
- `diligente`, `lutar_as_cegas`, `tiro_preciso`, `trespassar` têm cada um exatamente 1 evolução no array
- `critico_aprimorado` tem pré-req `aptitudes: ["especialista"]`
- `arremessar` tem `prerequisites.aptitudes_one_of: ["lutador", "guerreiro_pesadas"]`
- `mobilidade.effects.gasReview.cambalhotaBonus` = 2

## 🔧 Padrão de seed atualizado

```typescript
async function seedAptitudes() {
  const files = [
    'aptitudes-common-combat.json',  // 5a
    // 5b: aptitudes-clan-restricted.json (vem depois)
    // 5c: aptitudes-manuevers.json
    // 5d: aptitudes-meta.json
  ];
  // resto igual aos lotes anteriores: ler, validar, upsert por code
}
```

---

# 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── seed.ts                                  ← adicionar seedAptitudes()
│   ├── seed-data/
│   │   ├── (anteriores)
│   │   └── aptitudes-common-combat.json         ← NOVO (5a)
```

---

# 🛠️ Comandos manuais seus

```bash
cd ~/projects/arcana-forge

# 1. Confirma lotes 1-4f aplicados
pnpm tsx scripts/validate-seed-data.ts
# Esperado: PASSED

# 2. Descompacta lote 5a
unzip ~/Downloads/seed-data-lote-5a.zip -d /tmp/

# 3. Copia o JSON novo
cp /tmp/seed-data-lote-5a/aptitudes-common-combat.json prisma/seed-data/

# 4. Guarda README
cp /tmp/seed-data-lote-5a/README.md /tmp/lote-5a-README.md

# 5. Confere
ls prisma/seed-data/aptitudes-*.json
```

---

# 💬 Prompt pro Claude Code

```
# Aplicar Lote 5a do Seed: Aptidões Comuns + Combate (51 aptidões)

Primeiro lote da fase 5 (Aptidões). 1 arquivo JSON novo, 51 aptidões.

## Arquivos novos

- `prisma/seed-data/aptitudes-common-combat.json` — 51 aptidões em 4 categorias (HABILIDADE, COMBATE, MANOBRA, GERAL)

## Antes de codar

1. **Leia `/tmp/lote-5a-README.md`** — pontos importantes:
   - Schema da tabela `Aptitude` provavelmente NÃO existe ainda. Verifica em `prisma/schema.prisma`. Se não existir, criar via migration.
   - Acuidade modelada com RAW estrito (decisão crítica #1)
   - Evoluções de Nv 2 são array dentro da entrada base (não entradas separadas)
   - Revisões do GAS embutidas em `effects.gasReview` (não duplicadas)
   - 51 aptidões totais — categorias: 12 HABILIDADE + 22 COMBATE + 7 MANOBRA + 10 GERAL

2. **Verifica schema atual:**
   ```bash
   grep -A 20 "model Aptitude" prisma/schema.prisma
   ```
   Se não existir o model, ele precisa ser criado.

3. **Schema mínimo sugerido:**

```prisma
model Aptitude {
  id            String   @id @default(cuid())
  code          String   @unique
  name          String
  category      AptitudeCategory
  shortDescription String?
  description   String   @db.Text
  prerequisites Json?    // JSONB amorfo
  effects       Json     // JSONB amorfo com .type discriminador
  evolutions    Json     // array de evoluções Nv 2+
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("aptitudes")
}

enum AptitudeCategory {
  HABILIDADE
  COMBATE
  MANOBRA
  GERAL
  RESTRITA  // pra Lote 5b futuro
  META      // pra Lote 5d futuro
}
```

## Tarefas

### 1. Criar migration (se schema novo)

```bash
pnpm prisma migrate dev --name add_aptitudes
```

### 2. Adicionar seedAptitudes() ao prisma/seed.ts

```typescript
async function seedAptitudes() {
  const filePath = path.join(__dirname, 'seed-data', 'aptitudes-common-combat.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  for (const aptitude of data.data) {
    await prisma.aptitude.upsert({
      where: { code: aptitude.code },
      create: {
        code: aptitude.code,
        name: aptitude.name,
        category: aptitude.category,
        shortDescription: aptitude.shortDescription,
        description: aptitude.description,
        prerequisites: aptitude.prerequisites ?? {},
        effects: aptitude.effects,
        evolutions: aptitude.evolutions ?? [],
      },
      update: {
        name: aptitude.name,
        category: aptitude.category,
        shortDescription: aptitude.shortDescription,
        description: aptitude.description,
        prerequisites: aptitude.prerequisites ?? {},
        effects: aptitude.effects,
        evolutions: aptitude.evolutions ?? [],
      },
    });
  }
  
  console.log(`✓ Seeded ${data.data.length} aptitudes`);
}
```

Chame em `main()` depois de `seedPowerEffects()`.

### 3. Validar antes de seedar

```bash
pnpm tsx scripts/validate-seed-data.ts
```

### 4. Atualizar validador para incluir aptidões

No `scripts/validate-seed-data.ts`, adicione no `buildIndices` o tratamento pra arquivos `aptitudes-*.json` análogo aos `effects-*.json`:
- Detecta tipo via filename
- Indexa codes
- Valida `prerequisites.aptitudes` referenciam codes existentes

### 5. Rodar seed

```bash
pnpm prisma db seed
```

### 6. Verificar no Prisma Studio

- Tabela `aptitudes` deve ter **52 linhas**
- `acuidade` deve ter `effects.notes` com "RAW estrito"
- `diligente.evolutions` deve ser array com 1 elemento
- `critico_aprimorado.prerequisites.aptitudes` deve ser `["especialista"]`

### 7. Teste mínimo

Crie `tests/seed/aptitudes.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Seed: Aptidões Lote 5a', () => {
  it('tem 51 aptidões no banco', async () => {
    const count = await prisma.aptitude.count();
    expect(count).toBeGreaterThanOrEqual(51);
  });

  it('Acuidade está com RAW estrito', async () => {
    const acuidade = await prisma.aptitude.findUnique({ where: { code: 'acuidade' } });
    expect(acuidade?.effects).toMatchObject({
      type: 'stat_substitution',
      substituteAttribute: 'destreza_for_forca'
    });
    expect(acuidade?.effects?.notes).toContain('RAW estrito');
  });

  it('Diligente tem evolução Nv 2', async () => {
    const dil = await prisma.aptitude.findUnique({ where: { code: 'diligente' } });
    expect(dil?.evolutions).toHaveLength(1);
    expect(dil?.evolutions[0]?.atLevel).toBe(2);
  });

  it('Crítico Aprimorado requer Especialista', async () => {
    const ca = await prisma.aptitude.findUnique({ where: { code: 'critico_aprimorado' } });
    expect(ca?.prerequisites?.aptitudes).toContain('especialista');
  });

  it('distribuição por categoria', async () => {
    const habilidade = await prisma.aptitude.count({ where: { category: 'HABILIDADE' } });
    const combate = await prisma.aptitude.count({ where: { category: 'COMBATE' } });
    const manobra = await prisma.aptitude.count({ where: { category: 'MANOBRA' } });
    const geral = await prisma.aptitude.count({ where: { category: 'GERAL' } });
    
    expect(habilidade).toBe(12);
    expect(combate).toBe(22);
    expect(manobra).toBe(7);
    expect(geral).toBe(10);
  });
});
```

## ⛔ Limites

- **NÃO modele** aptidões restritas de clã (Byakugan, Sharingan, Corpulência, etc.) — Lote 5b
- **NÃO modele** manobras avançadas (Derrubar Agressivo, Chute Giratório, etc.) — Lote 5c
- **NÃO modele** meta-aptidões (Maximizar, Potencializar, Técnica Poderosa) — Lote 5d
- **NÃO valide** pré-requisitos cruzados em runtime — fica pro motor
- **NÃO crie** UI de ficha ainda
- **NÃO faça** `git push`

## Após aplicar

Documente no `SESSION-LOG.md`:

```markdown
## Lote 5a (Aptidões Comuns + Combate) — APLICADO

- 51 aptidões adicionadas (12 HABILIDADE + 22 COMBATE + 7 MANOBRA + 10 GERAL)
- Schema novo: tabela `Aptitude` + enum `AptitudeCategory`
- Migration: `add_aptitudes`
- Validador estendido pra arquivos `aptitudes-*.json`
- Decisões críticas respeitadas:
  - Acuidade RAW estrito (não afeta dano CC desarmado)
  - Evoluções Nv 2 como array (não entradas separadas)
  - Revisões GAS embutidas em effects.gasReview
- Pré-requisitos cruzados catalogados mas NÃO validados em runtime
- Próximo passo: Lote 5b (Aptidões Restritas de Clã ~30)
```

Rode `pnpm typecheck && pnpm lint && pnpm test && pnpm seed:validate` antes de fechar.
```
