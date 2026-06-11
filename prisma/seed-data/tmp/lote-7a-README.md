# Lote 7a — Aptidões do Hijutsu Samurai (+ Armadura de Batalha Samurai)

Primeiro lote da Fase 7. Fecha buraco identificado na auditoria de entrada da Fase 7: o Hijutsu Samurai tem 0 aptidões modeladas no banco, apesar do clã/Hijutsu já ser referenciável.

## 📦 Conteúdo (2 arquivos JSON, 9 entries totais)

- `aptitudes-samurai.json` — **8 aptidões** RESTRITAS (hijutsu_samurai)
- `equipment-armor-samurai.json` — **1 equipamento** (Armadura de Batalha Samurai)

## ⚠️ Divergências da narrativa de entrada

Tu disse "6 aptidões Samurai faltando" e listou: Espadachim, Sabre Samurai, Iaido, Iaigiri, Impedir Selos, Aparar Lâmina. **A contagem real é 8** (Livro de Hijutsus p. 75-79):

| # | Aptidão | Estava na tua lista? | Pré-req atributo |
|---|---|---|---|
| 1 | Espadachim (base) | ✓ | — |
| 2 | Sabre Samurai | ✓ | CC 12 |
| 3 | Iaido | ✓ | Des 8 |
| 4 | **Yojinbo** | ❌ esqueceu | Des 10 |
| 5 | **Issen** | ❌ esqueceu | Des 12 + Esp 12 |
| 6 | Impedir Selos | ✓ | Des 12 |
| 7 | Iaigiri | ✓ | Des 14 |
| 8 | Armadura Samurai | ❌ tu marcou como "patcheada no 6i" — não foi | For 10 OU Vig 12 |

**Aparar Lâmina** não é aptidão separada — é sub-técnica de Espadachim com pré-req próprio (Des 10), modelada em `effects.subTechniques` (mesmo padrão de Corte Rápido dentro de Iaido e Mímica Sharingan dentro de Nidan Sharingan).

**Armadura de Batalha Samurai** também estava prometida no _meta do 6e mas nunca foi materializada — o 6i só patcheou `usar_armaduras_pesadas`. Incluí aqui pra fechar tanto a aptidão quanto o equipamento.

## 🔑 Pontos importantes

### 1. Discriminador `hijutsu_samurai`

Diferente de aptidões de clã (que usam `prerequisites.clans`), Samurai é Hijutsu — sem clã específico. Padrão usado: `prerequisites.type: "hijutsu_samurai"`. Mesma decisão de `juuinka_ichi` no 5b (`type: "hijutsu_juuinka"`).

### 2. Restrições do Hijutsu Samurai documentadas no `_meta`

Duas restrições globais que o motor precisa entender:

**`noNinjutsu`**: Samurai não pode comprar poder comum, Aptidões Shinobi, nem usar Bunshin/Henge/Shunshin no Jutsu. Opcionalmente retirável pelo Mestre (regra explícita do livro).

**`noManobras`**: Várias aptidões são incompatíveis com Aptidões de Manobra. Marcadas em `effects.noManobras: true`. Aptidões afetadas: **Yojinbo**, **Issen (Hadan)**, **Iaigiri**, **Corte de Chakra** (sub-técnica do Sabre Samurai). Impedir Selos tem regra mais estreita: não pode ser usada em resposta a técnica defensiva do inimigo que VOCÊ atacou.

### 3. Sub-técnicas modeladas como `effects.subTechniques` (não evolutions)

Mesma decisão tomada no 5b pra Mímica Sharingan dentro de Nidan Sharingan. **Evolutions** são para níveis de progressão da MESMA aptidão (ex: Kikaichuu Nv 2, Espelhos Demoníacos Nv 8). **subTechniques** são técnicas-filha que compartilham pré-req mas têm trigger/ação próprios.

Mapeamento:
- Espadachim → Aparar Lâmina (Des 10)
- Sabre Samurai → Especialista em Espadas + Lâmina de Chakra + Corte de Chakra
- Iaido → Corte Rápido
- Issen → Hadan
- Impedir Selos → Seguir Passo

### 4. Especialista (Katana) → Wakizashi (regra Daisho)

Já documentada nos equipamentos `katana` e `wakizashi` (equipment-weapons-basic.json). NÃO repliquei aqui — Especialista em Espadas (sub-técnica do Sabre Samurai) só fala "bônus da aptidão Especialista em testes CC com espadas afetadas", não menciona Daisho. Motor combina as duas regras naturalmente.

### 5. Armadura Samurai concede `usar_armaduras_pesadas`

A aptidão `armadura_samurai` tem `effects.grants: ["usar_armaduras_pesadas"]`. Significa que comprar Armadura Samurai dá ambas as proficiências sem precisar comprar Usar Armaduras Pesadas separadamente. **Pré-requisitos**: For 10 OU Vig 12 (mais barato que Usar Armaduras Pesadas, que é For 10 ou Vig 15 — possível erro no livro ou decisão consciente de favorecer samurai. RAW, não casa).

### 6. Pré-req do equipamento usa aptidão, não atributo

`equipment-armor-samurai.json`: `prerequisites.aptitudes: ["armadura_samurai"]` (não `attributes_one_of`). Diferente de Armadura de Batalha (que usa atributo direto). Motivo: aptidão Armadura Samurai JÁ filtra pelo atributo, então é redundante checar de novo no equipamento.

## ✅ Validação pós-seed

Depois de aplicar:

```sql
-- Aptidões: deve haver 8 novas (categoria RESTRITA, type=hijutsu_samurai)
SELECT code, name, category FROM aptitudes
WHERE code IN ('espadachim', 'sabre_samurai', 'iaido', 'yojinbo', 'issen',
               'impedir_selos', 'iaigiri', 'armadura_samurai');

-- Conta total de aptidões (era 145 antes — count com Set dedup; agora 153)
-- ⚠️ user lembrou 149 mas validação Python confirmou 145
SELECT COUNT(*) FROM aptitudes;

-- Equipamento: 1 novo (kind=ARMOR, subtype=armadura_pesada_hijutsu)
SELECT code, name, "absorptionBonus" FROM equipments
WHERE code = 'armadura_de_batalha_samurai';

-- Conta total de equipamentos (era 149 antes; agora 150)
-- ⚠️ user lembrou 153 mas validação Python confirmou 149 deduplicado
SELECT COUNT(*) FROM equipments;
```

Pontos específicos a conferir no Prisma Studio:

- **espadachim**: `effects.subTechniques[0].code = 'aparar_lamina'` com pré-req `des: 10`
- **sabre_samurai**: `effects.subTechniques` com 3 entries (`especialista_em_espadas`, `lamina_de_chakra`, `corte_de_chakra`). Corte de Chakra tem `noManobras: true`
- **yojinbo**: `effects.noManobras: true`, pré-req inclui `ataque_em_movimento`
- **issen**: pré-req `ambidestria`, `effects.corteDeChakraWithDualSwords.weaponDamageMultiplier: 2`
- **impedir_selos**: `effects.trigger = 'inimigo_realiza_selos_no_alcance_cc'`, sub-técnica Seguir Passo
- **iaigiri**: `effects.onlyAsGolpeDeMisericordia: true`
- **armadura_samurai**: `effects.grants: ['usar_armaduras_pesadas']`, `effects.unlocksEquipment: ['armadura_de_batalha_samurai']`
- **armadura_de_batalha_samurai**: `effects.bodyHardnessBonus: 2`, `effects.specialFeatures.extraSwordSheaths.count: 4`

## 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── seed.ts                                  ← atualizar lista (2 arquivos novos)
│   ├── seed-data/
│   │   ├── (arquivos anteriores 1-6i)
│   │   ├── aptitudes-samurai.json               ← NOVO (7a)
│   │   └── equipment-armor-samurai.json         ← NOVO (7a)
```

---

## 🛠️ Comandos manuais

```bash
cd ~/projects/arcana-forge

# 1. Confirma estado anterior (banco antes do 7a)
docker exec -it arcana-forge-db psql -U postgres -d arcana_forge \
  -c "SELECT COUNT(*) FROM aptitudes; SELECT COUNT(*) FROM equipments;"
# Esperado: aptitudes=145, equipments=149 (deduplicado via Set como o seeder conta)

# 2. Os 2 JSONs já estão em prisma/seed-data/ (gerados direto pelo Claude)
ls prisma/seed-data/aptitudes-samurai.json prisma/seed-data/equipment-armor-samurai.json

# 3. README também já está em tmp/
ls prisma/seed-data/tmp/lote-7a-README.md

# 4. Atualiza seed.ts e roda
pnpm prisma db seed

# 5. Valida
pnpm prisma studio &
# Confere aptitudes=157, equipments=154
```

---

## 💬 Prompt pro Claude Code

```
# Aplicar Lote 7a do Seed: Aptidões + Armadura do Hijutsu Samurai

Primeiro lote da Fase 7. 8 aptidões RESTRITAS (hijutsu_samurai) + 1 equipamento (Armadura de Batalha Samurai). Fecha buraco de 0 aptidões samurai no banco.

## Arquivos novos

- `aptitudes-samurai.json` (8 aptidões):
  - espadachim (base) + sub-técnica Aparar Lâmina
  - sabre_samurai (CC 12) + 3 sub-técnicas (Especialista em Espadas, Lâmina de Chakra, Corte de Chakra)
  - iaido (Des 8 + Espadachim + Saque Rápido) + Corte Rápido
  - yojinbo (Des 10, requer Iaido + Ataque em Movimento)
  - issen (Des/Esp 12, requer Sabre Samurai + Ambidestria) + Hadan
  - impedir_selos (Des 12, requer Iaido) + Seguir Passo
  - iaigiri (Des 14, requer Iaido)
  - armadura_samurai (For 10 OU Vig 12) — grants usar_armaduras_pesadas
- `equipment-armor-samurai.json` (1 equipamento):
  - armadura_de_batalha_samurai — pesada, 600 Ryos, +20 absorção, +2 dureza corpo, -3 comp, penalidade 0(-5), 4 bainhas grátis, capacete-respirador

## Antes de codar

1. Leia `prisma/seed-data/tmp/lote-7a-README.md` — pontos importantes:
   - Sub-técnicas (Aparar Lâmina, Corte Rápido, Hadan, etc.) modeladas em `effects.subTechniques`, NÃO em evolutions
   - `prerequisites.type: "hijutsu_samurai"` é o discriminador (mesmo padrão do juuinka_ichi)
   - 4 aptidões têm `effects.noManobras: true`: yojinbo, issen.subTechniques.hadan, iaigiri, sabre_samurai.subTechniques.corte_de_chakra
   - armadura_samurai concede usar_armaduras_pesadas (já existe no banco) via `effects.grants`
   - equipment armadura_de_batalha_samurai depende da aptidão armadura_samurai (não do atributo direto)

2. Schema NÃO muda — sem migration.

## Tarefas

1. Atualizar `seedAptitudes()` em `prisma/seed.ts` pra incluir `aptitudes-samurai.json`
2. Atualizar `seedEquipments()` em `prisma/seed.ts` pra incluir `equipment-armor-samurai.json`
3. Rodar `pnpm prisma db seed`
4. Validar no Prisma Studio:
   - Tabela `aptitudes` tem 153 linhas (145 + 8) — Set dedup
   - Tabela `equipments` tem 150 linhas (149 + 1) — Set dedup
   - Espadachim: effects.subTechniques[0].code = "aparar_lamina"
   - Sabre Samurai: 3 sub-técnicas em effects.subTechniques
   - Armadura Samurai: effects.grants contém "usar_armaduras_pesadas"
   - Armadura de Batalha Samurai: effects.bodyHardnessBonus = 2, specialFeatures.extraSwordSheaths.count = 4

## ⛔ Limites

- **NÃO crie** Power "samurai" nem categoria HIJUTSU_SAMURAI separada — é só conjunto de aptidões + equipamento, não tem Power-pai
- **NÃO toque** nas armaduras leves/pesadas do 6e
- **NÃO toque** em usar_armaduras_pesadas (já está no banco via 6-patches)
- **NÃO faça** `git push`

## Após aplicar

Documente no `SESSION-LOG.md`:
- Total de aptidões: 153 (145 + 8) — Set dedup
- Total de equipamentos: 150 (149 + 1) — Set dedup
- 4 aptidões/sub-técnicas têm `noManobras: true` — motor precisa respeitar
- `armadura_samurai` concede `usar_armaduras_pesadas` via grants — primeiro caso de aptidão que dá outra aptidão de combate (Tensai já fazia, mas no nível Hijutsu)
- Próximo passo sugerido: **Lote 7b (Powers Órfãos)** — catalogar hachimon_tonkou, jiton, senninka, juuinka, sabaku, aoi_katon, sanbi_suiton, yonbi_youton (powers referenciados por effects já existentes mas ausentes da tabela powers). Antes de produzir, AUDITAR seeder + validador pra entender se hoje existem refs dormentes (lote 3 da auditoria de entrada do 7).
```
