# Schema Patterns — Seed Data do Arcana Forge

Convenções estabelecidas pela Fase 7. **Aderir antes de criar novos lotes.**

Toda decisão aqui foi forjada em erro real cometido em sessão anterior. Se queres reabrir uma decisão, faça-o com proposta concreta e documente em SESSION-LOG.md.

---

## 1. Estrutura mínima de `_meta`

Toda `*.json` de seed precisa:

```jsonc
{
  "_meta": {
    "description": "Lote X — propósito em 1-2 frases. Cita gap fechado, divergências da narrativa.",
    "sources": ["Livro X p. Y-Z (capítulo)", ...],   // OBRIGATÓRIO: páginas exatas
    "extractedAt": "YYYY-MM-DD",
    "schemaVersion": 1,
    "appliesToTable": "aptitudes",                   // aptitudes | powers | equipments | ...
    "expectedItemCount": 7,                          // pra validador conferir
    "intentionalUpserts": ["code1", "code2"],        // se há colisão de code com lote anterior
    "intentionalUpsertsNotes": "explicar por que.",
    "unmodeledPowers": [],                           // refs dormentes intencionais (escape hatch)
    "unmodeledAptitudes": []
  },
  "data": [...]
}
```

Campos opcionais úteis quando aplicáveis: `userNarrativeDivergence`, `subTypeDiscriminator`, `nameCollisionsAcrossTables`, `phase7Closure` (ou similar).

---

## 2. Pré-requisitos — vocabulário canônico

Top-level em `entry.prerequisites` (aptidões) OU em `entry.rules.prerequisites` (powers/effects).

| Chave | Tipo | Significado |
|---|---|---|
| `type` | string | Discriminador de Hijutsu (ex: `"hijutsu_samurai"`, `"hijutsu_juuinka"`) |
| `clans` | string[] | Personagem precisa ser de TODOS os clãs listados (geralmente 1) |
| `clans_one_of` | string[] | Aceita QUALQUER um dos clãs |
| `aptitudes` | string[] | Aptidões pré-requeridas (todas) |
| `aptitudes_one_of` | string[] | Aceita qualquer uma |
| `powers` | `Record<code, minLevel>` | Powers com nível mínimo |
| `attributes` | `Record<attrCode, minValue>` | TODOS os atributos com mínimo |
| `attributes_one_of` | `Record<attrCode, minValue>` | Qualquer um |
| `skills` | `Record<skillCode, minLevel>` | Perícias com mínimo |
| `combatSkills_one_of` | `Record<csCode, minLevel>` | CC/CD/ESQ/LM com mínimo (qualquer um) |
| `narrative` | string | Pré-req narrativo (ex: `"sobrevivido_ao_juuin_jutsu"`) |
| `mutuallyExclusiveWith` | string[] | Symmetric. Personagem não pode ter BOTH |
| `incompatibleWith` | string[] | Unidirecional. Não pode ter ESTE se já tem aquele |
| `alternatives` | `Alternative[]` | Multi-caminho de pré-requisitos compostos (ver §3) |

**❌ NUNCA usar:** `aptidoes`, `pre_requisitos`, `poderes`, `pericias`, `atributos`, `habilidades` (validador linha 313-327 quebra). Tudo em inglês.

---

## 3. Multi-caminho de pré-req: `alternatives`

Quando há múltiplos caminhos pra cumprir o pré-req (ex: Senjutsu via Kuchiyose OU Mokuton). **NÃO usar** `powers_one_of` com chaves descritivas (schema legado, banido).

```jsonc
"prerequisites": {
  "attributes": { "vig": 14 },           // requirements globais (AND)
  "alternatives": [                       // qualquer uma das alternativas (OR)
    {
      "name": "modo_eremita_kuchiyose",   // identificador semântico
      "description": "Acesso via Sapos ou Cobras.",
      "powers": { "kuchiyose": 8 },
      "aptitudes": ["resistencia_maior_vigor"],
      "kuchiyoseRestriction": ["sapos", "cobras"]
    },
    {
      "name": "modo_eremita_mokuton",
      "description": "Acesso via Mokuton.",
      "powers": { "mokuton": 8 },
      "aptitudes_one_of": ["resistencia_maior_vigor", "regeneracao"]
    }
  ]
}
```

Validador percorre cada alternativa como prereqs aninhados (mesmas chaves do §2).

---

## 4. `grants` + `grantsBypassesPrereq` — SEMPRE JUNTOS

Quando uma aptidão concede OUTRA aptidão grátis (sem o personagem precisar comprar), declare ambos:

```jsonc
"effects": {
  "type": "armor_proficiency_with_grant",
  "grants": ["usar_armaduras_pesadas"],       // codes das aptidões concedidas
  "grantsBypassesPrereq": true,               // SEMPRE true se há grants
  "grantsBypassesPrereqNote": "Por quê. Geralmente: a aptidão pai já filtra atributo mais relaxado, então concede sem revalidar."
}
```

**Regra do motor:** `grants` é concessão direta — NÃO revalida pré-req da aptidão concedida.

Padrões reais no banco: `armadura_samurai` → `usar_armaduras_pesadas`; `armadura_ossea` → `duro_de_matar`; `yanagi_no_mai` → `retirada_rapida, trespassar_nv_2`; `demonio_do_vento` → `usar_arma_fuuma_shuriken, especialista_armas_de_arremesso`.

---

## 5. `subTechniques` — discriminator obrigatório

Sub-técnicas que NÃO são aptidões compradas separadamente mas pertencem a aptidão pai (ex: Aparar Lâmina dentro de Espadachim, Hadan dentro de Issen, Teshi Sendan dentro de Artesão de Ossos).

Cada entry em `effects.subTechniques[]` DEVE ter `code`, `name`, `description` e `subType`.

| `subType` | Quando usar |
|---|---|
| `passive_buff` | Sempre ativo enquanto aptidão pai está comprada (Especialista em Espadas) |
| `reactive_buff` | Modifica uma reação específica (Aparar Lâmina no Bloqueio) |
| `conditional_buff` | Aplicável em contexto específico (Corte Rápido após sacar) |
| `active_ability` | Ação consciente sustentada (Lâmina de Chakra) |
| `active_attack` | Ataque que consome recurso (Corte de Chakra, Teshi Sendan) |
| `active_reaction` | Reação a ação inimiga (Hadan, Seguir Passo) |
| `weapon_creation` | Cria arma temporária (Arma-Presa) |

**❌ NÃO usar** `subTechniques` pra MODOS alternativos da mesma aptidão. Use `effects.modes.{nome1, nome2}` (ex: Karamatsu defensivo + ofensivo).

---

## 6. UPSERT cross-arquivo

Quando um lote refina aptidão/equipamento que já existe em outro arquivo:

1. Declarar em `_meta.intentionalUpserts: ["code1", ...]`
2. Adicionar `_meta.intentionalUpsertsNotes` explicando o que mudou
3. Garantir ORDEM correta em `prisma/seed.ts` — arquivo do upsert vem DEPOIS do arquivo original
4. Validador demove colisão de `error` → `info` automaticamente

Exemplos: `congelamento` (7d sobrescreve 5b), `artesao_de_ossos` (7c sobrescreve 5b), `usar_armaduras_pesadas` (6-patches sobrescreve 5a).

---

## 7. Refs órfãs (escape hatch)

Se um arquivo referencia um power/aptidão que **ainda não existe** mas vai existir em lote futuro:

```jsonc
"_meta": {
  "unmodeledPowers": ["jinchuuriki"],
  "unmodeledPowersNotes": "Power-pai dos 4 Bijuu Hijutsus. Catalogado no lote 7e."
}
```

Validador demove de `error` → `info`. **NÃO abuse** — escape hatch é pra dívida técnica EXPLÍCITA, não pra typos.

---

## 8. Citação de fontes — SEMPRE página exata

```jsonc
"description": "...regras detalhadas. Fonte: Livro de Hijutsus p. 33-35."
```

Página intervalar ou unitária. Pra revisão humana e pra auditoria de erro factual (lição aprendida: `aoi_katon` teve 2 erros factuais porque eu inferi do "padrão" em vez de ler `p. 33-35` completo).

---

## 9. Decisões aceitas que não revisitar (RAW)

- **Acuidade NÃO afeta dano de CC** (regra do livro, decisão consciente).
- **Round up exceto limite de poder/perícia (round down).**
- **Effects.availableFor é FK lógica, não Prisma** — sem constraint, validador checa.
- **Codes podem coexistir entre tabelas** (`senjutsu` é Aptidão E Power; `mokuton` é KG E Power; `sharingan` é KG E Aptidão). Motor resolve pelo contexto.
- **JSONB amorfo com discriminador** — schema flexível, validações são em código de motor, não Prisma.
- **Power virtual sem progressão (introduzido em 7e1)** — alguns powers servem só de gateway pra effects (ex: `mangekyou_sharingan`). Estes declaram `rules.isVirtualPower: true` + `stats.noLevelProgression: true` + `stats.fixedLevelForDifficulty: N`. Effects do power têm `minLevel` igual ao fixedLevel. Motor de regras precisa pular validação de "nível N do poder X" — basta o jogador ter o power. Pré-req do power é apenas a aptidão homônima.
- **subTechniques compartilhadas entre effects (introduzido em 7e1)** — caso Teletransporte do Kamui aparece em `kamui_curto` E `kamui_longo`. Cada cópia tem `sharedAcrossKamuiEffects: true`. Motor deve dedup no runtime — se jogador tem ambos os effects, só conta uma capacidade. Padrão alternativo seria criar 3º effect — descartado por inflar power virtual.
- **variants dentro de effect universal (introduzido em 7e0/7e2)** — Energizar tem `rules.variants.dokujutsu` (Energizar Venenoso); Canhão tem `rules.variants.suika` (Pistola D'Água). Variantes não criam effects novos — apenas modificam regras quando aptidão/power específico está presente. Motor lê `variants[X]` e aplica overrides se condição satisfeita.

---

## 10. Tamanho de arquivo

⚠️ Não escrever JSON >17KB direto via Write tool (trunca silenciosamente). Use `bash + python json.dump`. Avisar no validador quando algum arquivo passar 15KB pra preparar a próxima vez.

---

## Checklist antes de salvar lote novo

- [ ] `_meta` tem todos os campos obrigatórios (§1)?
- [ ] Páginas citadas em todas as `description` (§8)?
- [ ] Prereqs usam vocabulário canônico (§2)?
- [ ] Se há `grants` → tem `grantsBypassesPrereq` (§4)?
- [ ] Se há `subTechniques[]` → cada uma tem `subType` (§5)?
- [ ] Se há colisão de code com arquivo anterior → declarado em `intentionalUpserts` (§6)?
- [ ] Refs órfãs declaradas em `unmodeled*` (§7)?
- [ ] `pnpm tsx scripts/validate-seed-data.ts` passou (zero errors)?
- [ ] Arquivo <17KB OU foi escrito via bash+python (§10)?
