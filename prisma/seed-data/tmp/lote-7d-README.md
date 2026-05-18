# Lote 7d — Fuuma (Demônio do Vento) + refino Yuki Congelamento

**FECHAMENTO DO BLOCO "PATCHES DE APTIDÕES" DA FASE 7.** Quarto e último lote antes de partir pros KGs/Hijutsus avançados (Suika expandido, Jinchuuriki, Rinnegan etc.).

## 📦 Conteúdo (1 arquivo, 2 entries: 1 nova + 1 upsert)

`aptitudes-fuuma-yuki.json` — ambas RESTRITA

| Code | Tipo | Clã | Pré-req |
|---|---|---|---|
| `demonio_do_vento` | NOVA | fuuma | Tensai (Hijutsu) |
| `congelamento` | UPSERT | yuki | Hyouton 6 |

## ⚠️ Pontos importantes

### 1. Fuuma tem APENAS 1 aptidão restrita no livro

Confirmado lendo o capítulo. "Hijutsu: Tensai e Demônio do Vento (aptidão restrita)" — só essa. Tua narrativa de entrada estava correta nesse ponto. O lote fecha o gap completo do clã.

### 2. Demônio do Vento ocupa slot de Aptidão Especial do Tensai

Não é aptidão "comprável diretamente" como as outras — é uma das 2 opções de **Aptidão Especial** do Hijutsu Tensai. Modelado em `effects.occupiesTensaiSpecialSlot: true` + `effects.tensaiSpecialSlotsTotal: 2`. Mesmo padrão das outras Aptidões Especiais (`presa_de_prata`, `vontade_do_fogo`, `lamina_da_lua`) que já existem no banco.

Motor deve checar: ao escolher `demonio_do_vento`, decrementa o contador de slots disponíveis do Tensai do personagem.

### 3. Dano override é regra rara — destacar

`effects.fuumaShurikenDamageOverride.damageBaseFormula: "nivel_de_destreza"` substitui completamente o cálculo padrão de dano base de armas de arremesso E o dano de arma. Isso quebra a expectativa default do motor — precisa flag explícita. Documentei em `overrides: ["calculo_padrao_dano_base_armas_arremesso", "dano_de_arma"]`.

### 4. UPSERT do Congelamento (não nova)

A versão existente em `aptitudes-clan-restricted.json:591` é:

```json
{
  "code": "congelamento",
  "effects": {
    "type": "hyouton_enhancement",
    "needsDeepResearch": true,
    "notes": "Consultar Livro de Hijutsus 1 p. 18-21 pra detalhes mecânicos completos."
  },
  "prerequisites": { "clans": ["yuki"] }
}
```

Este lote substitui pela versão completa do livro: pré-req `Hyouton 6`, teste de Vigor (Dif padrão -2), impedido até fim do próximo turno da vítima, escopo limitado a efeitos à distância (exclui Energizar e Criar Arma).

Declarado em `_meta.intentionalUpserts` pro validador demover colisão de `error` → `info`. Ordem em APTITUDE_FILES é crítica — esse arquivo precisa vir DEPOIS de `aptitudes-clan-restricted.json`.

### 5. Selos Especiais (Yuki) já está completo

Olhei `aptitudes-clan-restricted.json:568-589` — já tem todas as regras (selos com uma mão, sem penalidade de combate próximo, combo Golpear → técnica como ação de movimento, constraints `cd_ofensiva` + `duracao_instantanea`). Match com o livro. **Não entra neste lote.** Yuki tem só Congelamento como débito real, e ele está sendo fechado aqui.

### 6. Restrição "efeito à distância com teste contra defesa"

Modelei em `effects.appliesTo.scope` + `excludes`. O motor precisa entender que Congelamento só procca quando:
- Efeito Hyouton é à distância (não toque)
- Tem teste de acerto (rollType CD, não passivo)
- Causou dano (não zero damage)
- NÃO é Energizar (que é melee buff) nem Criar Arma (que é criação, não ataque)

Isso filtra ~5 efeitos Hyouton que NÃO disparariam: criar_arma, energizar, restringente (não causa dano), barreira (reação), e Espelhos Demoníacos (não tem teste de acerto direto).

## ✅ Validação pós-seed

```sql
-- Aptidões: 159 antes (após 7c) → 160 depois (+1 nova; congelamento é upsert)
-- ⚠️ correção pós-revisão: contagens recalibradas via validação Python (Set dedup)
SELECT COUNT(*) FROM aptitudes;

-- Verificar nova + refino
SELECT code, name, prerequisites, effects->'type' as effect_type
FROM aptitudes
WHERE code IN ('demonio_do_vento', 'congelamento')
ORDER BY code;

-- Congelamento NÃO deve ter mais needsDeepResearch
SELECT effects->'needsDeepResearch' FROM aptitudes WHERE code = 'congelamento';
-- Esperado: null (chave não existe mais)

-- Fuuma agora tem 1 aptidão clã-específica
SELECT COUNT(*) FROM aptitudes WHERE prerequisites @> '{"clans":["fuuma"]}';
-- Esperado: 1
```

Pontos a conferir no Prisma Studio:

- **demonio_do_vento**: `effects.occupiesTensaiSpecialSlot: true`, `effects.fuumaShurikenDamageOverride.damageBaseFormula: "nivel_de_destreza"`, prereq aptidão `tensai`
- **congelamento**: `effects.type: "hyouton_status_proc"`, `effects.appliesTo.excludes: ["energizar", "criar_arma"]`, prereq `powers.hyouton: 6`

## 📁 Estrutura

```
arcana-forge/
├── prisma/
│   ├── seed.ts                              ← adicionar 'aptitudes-fuuma-yuki.json' em APTITUDE_FILES
│   ├── seed-data/
│   │   ├── aptitudes-clan-restricted.json   ← contém congelamento versão antiga
│   │   ├── aptitudes-kaguya.json            ← lote 7c (upsert artesao_de_ossos)
│   │   └── aptitudes-fuuma-yuki.json        ← NOVO 7d (1 nova + 1 upsert)
```

Ordem no `APTITUDE_FILES`: `aptitudes-fuuma-yuki.json` DEPOIS de `aptitudes-clan-restricted.json` pra o upsert ganhar.

---

## 🛠️ Comandos manuais

```bash
cd ~/projects/arcana-forge

# 1. Estado anterior
docker exec -it arcana-forge-db psql -U postgres -d arcana_forge -c "
SELECT COUNT(*) FROM aptitudes;
SELECT effects->'needsDeepResearch' as still_needs_research
FROM aptitudes WHERE code = 'congelamento';
"
# Esperado: 159 + true (precisa refino)

# 2. JSON já está em prisma/seed-data/
ls prisma/seed-data/aptitudes-fuuma-yuki.json

# 3. Atualizar APTITUDE_FILES em prisma/seed.ts
#    Adicionar 'aptitudes-fuuma-yuki.json' DEPOIS de aptitudes-kaguya.json
#    (que já está depois de aptitudes-clan-restricted.json pelo 7c)

# 4. Validar
pnpm tsx scripts/validate-seed-data.ts
# Esperado: 0 errors. 'congelamento' como info de intentionalUpsert.

# 5. Aplicar
pnpm prisma db seed

# 6. Conferir
docker exec -it arcana-forge-db psql -U postgres -d arcana_forge -c "
SELECT COUNT(*) FROM aptitudes;
SELECT effects->'needsDeepResearch' as still_needs_research
FROM aptitudes WHERE code = 'congelamento';
"
# Esperado: 160 + null
```

---

## 💬 Prompt pro Claude Code

```
# Aplicar Lote 7d: Fuuma (Demônio do Vento) + refino Yuki Congelamento

Quarto e último lote do bloco "Patches de Aptidões" da Fase 7. 1 nova + 1 upsert.
Total no banco: +1 entry (congelamento é upsert, não soma).

## Arquivos novos

- `aptitudes-fuuma-yuki.json` (2 entries):
  - demonio_do_vento (NOVA, RESTRITA, clã fuuma, Aptidão Especial do Tensai)
  - congelamento (UPSERT, RESTRITA, clã yuki, Hyouton 6) — remove needsDeepResearch

## Antes de codar

1. Leia `prisma/seed-data/tmp/lote-7d-README.md` — pontos importantes:
   - demonio_do_vento OCUPA slot de Aptidão Especial do Tensai (occupiesTensaiSpecialSlot: true)
   - fuumaShurikenDamageOverride substitui cálculo padrão de dano base — flag explícita
   - congelamento é UPSERT (intentionalUpserts) — versão antiga em clan-restricted tem needsDeepResearch
   - Congelamento só procca em efeitos Hyouton à distância COM teste de acerto;
     exclui Energizar, Criar Arma, Restringente, Barreira, Espelhos Demoníacos
   - Selos Especiais (Yuki) JÁ está completo — não toque

2. Schema NÃO muda — sem migration.

3. ORDEM em APTITUDE_FILES: aptitudes-fuuma-yuki.json DEPOIS de aptitudes-clan-restricted.json
   E DEPOIS de aptitudes-kaguya.json (que já está nessa posição pelo 7c)

## Tarefas

1. Adicionar 'aptitudes-fuuma-yuki.json' em APTITUDE_FILES (prisma/seed.ts),
   na ÚLTIMA posição (depois de aptitudes-kaguya.json se presente, ou depois de
   aptitudes-clan-restricted.json caso 7c não tenha sido aplicado ainda)
2. Rodar `pnpm tsx scripts/validate-seed-data.ts` — esperar 0 errors
3. Rodar `pnpm prisma db seed`
4. Validar no Prisma Studio:
   - aptitudes contagem +1
   - demonio_do_vento.effects.occupiesTensaiSpecialSlot = true
   - congelamento.effects.needsDeepResearch é null/undefined
   - congelamento.effects.type = "hyouton_status_proc"

## ⛔ Limites

- **NÃO toque** em selos_especiais (Yuki) — já está completo
- **NÃO crie** Power "demonio_do_vento" — é aptidão, não poder
- **NÃO renomeie** congelamento — code preservado pra upsert funcionar
- **NÃO faça** git push

## Após aplicar

Documente no SESSION-LOG.md:
- Aptidões: 159 → 160 (+1; congelamento foi upsertado, não adicionado) — Set dedup
- Fuuma: 0 → 1 aptidão clã-específica (Demônio do Vento)
- Yuki: 2 → 2 mas congelamento agora tem regras completas (removido needsDeepResearch)
- Fim do bloco "Patches de Aptidões" da Fase 7 (7a + 7b + 7c + 7d)
- Próximo passo: re-auditar o que falta no plano original do user
  (7e-f Sharingan/Byakugan? Suika expandido? Jiton já entrou no 7b!)
```
