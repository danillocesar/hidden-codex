# Lote 7f2 — Bijuus 1-9 (tabelas + integrações + técnicas + equipamentos)

Quatro sub-lotes (a/b/c/d) que fecham a Fase 7f completamente. Resolve refs dormentes da Fase 7b + cobre lacunas das 9 Bijuus.

## 📦 Conteúdo (4 arquivos novos + 2 modificados)

### 7f2a — `aptitudes-jinchuuriki-bijuus.json` (9 aptidões)

9 aptidões marcadoras (`jinchuuriki_<bijuu>`), uma por Bijuu. Cada uma carrega:
- `bijuuTable: Record<nivel, string[]>` — o que é desbloqueado a cada nível do power Jinchuuriki
- `formaBijuuDifferences` — particularidades da Forma Bijuu daquela Bijuu específica
- `additionalTechniques` — técnicas únicas da Bijuu
- Pré-req narrativo: ser selado com a Bijuu (decisão de Mestre)

### 7f2b — `powers-jinchuuriki-bijuus.json` (2 powers novos)

- **`gobi_futton`** (Hijutsu Jinchuuriki, Kokuō) — NÃO segue regras de Ninpou. Técnicas distribuídas via tabela do Jinchuuriki. Restrição: Futton/Suiton/Katon apenas.
- **`rokubi_suiton`** (Hijutsu Jinchuuriki, Saiken) — variante de Suiton. Técnicas de Bolhas via Soprador de Bolhas (canudo especial).

### 7f2c — `effects-jinchuuriki-bijuus.json` (20 effects técnicos)

| Bijuu | Effects |
|---|---|
| Matatabi | nekozume (MOVIDO de aoi-katon — correção factual) |
| Isobu | sangosho (3 nv), kagenade (MOVIDO de sanbi-suiton) |
| Kokuō | ebulicao (2 nv), aceleracao_vapor (2 nv), forca_vapor (4 nv), tsunoori |
| Saiken | corrosao_da_lesma (com Hiruma subTech), bolha_tinta (2 nv), sopro_acido, bolha_sufocante, bolha_flutuante |
| Chōmei | po_de_prata (2 nv), rede_de_fios (2 nv), casulo_de_fios |
| Gyuki | tinta_do_polvo (3 subTechs), cauda_morta, tornado_do_polvo |
| Kurama | cura_da_raposa, modo_kurama |

### 7f2d — `equipment-jinchuuriki-bijuus.json` (2 itens)

- **Soprador de Bolhas** (Saiken) — arma especial sem necessidade de Usar Arma
- **Armadura a Vapor** (Kokuō) — armadura pesada hermética necessária pra Aceleração-Vapor e Força-Vapor

### Arquivos modificados (correções factuais)

- **`effects-aoi-katon.json`** — REMOVIDO `nekozume`. Erro factual do lote 7b: técnica é do Jinchuuriki Matatabi, não do Aoi Katon (RAW p.35).
- **`effects-sanbi-suiton.json`** — REMOVIDO `sangosho`. Mesmo padrão: técnica é do Jinchuuriki Isobu (RAW p.37).

## ⚠️ Decisões e trade-offs

### 1. Bijuus como aptidões marcadoras, não kekkei genkais

Cada Bijuu poderia ser KG (já existe entidade KekkeiGenkai). Decisão: **aptidão**, porque:
- A Bijuu não está no DNA do jogador — é selada
- `bijuuTable` é estrutura complexa (Record por nível) que cabe melhor em `effects` da aptidão
- KG seria semanticamente errado: Bijuu não é hereditária

### 2. Cada Bijuu tem `bijuuTable` em vez de criar 90 aptidões (10 por Bijuu)

A tabela embutida em JSONB evita explosão de entidades. Motor de regras consulta `effects.bijuuTable[nivel_atual_do_jinchuuriki]` pra liberar bônus/técnicas. Trade-off: lookup é via JSONB em runtime (não é FK normalizada), mas isso é coerente com SCHEMA-PATTERNS §9.

### 3. Nekozume e Sangoshō movidos pra Jinchuuriki

RAW deixa claro: ambas são técnicas do Jinchuuriki que modificam estado de Modo/Forma Bijuu, NÃO do power elemental. Sangoshō só funciona em Modo Bijuu; Nekozume modifica Potência da Besta. Lote 7b colocou no lugar errado. Corrigido com `intentionalUpserts: ["nekozume"]` no novo arquivo e remoção dos antigos.

### 4. `modo_kurama` como effect exclusivo

RAW p.52: Modo Kurama SUBSTITUI Manto/Modo Bijuu (perde acesso aos dois). Modelado com `exclusiveWith: ["manto_bijuu", "modo_bijuu"]`. Motor precisa enforce: ao desbloquear Modo Kurama, os dois ficam indisponíveis.

### 5. Power Virtual: Gobi Futton NÃO segue regras de Ninpou

RAW p.42 explicitamente: "Gobi Futton não segue as regras do poder Ninpou. Ele possui regras próprias." Flag `doesNotFollowNinpouRules: true` no power. Diferente de Aoi Katon/Sanbi/Yonbi Suiton/Sabaku — esses são variantes que SEGUEM Ninpou.

### 6. Refs `barreira_nv6` evitada

`bolha_flutuante` (Rokubi) requer "Barreira Nv 6". Não criamos effect fake `barreira_nv6` — em vez disso, usamos nota narrativa apontando que o effect `barreira` precisa estar disponível no nível 6 do power Rokubi Suiton. Motor de regras verifica.

### 7. Refs parametrizadas declaradas em equipment-weapons-gas (cleanup)

Encontrei 11 PRE-REQ APT MISSING em `equipment-weapons-gas.json` (lote 6d) — todos refs parametrizadas (`usar_arma_X`, `guerreiro_longas`). Declaradas em `_meta.unmodeledAptitudes` (mesma estratégia dos outros arquivos). Erros pré-7f, mas estavam aparecendo no validador agora porque o validador foi consultando equipamentos. Dívida técnica: padrão `<aptidao>_<param>` precisa virar `{aptitude, parameter}` no schema (mas isso é refator grande, fica pra próxima sessão de motor).

## 🧪 Validação final

```
Aptitudes:  170 (era 161 + 9 jinchuuriki_*)
Powers:     43  (era 41 + gobi_futton + rokubi_suiton)
Effects:    177 (era 159 + 20 novos − 2 movidos)
Equipments: 151 (era 149 + 2)
Erros: 0 ✅
```

## 📋 Prompt pro Claude Code

> Aplicar lote 7f2 no banco do Arcana Forge. 4 arquivos JSON novos + 2 modificados em `prisma/seed-data/`. `prisma/seed.ts` atualizado com novos arquivos em POWER_FILES, EFFECT_FILES, APTITUDE_FILES e EQUIPMENT_FILES.
>
> ```bash
> docker exec arcana-forge-db pg_dump -U postgres arcana_forge > /tmp/pre-7f2-backup.sql
> pnpm prisma db seed
> ```
>
> Verificar via Prisma Studio:
> - `aptitudes` table: 170 entries (filtrar `code LIKE 'jinchuuriki_%'` — 9 aptidões marcadoras).
> - `powers` table: 43 entries (filtrar `code IN ('gobi_futton', 'rokubi_suiton')`).
> - `power_effects` table: 177 entries (filtrar pela lista das 20 novas).
> - `equipments` table: 151 entries (filtrar `code IN ('soprador_de_bolhas', 'armadura_a_vapor')`).
> - Confirmar `nekozume` agora tem `availableFor: ['jinchuuriki']` e prereq aptidão `jinchuuriki_matatabi`.

## 🔗 Próximo passo

**Task #10 — 7g: Senninka completo + Juuinka complemento.** Senjutsu já tem power base; Senninka e Juuinka I/II têm aptidões. Falta cobrir Modo Eremita técnicas exclusivas + Selo Amaldiçoado evoluções específicas.

Ou Task #11 (7h: Rinnegan + Rinne Ninpou + Edo Tensei) se preferir lateralmente.

Ou Task #15 (cleanup pré-7e: armadura_de_raios + hibon_ninpou).
