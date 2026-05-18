# Arcana Forge — Roadmap & Backlog Operacional

**Última atualização:** 2026-05-16 (pós-F2.1 — motor de regras com vocabulário expandido)

Este arquivo é o **guia operacional** pra execução via Claude Code. A spec oficial (`arcana-forge-spec/06-MVP-ROADMAP.md`) é a fonte de verdade do **escopo**; este arquivo é a fonte de verdade da **ordem de execução, estimativas atualizadas, e dívidas técnicas catalogadas**.

Diferença prática:
- **Spec** = "o que precisa existir no MVP".
- **Backlog** = "o que fazer agora, em que ordem, com que contexto".

---

## 🎯 Estado atual (snapshot)

✅ **F0 Bootstrap** — feito (Next 14 + TS + Tailwind + Prisma + Firebase Auth)
✅ **F1 Auth** — feito (login Google, middleware, sessão, navbar)
✅ **F2.1 Motor de regras** — feito (15 módulos, ~260 testes incluindo F2.1.x)
✅ **F2.2 Schema completo** — feito (migrations + 8 entidades)
✅ **F2.3 Seed de catálogos** — feito (Fase 7 completa: 180 aptidões, 47 powers, 186 effects, 151 equipamentos)

🟡 **F2.4 Wizard de criação** — não iniciado
🟡 **F2.5 Ficha view** — não iniciado
🟡 **F2.6 Editor da ficha** — não iniciado

⚫ **F3 Uso em mesa** — não iniciado
⚫ **F4 Compartilhamento & polish** — não iniciado

---

## 🔥 P0 — Próximas 1-2 semanas (DESBLOQUEIA UI)

### P0.1 — Validação do motor pós-Fase 7 (1 dia)

**Contexto:** F2.1.x adicionou vocabulário expandido (`*_one_of`, `effects`, `narrative`, `alternatives`, refs parametrizadas). 49 testes em `aptitudes.test.ts`. Não foi rodado em ambiente real ainda.

**Tarefas:**
1. `pnpm test` — todos os 260+ testes verdes
2. `pnpm typecheck && pnpm lint`
3. Se algum teste pré-existente quebrou: investigar e corrigir
4. Adicionar teste de integração: carregar TODAS as aptidões do banco e rodar `checkAptitudePrerequisites` com fixture vazia — não pode lançar exceção em nenhuma

**Critério de aceite:**
- [x] `pnpm test` verde (427 testes)
- [x] Toda aptidão do banco roda sem exceção pelo motor (180+ aptidões)
- [x] Cobertura `src/domain/rules/aptitudes.ts` ≥ 90% (92.83% lines / 91.95% branches / 100% funcs)

**Arquivos:**
- `tests/unit/domain/aptitudes.test.ts`
- `tests/integration/aptitude-coverage.test.ts` ✅ (criado)

**Dependências:** nenhuma.

**Status:** ✅ concluído 2026-05-16. Achados documentados em DT.3 (4 schemas improvisados conhecidos: `ponto_cego.skills_one_of`, `clone_verdadeiro.aptitudeChoiceCondition`, `clone_perfeito.evolution`, `replica_enganadora.aptitudes_alternative` — allow-listed no teste com referência cruzada).

---

### P0.2 — Wizard de criação de personagem (4-5 dias)

**Contexto:** spec F2.4 em `06-MVP-ROADMAP.md:160`. **Esta é a fase onde o motor é validado no fluxo real.** Bugs vão aparecer aqui — bom!

**Tarefas:**
1. Rota `/characters/new` com 4 steps:
   - Step 1: Identificação (nome, NC inicial, vila, clã, KG)
   - Step 2: Atributos (8 pontos a distribuir conforme NC, validar limites)
   - Step 3: Perícias (NC×4 pontos, validar limites)
   - Step 4: Aptidões iniciais + Poderes (com pré-reqs checados em tempo real)
2. Server Action `createCharacter(input)` com validação Zod ESPELHANDO a regra do motor
3. Apply automático de benefícios:
   - Aptidões grátis do clã
   - Níveis grátis de poderes (Hyouton → +1 Fuuton/Suiton)
   - Aptidões grátis do KG
4. Redirect pra `/characters/[id]/edit` no final

**Critério de aceite:**
- [x] User cria Satsuki NC 6 em < 5 min — wizard pronto (teste manual no browser pendente)
- [x] Tentar gastar acima do budget = bloqueado com mensagem clara — motor + UI cobrem (banner + badge vermelho)
- [x] Aptidão sem pré-req = bloqueada com pré-req faltante listado — `AptitudePicker` mostra checks via `PrereqList`
- [x] Aplicar Hyouton concede +1 Fuuton + +1 Suiton automaticamente — `applyOriginBenefits` testado (7 tests)
- [ ] Mobile responsivo (testar em 375px e 768px) — pendente teste manual

**Status:** 90% feito 2026-05-16. Wizard end-to-end implementado (Dias 1-4): schemas, applyOriginBenefits, 5 steps, server action transacional. Pendentes: redirect pra `/characters/[id]` quebrado até P0.3 entregar; teste E2E Satsuki + teste manual no browser. Decisão de seguir pra P0.3 antes do E2E.

**Arquivos esperados:**
- `src/app/(app)/characters/new/page.tsx`
- `src/app/(app)/characters/new/steps/*.tsx` (4 componentes step)
- `src/server/actions/characters/create.ts`
- `src/schemas/character/create.ts` (Zod)
- `src/lib/character/applyOriginBenefits.ts`

**Dependências:** P0.1 (motor validado).

---

### P0.3 — Ficha view read-only (4-5 dias)

**Contexto:** spec F2.5 em `06-MVP-ROADMAP.md:177`. Componentes em `05-UI-SPEC.md`.

**Tarefas:**
1. Rota `/characters/[id]` (server component, fetch via Prisma)
2. Layout dark+ice conforme `08-VISUAL-REFERENCE.md` + `reference/satsuki-ficha-reference.html`
3. Componentes mínimos (sem edição):
   - `<FichaHeader>`, `<HeroSection>`, `<AttributesGrid>`, `<EnergyBars>`
   - `<CombatSkillsBlock>`, `<AptitudesSection>`, `<PericiasGrid>`
   - `<JutsusGrid>`, `<CombatTable>`, `<InventoryBlock>`
   - `<CollapsibleSection>` wrapper
4. Estado de colapso em `Character.uiState` (já no schema?)
5. Imagens via `next/image` apontando pra `public/uploads/` (Phase local)

**Critério de aceite:**
- [ ] Renderiza Satsuki NC 6 idêntica ao `reference/satsuki-ficha-reference.html`
- [ ] Todos os derivados (CC, CD, ESQ, LM, Vit, Chakra) batem com motor
- [ ] Mobile: scroll vertical funciona, sem layout quebrado
- [ ] Colapsar/expandir seções funciona e persiste

**Arquivos esperados:**
- `src/app/(app)/characters/[id]/page.tsx`
- `src/components/character/*.tsx` (12+ componentes)
- `src/lib/character/mapToCore.ts` (Prisma row → CharacterCore)
- `src/styles/character.css` (se necessário)

**Dependências:** P0.2 (precisa de personagem criado).

---

### P0.4 — Editor da ficha (5-7 dias)

**Contexto:** spec F2.6 em `06-MVP-ROADMAP.md:188`. **Fase que mais valida o motor.**

**Tarefas:**
1. Rota `/characters/[id]/edit`
2. Mesma estrutura visual do view, com edição inline:
   - `<EditableValue>` (spinner +/- pra atributos, perícias, energias)
   - Pontos restantes em badge fixo (canto da tela)
3. Validação em tempo real:
   - Limite de atributos por NC (`attributeLimits`)
   - Budget de pontos (`pointsBudget`)
   - Pré-reqs de aptidões (`aptitudes`)
4. Auto-save com debounce 1s
5. Server Action `saveCharacterField(charId, field, value)` recalcula derivados
6. Modais:
   - `<AptitudePicker>` (filtros por categoria, busca, mostra pré-reqs cumpridos/faltantes)
   - `<JutsuEditor>` (escolher poder + efeito + custom nome)
7. **Crítico:** servidor recalcula derivados em cada save (não confia no client)

**Critério de aceite:**
- [ ] Editar atributo: vê Vit/CC atualizando em tempo real
- [ ] Gastar acima do budget: bloqueado com mensagem
- [ ] Adicionar aptidão sem pré-req: bloqueado com pré-req faltante listado
- [ ] Criar jutsu customizado (Hyouton + Canhão + nome "Mil Agulhas de Gelo") funciona
- [ ] Auto-save funciona (verificar via Network tab que faz PUT a cada 1s)
- [ ] Recarregar página: estado preservado

**Arquivos esperados:**
- `src/app/(app)/characters/[id]/edit/page.tsx`
- `src/components/character/edit/*.tsx`
- `src/components/character/modals/{AptitudePicker,JutsuEditor}.tsx`
- `src/server/actions/characters/save-field.ts`

**Dependências:** P0.3.

---

### P0.5 — Dashboard com lista de fichas (2 dias)

**Contexto:** spec F1.2 já mencionou. Atualmente é vazio.

**Tarefas:**
1. `/dashboard` lista fichas do user (query Prisma com paginate)
2. Card por ficha: avatar, nome, NC, vila, última atualização
3. CTA "Criar nova ficha" → `/characters/new`
4. Ação delete (com confirmação)
5. Filtros: por NC, por vila, busca por nome

**Critério de aceite:**
- [ ] Usuário com 0 fichas vê empty state + CTA
- [ ] Usuário com 10+ fichas vê grid responsivo
- [ ] Delete funciona com confirmação modal
- [ ] Soft delete (campo `deletedAt`, query filtra)

**Arquivos:**
- `src/app/(app)/dashboard/page.tsx` (já existe vazio)
- `src/components/dashboard/CharacterCard.tsx`
- `src/server/actions/characters/delete.ts`

**Dependências:** P0.2.

---

## 🟡 P1 — Próximas 2-4 semanas (FECHA MVP CORE — F3)

### P1.1 — Calculadora de jutsus (3-4 dias)

Spec F3.1 (`06-MVP-ROADMAP.md:215`).

- `<JutsuModal>` com tabs (nível usado, custo, alvos, modificadores)
- `useJutsu(jutsuId, levelUsed, mods)` Server Action
- Deduz chakra na hora
- Estados visuais (chakra esgotado = exausto)

**Critério de aceite:**
- 5 cenários canônicos validados contra o livro (Canhão Hyouton, Espelhos Demoníacos, Bijuudama Kurama, etc.)

---

### P1.2 — Tomar dano / curar (2 dias)

Spec F3.1 cont.

- `<TakeDamageModal>` (clique na barra de Vit)
- `<RestoreModal>` (+ recuperar)
- Estados: vit ≤ 0 = fora de combate; vit ≤ -10 = morrendo; vit ≤ -20 = morto

---

### P1.3 — Sistema de subida de NC (4-5 dias)

Spec F3.2.

- Rota `/characters/[id]/levelup`
- Usa `leveling.ts` do motor (`getLevelUpDelta`)
- UI guiada: mostra pontos ganhos, alertas de mínimo
- Server Action `finalizeLevelUp()`

**Critério de aceite:** Satsuki NC 6 → 7 funciona (caso real validado).

---

### P1.4 — Diário (4-5 dias)

Spec F3.3.

- Aba `<DiarySection>` dentro da ficha
- CRUD com markdown editor + preview
- Filtro por tag
- `react-markdown` + `remark-gfm`

---

### P1.5 — Upload de imagens (3-4 dias)

Spec F3.4. ⚠️ **Atenção:** spec original assume Supabase Storage, mas CLAUDE.md diz "phase local = `public/uploads/` filesystem". Confirmar antes de implementar.

- Route handler `/api/upload`
- Reencode WebP via `sharp`
- Galeria no editor da ficha
- Slot selector

---

## 🟢 P2 — Próximas 4-8 semanas (POLISH + LANÇAMENTO)

### P2.1 — Compartilhamento público (3-4 dias)

Spec F4.1. Link público read-only.

### P2.2 — Settings completo (2 dias)

Spec F4 polish. Editar perfil, deletar conta, exportar dados (LGPD).

### P2.3 — Testes E2E críticos (3-4 dias)

Playwright. 5 fluxos: login → criar ficha → editar → usar jutsu → compartilhar.

### P2.4 — Performance + acessibilidade (3-4 dias)

Lighthouse > 90 em todas as métricas. WCAG AA mínimo.

### P2.5 — Deploy produção (2-3 dias)

Sair de localhost. Postgres na Supabase, Storage Supabase, Vercel deploy.

---

## ⚪ P3 — Pós-MVP (não bloqueia lançamento)

- **Edo Tensei** se aparecer fonte canônica (não modelado por falta de RAW)
- **Sumi/Kumo/Hebi Ninpou refino** (sem fonte detalhada hoje)
- **Outros sistemas RPG** (D&D, Tormenta) — v3+
- **Multiplayer / Mesa virtual integrada** — fora do escopo MVP

---

## 🐛 Dívidas técnicas catalogadas

### DT.1 — Refs parametrizadas como split runtime

**Estado:** motor (`aptitudes.ts`) faz split em runtime via `splitParameterizedAptitude`. Funciona, mas:

- Lista de bases hardcoded em `PARAMETERIZABLE_APTITUDE_BASES`
- 11 refs declaradas em `_meta.unmodeledAptitudes` dos arquivos seed (legado da Fase 7)

**Proposta de cleanup:** refator do schema seed pra objeto `{aptitude, parameter}` em vez de string composta. Atualiza validador + motor. ~1 dia. **Baixa prioridade** — não bloqueia nada.

---

### DT.2 — Validador Python ad-hoc

**Estado:** validador da Fase 7 é script Python `/tmp/validator.py` que não está versionado. `scripts/validate-seed-data-extended.ts` existe mas requer tsx (sandbox não rodava).

**Proposta:** portar validador pra TypeScript em `scripts/validate-seed-data.ts` e adicionar ao `pnpm test` ou `pnpm validate`. ~3h.

---

### DT.3 — Schemas improvisados em prereqs

**Estado:** 4 schemas improvisados detectados pelo teste de cobertura P0.1 e **corrigidos em 2026-05-16** (`ponto_cego.skills_one_of` → `alternatives`; `clone_verdadeiro.aptitudeChoiceCondition` → `aptitudes_one_of:[clone_kage_bunshin, clone_moku_bunshin]`; `clone_perfeito.evolution` removido; `replica_enganadora.aptitudes_alternative` → `aptitudes`). Teste de integração agora bloqueia novas chaves fora do vocabulário canônico.

**Restante (defesa em profundidade):** adicionar Zod schema em `src/schemas/seed/prerequisites.ts` que valida o JSONB de pré-reqs no validador (`scripts/validate-seed-data.ts`) — atualmente o teste de cobertura só pega refs usadas em `aptitudes-*.json`, não em `evolutions[].prerequisites` nem em `effects/powers`. ~4h. **Prioridade baixa** agora que o gap imediato fechou.

---

### DT.4 — 7 técnicas Nintaijutsu em arquivo errado (já corrigido)

Histórico — Elbow/Straight/Lariat/Hell Stab/Guillotine Drop/Linger Bomb/Reverse Chop estavam em `effects-hachimon.json`. Movidos pra `effects-nintaijutsu.json` no lote 7j. **Cobertura preventiva:** P0.1 deve adicionar teste que valida que cada effect tem `availableFor` apontando pro power correto via cross-check com tabela de bases canônicas.

---

### DT.5 — `seed.ts` reconstruído (cuidado)

`seed.ts` foi truncado por bug do Write tool e reconstruído manualmente (`seedEquipment()` foi recriada do zero, não está em git). Próximo commit deve garantir que o arquivo está OK.

**Ação:** rodar `pnpm prisma db seed` em DB limpo + diff contra um dump conhecido. Se passou, commitar.

---

### DT.6 — `learnedEffects` / `narrativeFlags` no Prisma

**Estado:** `CharacterCore` tem os campos novos, mas o **Prisma schema NÃO**. Quando salvar no banco, esses campos não persistem.

**Proposta:**
```prisma
model Character {
  ...
  learnedEffects String[]  // array de codes
  narrativeFlags String[]  // array de flags
  ...
}
```

Migration `add_learned_effects_and_narrative_flags`. Atualizar mapper Prisma → CharacterCore. **Bloqueia P0.4 (editor)** se quiser que esses campos persistam. Estimativa: 1h.

---

## 🚦 Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Motor não cobre todas as aptidões da Fase 7 em fluxo real | P0.1 cria teste de cobertura full |
| Refator necessário no schema durante F2.4-F2.6 | Esperar quebra real antes de refatorar |
| Performance em listar 180 aptidões no `<AptitudePicker>` | Server component + paginate/filter no servidor |
| Mobile UX da ficha (muitos campos) | Spec já manda `<CollapsibleSection>` — usar e testar cedo |
| Catálogo de aptidões fica defasado se novas vierem | Seed é idempotente — rodar `prisma db seed` aplica |
| Bug do Write tool truncando arquivos | Pra arquivos >15KB usar `cat > file << EOF` + heredoc bash |

---

## 📋 Como Claude Code deve usar este backlog

1. **Sempre começar lendo este arquivo + a spec relevante** (link na seção).
2. **Antes de produzir código novo:** rodar `pnpm test && pnpm typecheck && pnpm lint` pra ver o estado real.
3. **Antes de mudar schema Prisma:** consultar `03-DATA-MODEL.md` e fazer migration nomeada.
4. **Antes de mudar tipos de domínio:** consultar `src/domain/types/` e checar se há quebra em testes.
5. **Cada PR fecha 1 item do backlog.** Marcar com `- [x]` aqui.
6. **Achou dívida técnica?** Adicionar em DT.N e tratar como item separado.
7. **CLAUDE.md** tem convenções de código + comandos comuns + decisões "não revisitar". Sempre respeitar.

---

## 🔗 Referências cruzadas

- Spec congelada: `arcana-forge-spec/` (00 a 08)
- Convenções de código: `CLAUDE.md`
- Padrões de seed: `prisma/seed-data/SCHEMA-PATTERNS.md`
- READMEs de lotes (histórico): `prisma/seed-data/tmp/lote-*-README.md` + `FASE-7-COMPLETA-README.md`
- Reference visual: `arcana-forge-spec/reference/satsuki-ficha-reference.html`
