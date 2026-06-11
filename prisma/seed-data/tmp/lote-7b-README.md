# Lote 7b — Powers Órfãos (promove 7 refs dormentes a powers reais)

Segundo lote da Fase 7. Não corrige bug ativo — **promove dívida técnica documentada a catálogo real**, eliminando 36 refs `info` que estavam dormentes em `_meta.unmodeledPowers` de effects existentes.

## 📦 Conteúdo (1 arquivo, 7 powers)

`powers-orphans.json` — 7 powers categorizados como HIJUTSU/KEKKEI_GENKAI

| Code | Categoria | Usos pré-7b | Fonte |
|---|---|---:|---|
| `hachimon_tonkou` | HIJUTSU | 15 | Livro Básico p. 202-207 |
| `jiton` | KEKKEI_GENKAI | 7 | Livro de Hijutsus p. 53-55 |
| `sabaku_hijutsu` | HIJUTSU | 6 | Livro de Hijutsus p. 30-31 |
| `yonbi_youton` | HIJUTSU | 3 | Livro de Hijutsus p. 38-39 |
| `sanbi_suiton` | HIJUTSU | 2 | Livro de Hijutsus p. 37-38 |
| `senjutsu` | HIJUTSU | 2 | Livro Básico p. 239-241 |
| `aoi_katon` | HIJUTSU | 1 | Livro de Hijutsus p. 33-34 |

## ⚠️ Pontos importantes — desafios da auditoria

### 1. NÃO é correção de bug

Seeder atual roda sem reclamar (FK de `availableFor` é lógica, não Prisma). Validador atual passa (escape hatch `unmodeledPowers`). Esse lote elimina dívida técnica documentada — **importante mas não bloqueante**.

### 2. Code colisões entre tabelas

- **`senjutsu`** já existia como Aptitude (aptitudes-clan-restricted.json:813, type `hijutsu_unlock`). Agora também existe como Power. Tabelas distintas → codes podem coexistir. Mesmo padrão de `hyouton`/`mokuton` (KG + Power) e `sharingan` (KG + Aptitude). Motor já lida.
- **`jiton`** estava em effects (effects-jiton.json + effects-guia-avancado.json). Agora vira Power real — refs deixam de ser dormentes.
- **`shikotsumyaku`** seguiu o mesmo padrão (KG + Aptitude). Senjutsu não é exceção.

### 3. Nova ref dormente introduzida deliberadamente: `jinchuuriki`

Os 4 Bijuu Hijutsus (sabaku_hijutsu, aoi_katon, sanbi_suiton, yonbi_youton) têm `prerequisites.powers.jinchuuriki: 1`. O power-pai `jinchuuriki` ainda **NÃO está catalogado** — será modelado num lote futuro (Hijutsu de Bijuu). Declarado em `_meta.unmodeledPowers: ["jinchuuriki"]` deste mesmo lote para o validador demover refs `error` → `info` automaticamente.

**Net effect no validador:**
- 36 refs `info` antigas eliminadas (7 powers agora existem)
- 4 refs `info` novas introduzidas (todas apontando pra `jinchuuriki`)
- **Saldo: -32 refs `info`** + ganho de catálogo real

### 4. Distinções críticas que o livro faz

- **`yonbi_youton` ≠ `youton_mei`**: o primeiro é variante Bijuu (Roushi/Son Goku); o segundo é KG do clã Terumi (Mei Mizukage, em `powers-additional.json`). Mecânica diferente. Códigos distintos pra evitar conflito.
- **`sabaku_hijutsu` ≠ "sabaku"**: o code é `sabaku_hijutsu` (com sufixo) porque é o nome literal usado nos effects existentes. Não criei `sabaku` solto.
- **`sanbi_suiton`, `aoi_katon`** são variantes Bijuu de Suiton/Katon comuns — código separado porque o nível é distribuído via Jinchuuriki e tem efeitos exclusivos (Sangoshō, Espelho D'Água, Nekozume).

### 5. `aoi_katon` marcado `needsDeepResearch`

O Livro de Hijutsus tem descrição mais enxuta de Aoi Katon que dos outros Bijuus. Modelei com regras inferidas (variação de Katon, segue parâmetros do Ninpou, chamas azuis = densidade maior, +2 dano de elemento). **Confirmar com o livro se há regras específicas que não capturei** — provavelmente está OK porque o livro trata Aoi Katon como Katon com cor diferente.

### 6. Categoria HIJUTSU funciona

O enum Prisma `PowerCategory` aceita HIJUTSU desde a migration `20260512190308_add_hijutsu_power_category`. A interface `PowerSeed` em `prisma/seed.ts:173` lista só 4 categorias — mas o cast `category: p.category` aceita HIJUTSU porque o Prisma valida no enum, não no TS. Recomendo atualizar a interface no seed.ts num polish futuro, mas não bloqueia o seed.

## ✅ Validação pós-seed

```sql
-- Powers: 32 antes → 39 depois
SELECT COUNT(*) FROM powers;

-- Verificar os 7 novos
SELECT code, name, category, element FROM powers
WHERE code IN ('hachimon_tonkou', 'jiton', 'sabaku_hijutsu',
               'yonbi_youton', 'sanbi_suiton', 'senjutsu', 'aoi_katon')
ORDER BY code;

-- Verificar code 'senjutsu' coexiste em powers + aptitudes
SELECT 'aptitude' as table_name, code, name FROM aptitudes WHERE code = 'senjutsu'
UNION ALL
SELECT 'power' as table_name, code, name FROM powers WHERE code = 'senjutsu';
```

Pontos a conferir no Prisma Studio:

- **hachimon_tonkou**: `rules.ataquePesado.availableFromLevel: 2`, `rules.fatigueAfterUse.thirdConsecutiveInScene: "exausto_1_dia"`
- **jiton**: `category: KEKKEI_GENKAI`, `rules.variantChoiceRequired: ["satetsu", "sakin"]`, `rules.isVariantOf: "sabaku_hijutsu"`
- **sabaku_hijutsu**: `stats.additionalHardness: 2`, `rules.elementAdvantage: ["katon"]`, `rules.allowedEffects` inclui `imergir` e `colisao_de_ondas`
- **yonbi_youton**: `stats.rangeFormula.category: "Longo"` (15m+3m/Esp — diferente dos outros que são Médio), `stats.elementBonus: 2`
- **sanbi_suiton**: `rules.isVariantOf: "suiton"`, `rules.compatibleSuitonAptitudes: ["dominio_da_agua"]`
- **aoi_katon**: `rules.needsDeepResearch: true`, `stats.elementBonus: 2`
- **senjutsu**: `rules.chakraSenjutsuSystem.pointsGrantedFormula`, 9 entries em `rules.bonusList`

**Refs `info` esperadas pós-seed:**
- 4 refs `jinchuuriki` (pré-req dos 4 Bijuu Hijutsus) — declaradas em `_meta.unmodeledPowers` deste arquivo

## 📁 Estrutura

```
arcana-forge/
├── prisma/
│   ├── seed.ts                            ← adicionar 'powers-orphans.json' em POWER_FILES
│   ├── seed-data/
│   │   ├── powers.json                    ← lote 3 (19 entries)
│   │   ├── powers-additional.json         ← lote 4f (13 entries)
│   │   └── powers-orphans.json            ← NOVO 7b (7 entries)
```

---

## 🛠️ Comandos manuais

```bash
cd ~/projects/arcana-forge

# 1. Estado anterior
docker exec -it arcana-forge-db psql -U postgres -d arcana_forge \
  -c "SELECT COUNT(*) FROM powers;"
# Esperado: 32

# 2. JSON já está em prisma/seed-data/powers-orphans.json
ls prisma/seed-data/powers-orphans.json

# 3. Atualizar POWER_FILES em prisma/seed.ts
#    Linha 190-193, adicionar 'powers-orphans.json' depois de powers-additional.json

# 4. Validar antes de aplicar
pnpm tsx scripts/validate-seed-data.ts
# Esperado: 0 errors, X infos (incluindo 4 novas refs jinchuuriki)

# 5. Aplicar
pnpm prisma db seed

# 6. Conferir
docker exec -it arcana-forge-db psql -U postgres -d arcana_forge \
  -c "SELECT COUNT(*) FROM powers;"
# Esperado: 39
```

---

## 💬 Prompt pro Claude Code

```
# Aplicar Lote 7b: Powers Órfãos

Segundo lote da Fase 7. Promove 7 power codes que estavam dormentes (declarados em
_meta.unmodeledPowers de effects existentes) a entries reais na tabela powers.

## Arquivos novos

- `powers-orphans.json` (7 powers):
  - hachimon_tonkou (HIJUTSU, Vigor 6, Taijutsu/Kinjutsu) — Livro Básico p. 202-207
  - jiton (KEKKEI_GENKAI, Fuuton+Doton) — Livro de Hijutsus p. 53-55
  - sabaku_hijutsu (HIJUTSU, Jinchuuriki Ichibi) — Livro de Hijutsus p. 30-31
  - yonbi_youton (HIJUTSU, Jinchuuriki Yonbi, alcance LONGO) — Livro de Hijutsus p. 38-39
  - sanbi_suiton (HIJUTSU, Jinchuuriki Sanbi) — Livro de Hijutsus p. 37-38
  - senjutsu (HIJUTSU, sistema de Chakra Senjutsu) — Livro Básico p. 239-241
  - aoi_katon (HIJUTSU, Jinchuuriki Nibi, needsDeepResearch) — Livro de Hijutsus p. 33-34

## Antes de codar

1. Leia `prisma/seed-data/tmp/lote-7b-README.md` — pontos importantes:
   - Code `senjutsu` AGORA coexiste como Aptitude E Power. OK por design.
   - Code `jiton` é KEKKEI_GENKAI (não HIJUTSU) — livro chama de KG explicitamente.
   - `yonbi_youton` ≠ `youton_mei`: o primeiro é Bijuu, o segundo é Mei Mizukage (já existe).
   - 4 dos 7 powers têm pré-req `jinchuuriki` (power ainda não catalogado).
     Declarei `jinchuuriki` em `_meta.unmodeledPowers` deste arquivo pra demover
     `error` → `info` no validador. Será catalogado em lote futuro.
   - `aoi_katon` tem `rules.needsDeepResearch: true` — descrição enxuta no livro.

2. Schema NÃO muda — sem migration. Enum HIJUTSU já existe na tabela powers
   (migration 20260512190308). Interface PowerSeed em seed.ts lista só 4 categorias
   mas Prisma valida no enum — cast funciona.

## Tarefas

1. Adicionar `'powers-orphans.json'` ao array `POWER_FILES` em `prisma/seed.ts`
   (linha 190-193), DEPOIS de `powers-additional.json`
2. Rodar `pnpm tsx scripts/validate-seed-data.ts` — esperar 0 errors
3. Rodar `pnpm prisma db seed`
4. Validar no Prisma Studio:
   - Tabela `powers` tem 39 linhas (32 + 7)
   - Code 'senjutsu' aparece em DOIS lugares: aptitudes (hijutsu_unlock) e powers (HIJUTSU)
   - hachimon_tonkou: rules.fatigueAfterUse.thirdConsecutiveInScene = "exausto_1_dia"
   - jiton: category = KEKKEI_GENKAI, rules.variantChoiceRequired = ["satetsu", "sakin"]
   - senjutsu: 9 entries em rules.bonusList

## ⛔ Limites

- **NÃO crie** power `jinchuuriki` ainda — vem em lote futuro (Hijutsu de Bijuu)
- **NÃO mexa** em effects-* existentes — as entries em _meta.unmodeledPowers
  daqueles arquivos ficam obsoletas mas inofensivas
- **NÃO renomeie** codes — todos seguem o que JÁ está em uso nos availableFor
- **NÃO faça** `git push`

## Após aplicar

Documente no `SESSION-LOG.md`:
- Total de powers: 39 (32 + 7)
- 36 refs `info` antigas eliminadas, 4 refs `info` novas introduzidas (`jinchuuriki`)
- Saldo líquido: -32 refs `info`
- Code `senjutsu` agora coexiste em 2 tabelas (aptitudes + powers) — motor precisa
  resolver pela tabela esperada do contexto, não só pelo code
- Próximo passo: Lote 7c (Kaguya — 5 Danças + Armadura Óssea)
```
