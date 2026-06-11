# Lote 7c — Aptidões do Clã Kaguya (Shikotsumyaku completo)

Terceiro lote da Fase 7. Fecha o buraco do Clã Kaguya identificado na auditoria de entrada.

## 📦 Conteúdo (1 arquivo, 7 entries: 1 upsert + 6 novas)

`aptitudes-kaguya.json` — todas RESTRITA, clã Kaguya

| # | Code | Tipo | Pré-req atributo |
|---|---|---|---|
| 1 | `artesao_de_ossos` | UPSERT (refino) | — |
| 2 | `armadura_ossea` | NOVA | Vig escalonado |
| 3 | `karamatsu_no_mai` | NOVA | Vig 6 |
| 4 | `yanagi_no_mai` | NOVA | Acrobacia 6 |
| 5 | `tsubaki_no_mai` | NOVA | Agi 8 |
| 6 | `tessenka_no_mai` | NOVA | Vig 12 + (For 10 ou Des 10) + Ambidestria |
| 7 | `sawarabi_no_mai` | NOVA | Vig 16 + Tessenka |

## ⚠️ Pontos importantes

### 1. UPSERT do `artesao_de_ossos` (não é nova)

A versão existente em `aptitudes-clan-restricted.json:550` tem `effects` mínimos com nota "Detalhes completos seguem Livro de Hijutsus 1 p. 14-17." Este lote substitui pela versão completa:

- Regras de criação de armas (leve/mediana/longa/pesada com custos em Vit e ação)
- Qualidade das armas (+2 dureza, +1 dano)
- 3 sub-técnicas: Teshi Sendan (projéteis dos dedos), Arma-Presa (ossos das palmas), Especialista Shikotsumyaku
- Restrições (tipos corte/perfuração; sem armas mecânicas; saque rápido não acelera)

Declarado em `_meta.intentionalUpserts` pra demover colisão de `error` → `info` no validador. Seeder roda o upsert sem reclamar (mesma mecânica de `burro_de_carga`/`furtividade_agil`/`usar_armaduras_pesadas`).

### 2. Karamatsu no Mai tem 2 MODOS (defensivo + ofensivo)

O livro descreve ambos modos sob o mesmo bloco — mesma aptidão, gasta o mesmo "slot". Modelado em `effects.modes.{defensive,offensive}`, NÃO em `subTechniques`. Decisão: subTechniques são técnicas-filha com trigger próprio (Aparar Lâmina dentro de Espadachim); modes são alternativas mutuamente exclusivas dentro do mesmo evento.

- **Modo defensivo**: Defender com Técnica usando CC ao invés de LM, +dureza extra = Vigor, contra-ataque desarmado = 1 dano fixo por Vigor
- **Modo ofensivo**: mãos livres ou armas-presas, ataque CC ganha Ataque Giratório (todos os ataques do Ataque Múltiplo viram giratórios)

### 3. Regra cross-dança modelada em Armadura Óssea

O livro tem a frase "Sempre que atacar com uma arma de osso leve, seja um ataque comum, nesta dança ou em qualquer outra, você pode utilizar Destreza no lugar da Força no cálculo de dano." dentro do bloco de Karamatsu — mas o efeito atravessa TODAS as danças. Modelei em `armadura_ossea.effects.crossDanceRule` porque Armadura Óssea é pré-req da Karamatsu, então sempre vai existir quando a regra precisar disparar. Documentado em `_meta.regraGeralDoConjunto`.

### 4. Sawarabi no Mai usa efeito existente como base

Funciona como Lança Nv 6 (Ninpou) com parâmetros próprios. NÃO modelei como `power_effect` separado — fica em `effects.baseEffect: "lanca_nv_6"`. Motor resolve a herança quando computar dano/dif. Com Vigor 18 vira Lança Nv 9 (modelado em `effects.vigor18Upgrade`).

### 5. Pré-reqs encadeados — Sawarabi requer Tessenka

`sawarabi_no_mai.prerequisites.aptitudes` inclui `tessenka_no_mai`. Isso significa que pra um Kaguya conseguir a 5ª Dança, precisa ter passado pela 4ª. Validador vai checar essa cadeia automaticamente quando o jogador tentar comprar.

### 6. Contagem Kaguya pós-7c

Antes: 2 Kaguya-only (shikotsumyaku + artesao_de_ossos parcial) + regeneracao compartilhada = ~3.

Depois: 8 Kaguya-only (shikotsumyaku + artesao_de_ossos completo + armadura_ossea + 5 danças) + regeneracao compartilhada = 9.

Tua narrativa de entrada disse "1 de 6 modelada". O número correto era 2 de ~8. Direção certa, magnitude levemente errada. Esse lote fecha o gap.

### 7. Contagens recalibradas (correção pós-revisão Fase 7)

Pré-7a: 145 aptidões (Set dedup, NÃO 149 como tu lembrou). Trilha real:
- 145 → 153 (7a +8 samurai) → 159 (7c +6 kaguya, artesao_de_ossos upsert)

## ✅ Validação pós-seed

```sql
-- Aptidões: 153 antes (após 7a) → 159 depois (+6 novas; artesao_de_ossos é upsert)
-- ⚠️ correção pós-revisão: contagens recalibradas via validação Python (Set dedup)
SELECT COUNT(*) FROM aptitudes;

-- Verificar 6 novas + upsert refinado
SELECT code, name, prerequisites->>'attributes' as attrs
FROM aptitudes
WHERE code IN ('artesao_de_ossos', 'armadura_ossea', 'karamatsu_no_mai',
               'yanagi_no_mai', 'tsubaki_no_mai', 'tessenka_no_mai', 'sawarabi_no_mai')
ORDER BY code;

-- Validar upsert: artesao_de_ossos agora deve ter subTechniques
SELECT effects->'subTechniques' FROM aptitudes WHERE code = 'artesao_de_ossos';
-- Esperado: array com 3 entries (teshi_sendan, arma_presa, especialista_shikotsumyaku)
```

Pontos a conferir no Prisma Studio:

- **artesao_de_ossos**: `effects.subTechniques` com 3 entries; `effects.creationCosts.leve.vit: 1`, `pesada.vit: 4`
- **armadura_ossea**: `effects.bodyHardnessByVigor.14: 3`; `effects.grants: ["duro_de_matar"]`
- **karamatsu_no_mai**: `effects.modes.defensive.rollSubstitution: "cc_no_lugar_de_lm"`; `modes.offensive.grantsToMeleeAttack: ["ataque_giratorio"]`
- **yanagi_no_mai**: `effects.grants: ["retirada_rapida", "trespassar_nv_2"]`; `effects.onKillBonus.extraMovement: "5m..."`
- **tsubaki_no_mai**: `effects.attacksCount: 3`; `defensePenaltyByAttack: {1:0, 2:-1, 3:-2}`
- **tessenka_no_mai**: `effects.weapons.tsuru.damageBonus: 4`; `weapons.hana.damageBonus: 6`
- **sawarabi_no_mai**: `effects.baseEffect: "lanca_nv_6"`; `vigor18Upgrade.effect: "lanca_nv_9"`

## 📁 Estrutura

```
arcana-forge/
├── prisma/
│   ├── seed.ts                            ← adicionar 'aptitudes-kaguya.json' em APTITUDE_FILES
│   ├── seed-data/
│   │   ├── aptitudes-clan-restricted.json ← já tem artesao_de_ossos versão antiga
│   │   ├── aptitudes-kaguya.json          ← NOVO 7c (upsert refina + 6 novas)
```

Ordem no `APTITUDE_FILES`: `aptitudes-kaguya.json` DEPOIS de `aptitudes-clan-restricted.json` pra o upsert ganhar.

---

## 🛠️ Comandos manuais

```bash
cd ~/projects/arcana-forge

# 1. Estado anterior
docker exec -it arcana-forge-db psql -U postgres -d arcana_forge \
  -c "SELECT COUNT(*) FROM aptitudes WHERE prerequisites @> '{\"clans\":[\"kaguya\"]}';"
# Esperado: 2 (shikotsumyaku + artesao_de_ossos)

# 2. JSON já está em prisma/seed-data/aptitudes-kaguya.json
ls prisma/seed-data/aptitudes-kaguya.json

# 3. Atualizar APTITUDE_FILES em prisma/seed.ts:348-356
#    Adicionar 'aptitudes-kaguya.json' DEPOIS de aptitudes-clan-restricted.json
#    (ordem importa: upsert do artesao_de_ossos só funciona se vier depois)

# 4. Validar
pnpm tsx scripts/validate-seed-data.ts
# Esperado: 0 errors. 'artesao_de_ossos' aparece como info de intentionalUpsert.

# 5. Aplicar
pnpm prisma db seed

# 6. Conferir
docker exec -it arcana-forge-db psql -U postgres -d arcana_forge \
  -c "SELECT COUNT(*) FROM aptitudes WHERE prerequisites @> '{\"clans\":[\"kaguya\"]}';"
# Esperado: 8 (2 antigas + 6 novas, artesao_de_ossos foi refinado mas continua sendo 1)
```

---

## 💬 Prompt pro Claude Code

```
# Aplicar Lote 7c: Aptidões do Clã Kaguya (Shikotsumyaku completo)

Terceiro lote da Fase 7. 1 upsert refinando aptidão existente + 6 aptidões novas.
Total no banco: +6 entries (artesao_de_ossos não muda count, só refina effects).

## Arquivos novos

- `aptitudes-kaguya.json` (7 entries: 1 upsert + 6 novas):
  - artesao_de_ossos (UPSERT) — agora com 3 sub-técnicas: Teshi Sendan, Arma-Presa, Especialista Shikotsumyaku + regras completas de criação de armas
  - armadura_ossea (NOVA, Vig escalonado: 1→2→3 dureza corpo)
  - karamatsu_no_mai (NOVA, Vig 6, 2 modos: defensivo + ofensivo)
  - yanagi_no_mai (NOVA, Acrobacia 6, grants Retirada Rápida + Trespassar Nv 2)
  - tsubaki_no_mai (NOVA, Agi 8, Ataque Múltiplo x3 com penalidades crescentes)
  - tessenka_no_mai (NOVA, Vig 12 + Ambidestria, cria Tsuru e Hana)
  - sawarabi_no_mai (NOVA, Vig 16, funciona como Lança Nv 6 de Ninpou)

## Antes de codar

1. Leia `prisma/seed-data/tmp/lote-7c-README.md` — pontos importantes:
   - artesao_de_ossos é UPSERT — declarado em _meta.intentionalUpserts
   - karamatsu_no_mai tem 2 modos (modes.defensive + modes.offensive), NÃO subTechniques
   - Regra "Destreza no lugar de Força com armas leves de osso" está em
     armadura_ossea.effects.crossDanceRule (atravessa todas as danças)
   - sawarabi_no_mai usa baseEffect: "lanca_nv_6" — motor herda parâmetros do Ninpou
   - Vigor 18 amplia Sawarabi de Lança Nv 6 → Nv 9 (effects.vigor18Upgrade)
   - Cadeia de pré-req: sawarabi requer tessenka

2. Schema NÃO muda — sem migration.

3. ORDEM no APTITUDE_FILES é crítica: aptitudes-kaguya.json DEPOIS de
   aptitudes-clan-restricted.json pro upsert do artesao_de_ossos ganhar.

## Tarefas

1. Adicionar 'aptitudes-kaguya.json' em APTITUDE_FILES (prisma/seed.ts:348-356),
   DEPOIS de aptitudes-clan-restricted.json
2. Rodar `pnpm tsx scripts/validate-seed-data.ts` — esperar 0 errors
3. Rodar `pnpm prisma db seed`
4. Validar no Prisma Studio:
   - Tabela aptitudes: contagem aumentou em 6 (não 7, porque artesao_de_ossos é upsert)
   - artesao_de_ossos.effects.subTechniques tem 3 entries
   - armadura_ossea.effects.bodyHardnessByVigor.14 = 3
   - karamatsu_no_mai.effects.modes tem 2 chaves (defensive + offensive)
   - sawarabi_no_mai.effects.baseEffect = "lanca_nv_6"

## ⛔ Limites

- **NÃO crie** Power "shikotsumyaku" — KG já está em kekkei-genkais.json + aptidão
- **NÃO toque** em shikotsumyaku ou regeneracao (já modeladas em clan-restricted)
- **NÃO modele** o efeito Lança como entry nova em power_effects — Sawarabi
  REFERENCIA o efeito existente via effects.baseEffect
- **NÃO faça** git push

## Após aplicar

Documente no SESSION-LOG.md:
- Total de aptidões: 163 (157 + 6 novas)
- Kaguya: 2 → 8 aptidões clã-específicas + regeneracao compartilhada
- artesao_de_ossos refinado: agora tem 3 sub-técnicas + regras completas de criação
- Próximo passo: Lote 7d (Fuuma — Demônio do Vento + refino Yuki Congelamento)
```
