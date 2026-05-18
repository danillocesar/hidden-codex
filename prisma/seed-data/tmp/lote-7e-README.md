# Lote 7e — Sharingan stack + Suika expandido + patch Dokujutsu

**Primeiro lote da Fase 7 pós-"Patches de Aptidões".** Cobre 3 frentes em sequência: patch factual no Dokujutsu (7e0), modelagem completa do Mangekyou Sharingan + Hipnose (7e1), e fechamento dos efeitos exclusivos do Suika (7e2). Pré-requisito antes da Task #8 (Jinchuuriki base).

## 📦 Conteúdo

### 7e0 — Patch Dokujutsu
Arquivos modificados (sem novos):
- `powers-additional.json`: `dokujutsu.rules.allowedEffects` agora tem 13 entradas (era 16, com 3 fora-do-RAW: `dano_continuo`, `purificar`, `cegante`). `energizarVariant` string solta substituído por `energizarVenenosoNote` apontando pra canônico em effect.
- `effects-ninpou-universal.json`: `energizar.availableFor` ganha `dokujutsu`. `energizar.rules.variants.dokujutsu` modela Energizar Venenoso (RAW p. 202).

### 7e1 — Sharingan stack
3 arquivos novos:
- `powers-uchiha-mangekyou.json` (1 power virtual `mangekyou_sharingan`)
- `effects-mangekyou-sharingan.json` (6 effects Nv 10: tsukuyomi, amaterasu, kagutsuchi/Enton, kamui_curto, kamui_longo, susanoo)
- `aptitudes-uchiha-doujutsu.json` (1 nova `hipnose_sharingan` + 2 upserts `nidan_sharingan`, `sandan_sharingan` refatorando fields → subTechniques)

### 7e2 — Suika expandido
1 arquivo novo + 1 modificação:
- `effects-suika.json` (4 effects: braco_de_agua Nv 5, afogar Nv 6, monstro_de_agua Nv 7, clone_de_oleo Nv 8)
- `effects-ninpou-universal.json`: `canhao.rules.variants.suika` modela Pistola D'Água (RAW Hijutsus p. 11)

## ⚠️ Pontos importantes

### 1. Power virtual sem progressão (PADRÃO NOVO)

`mangekyou_sharingan` é o primeiro power do projeto que NÃO tem níveis 1-10. Todas as 6 técnicas são Nv 10 fixas pra dificuldade. Documentado em SCHEMA-PATTERNS §9.

Flags introduzidas:
- `power.rules.isVirtualPower: true`
- `power.stats.noLevelProgression: true`
- `power.stats.fixedLevelForDifficulty: 10`
- `effect.minLevel: 10` em todos os 6 effects

Motor de regras precisa pular validação de "nível N do poder X" pra este power — basta o jogador ter o power (que requer apenas a aptidão `mangekyou_sharingan`).

### 2. Pares mutuamente exclusivos do Mangekyou

RAW: jogador escolhe 1 par + Susanoo fixo. Modelado em `power.rules.techniquePairs` (lista de 3 objetos) + `power.rules.mutuallyExclusivePairs: true` + `power.rules.fixedAddon: "susanoo"`.

Motor deve enforce: se jogador tem `tsukuyomi`, não pode comprar `kagutsuchi` (par contrário); se tem `amaterasu`, pode adicionar `kagutsuchi` como evolução opcional (RAW p. 183 explicitamente permite isso).

### 3. subTechnique compartilhada entre effects

`kamui_teletransporte` aparece em ambos `kamui_curto` e `kamui_longo` com flag `sharedAcrossKamuiEffects: true`. Motor deve dedup — se jogador tem ambos os Kamuis, conta como uma única capacidade. Padrão alternativo (effect separado) descartado por inflar power virtual sem ganho semântico.

Documentado em SCHEMA-PATTERNS §9.

### 4. variants no effect universal (Energizar, Canhão)

`Energizar Venenoso` (Dokujutsu) e `Pistola D'Água` (Suika) NÃO são effects novos — são modificadores do effect universal quando aptidão/power específico está presente. Modelados em `rules.variants.{aptidao_ou_power}`. Motor lê variants e aplica overrides se condição satisfeita. Documentado em SCHEMA-PATTERNS §9.

### 5. Refator de Mímica Sharingan e Reverter Ilusão

Versões originais em `aptitudes-clan-restricted.json` tinham fields amorfos (`effects.mimicaSharingan` no Nidan, `effects.reverterIlusao` no Sandan). Convertidos pra `effects.subTechniques[]` com `subType` apropriado (`active_reaction`, `active_ability`) conforme SCHEMA-PATTERNS §5.

Conteúdo factual idêntico ao anterior — apenas estrutura padronizada. Declarado em `_meta.intentionalUpserts: ["nidan_sharingan", "sandan_sharingan"]` pro validador demover colisão de `error` → `info`.

### 6. Hipnose Sharingan como aptidão separada

RAW p. 186-187: Hipnose é técnica desbloqueada pelo Sandan, NÃO pelo Mangekyou. Pré-req: Sandan + Fascinar + Ilusão Profunda. Por isso modelada como aptidão dedicada (`hipnose_sharingan`) com 9 subTechniques (os 9 modos: Conseguir Informação, Alterar Atitude, Nocautear, Paralisar, Controlar Mente, Controlar Bijuu [PdM], Roubar Técnica, Falsa Morte, Sobrepor Genjutsu).

Sandan Sharingan declara `effects.unlocks: ["hipnose_sharingan"]` como hint pra UI mostrar a aptidão como opção.

### 7. Sessão anterior errou ao descartar "Suika expandido"

Na auditoria pré-7e, a primeira análise (lendo só p. 10-11 do Hijutsus) concluiu que "Suika expandido é narrativa sem base". **Erro factual.** A seção do Suika continua na p. 12-13 com 4 effects exclusivos (Braço de Água, Afogar, Monstro de Água, Clone de Óleo) + Pistola D'Água embutida na descrição da aptidão. Item #12 da lista de próximos lotes tinha base.

Lição registrada no `_meta.userNarrativeRectification` do `effects-suika.json`. **Sempre leia ao menos 4 páginas além da seção principal** quando o conteúdo for de Hijutsu — eles tendem a ter "efeitos exclusivos" listados em sub-seção logo após.

### 8. "Areia Especial Venenosa" não existe no RAW

Confirmado p. 53-54 (Jiton) e p. 201-202 (Dokujutsu). Não há tal técnica. A confusão era com **Projétil Venenoso** (Jiton Nv 5, p. 54) — já modelado em `effects-jiton.json`. Sem ação necessária.

### 9. Erros de validador pré-existentes (NÃO bloqueiam 7e)

Validador Python detectou 12 PRE-REQ MISSING + 7 GRANTS SEM BYPASS = 19 erros, **TODOS de débito anterior**:
- 12 referências cruzadas a aptidões/powers nomeados em formato divergente (ex: `guerreiro_pesadas`, `hibon_ninpou`, `maestria_fuuton`, `armadura_de_raios`, `perito_medicina`, `pericia_inata_medicina`, `clone_moku_bunshin`, `resistencia_maior_vigor`, `usar_arma_leque_gigante`) — provavelmente devem virar refs parametrizadas ou ajuste de naming convention.
- 7 grants sem bypass: `rinkaichuu`, `presa_de_prata`, `vontade_do_fogo`, `lamina_da_lua`, `juuinka_ni`, `mestre_dos_selos`, `dominio_do_raio` — item #16 da lista do user (que listava 6; descobri 1 a mais).

Esses devem virar Task #15 (cleanup pré-Fase 7). **Lote 7e introduziu ZERO novos erros.**

## 🧪 Validação

```bash
cd prisma/seed-data
python3 /tmp/validator.py  # script ad-hoc — pode portar pra scripts/ depois
```

Resultado esperado pós-aplicação:
- Aptitudes: 161 (era 160 + hipnose_sharingan)
- Powers: 40 (era 39 + mangekyou_sharingan)
- Effects: 148 (era 138 + 6 mangekyou + 4 suika)
- Equipments: 149 (sem mudança)
- Erros novos: 0
- Upserts intencionais detectados: 7 (nidan_sharingan, sandan_sharingan, congelamento, artesao_de_ossos, burro_de_carga, furtividade_agil, usar_armaduras_pesadas)

## 📋 Prompt pro Claude Code

> Aplicar lote 7e (Sharingan stack + Suika expandido + patch Dokujutsu) no banco do Arcana Forge. Arquivos JSON já estão em `prisma/seed-data/`. `prisma/seed.ts` já foi atualizado com novos arquivos em `POWER_FILES`, `EFFECT_FILES` e `APTITUDE_FILES` na ordem correta (upserts depois dos originais).
>
> Antes de rodar `pnpm prisma db seed`:
> 1. Confirmar que Postgres está rodando (`docker ps | grep arcana-forge-db`).
> 2. Rodar `pnpm prisma generate` se schema mudou (não mudou neste lote).
> 3. Backup do banco (opcional pra dev local): `docker exec arcana-forge-db pg_dump -U postgres arcana_forge > /tmp/pre-7e-backup.sql`.
>
> Rodar:
> ```bash
> pnpm prisma db seed
> ```
>
> Verificar via Prisma Studio (`pnpm prisma studio`):
> - `aptitudes` deve ter 161 entries (filtrar por `code IN (mangekyou_sharingan, nidan_sharingan, sandan_sharingan, hipnose_sharingan)` — 4 entries com `effects.subTechniques` populado nos 3 últimos).
> - `powers` deve ter 40 entries (filtrar por `code = mangekyou_sharingan` — confirmar `rules.isVirtualPower: true`).
> - `power_effects` deve ter 148 entries (filtrar por `code IN (tsukuyomi, amaterasu, kagutsuchi, kamui_curto, kamui_longo, susanoo)` — 6 com `availableFor: ["mangekyou_sharingan"]`).
>
> Se algo falhar, rollback: `psql ... < /tmp/pre-7e-backup.sql`.

## 🔗 Próximo passo

Task #8 — 7e Jinchuuriki base (power-pai dos 4 Bijuu Hijutsus já modelados: `aoi_katon`, `sanbi_suiton`, `yonbi_youton`). Sistema de níveis 1-10 com Chakra Bijuu, Manto/Modo/Forma Bijuu, Bijuudama, Disparo de Chakra. Fonte: Livro de Hijutsus + Livro Básico p. 213.

⚠️ Lembrete: o validador acusou refs órfãs `jinchuuriki` em 4 powers (aoi_katon, sabaku_hijutsu, yonbi_youton, sanbi_suiton). Esses estão declarados em `_meta.unmodeledPowers` dos respectivos arquivos — vão ser resolvidos quando 7e seguinte modelar Jinchuuriki.

---

## 🧹 Pós-lote — cleanup do validador (mesma sessão, "corrigir erros introduzidos")

Após o lote principal, o validador acusou 19 erros — re-auditados por origem:

### Schemas improvisados meus no 7e1 (corrigidos)

3 entries do `effects-mangekyou-sharingan.json` usavam vocabulário fora do SCHEMA-PATTERNS §2:
- `kamui_curto` e `kamui_longo`: `powers_one_of_min8` improvisado → refatorado pra `powers_one_of` canônico com dict `{power: 8}` em todos os 17 ninjutsus aceitáveis.
- `susanoo`: `effectsAllRequired` improvisado → refatorado pra `alternatives` com 3 caminhos válidos (cada par do Mangekyou).

⚠️ Lição: improvisar campo é violação direta da regra "não inventar campo novo" do SCHEMA-PATTERNS. Deveria ter consultado §2/§3 antes de escrever.

### Grants sem bypass (Task #16 do user — 7 aptidões)

`grantsBypassesPrereq: true` + Note explicativa adicionados em:
- `aptitudes-clan-restricted.json`: rinkaichuu, presa_de_prata, vontade_do_fogo, lamina_da_lua, juuinka_ni
- `aptitudes-common-combat.json`: mestre_dos_selos
- `aptitudes-meta-shinobi.json`: dominio_do_raio (a 7ª — user listou 6 originalmente)

Notas distinguem: grants que são aptidões reais (vontade_do_fogo → duro_de_matar), refs parametrizadas (mestre_dos_selos → perito_X), conditions (juuinka_ni → acelerado), e benefícios derivados (dominio_do_raio → critico_aprimorado_para_efeitos como string).

### Refs parametrizadas pré-existentes (declaradas como dormentes)

10 strings `<aptidao>_<param>` que não batem com nenhum code real. Declaradas em `_meta.unmodeledAptitudes` dos arquivos respectivos com nota canônica do padrão:
- `aptitudes-manuevers.json`: guerreiro_pesadas, guerreiro_longas
- `effects-fuuton.json`: maestria_fuuton, usar_arma_leque_gigante
- `effects-iryou.json`: perito_medicina, pericia_inata_medicina
- `effects-mokuton.json`: clone_moku_bunshin
- `powers-orphans.json`: resistencia_maior_vigor

⚠️ **Dívida técnica explícita**: o vocabulário `<aptidao>_<param>` não está em SCHEMA-PATTERNS §2. Motor de regras precisará interpretar split do sufixo, ou refatorar pra objeto `{aptitude, parameter}`. Decisão pra próxima sessão de motor.

### Dívidas REAIS (lote futuro — Task #15)

- `armadura_de_raios` — aptidão Hijutsu de Nintaijutsu (Livro de Hijutsus p. 64-65, 3 níveis evolutivos). Declarada em `effects-hachimon.json:unmodeledAptitudes`.
- `hibon_ninpou` — power Restrito variante do Ninpou (Livro Básico p. 212-213). Declarada em `aptitudes-meta-shinobi.json:unmodeledPowers`.

Não modeladas hoje porque cada uma exige leitura completa de capítulo. Modelar quando Nintaijutsu (Task #13) e Hibon entrarem no escopo.

### Validador final

**Aptitudes: 161, Powers: 40, Effects: 148, Erros: 0. ✅**
