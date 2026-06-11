# Prompt inicial — execução P0.1 (Validação do motor pós-Fase 7)

> Copie este prompt e cole no Claude Code numa **nova sessão** dentro do diretório `D:\Claude\arcanaforge`. O prompt é auto-suficiente — não depende de contexto de conversas anteriores.

---

## Início do prompt

Você é o assistente técnico do projeto **Arcana Forge** (plataforma open source MIT para fichas do RPG Naruto: Shinobi no Sho 4.1b). Next.js 14 App Router + TypeScript + Prisma + Postgres + Firebase Auth.

### 📂 Antes de tocar em código, leia nesta ordem:

1. **`CLAUDE.md`** (raiz) — convenções, comandos, decisões "não revisitar", gotchas.
2. **`BACKLOG.md`** (raiz) — roadmap operacional + dívidas técnicas. Item alvo: **P0.1**.
3. **`arcana-forge-spec/04-RULES-ENGINE.md`** — spec do motor de regras.
4. **`prisma/seed-data/SCHEMA-PATTERNS.md`** — vocabulário canônico de pré-requisitos.
5. **`src/domain/rules/aptitudes.ts`** — implementação atual do checker.
6. **`tests/unit/domain/aptitudes.test.ts`** — 49 testes existentes.

### 🎯 Tarefa: P0.1 — Validação do motor pós-Fase 7

A Fase 7 do seed adicionou 35 aptidões novas + 15 powers + 65 effects usando vocabulário de pré-reqs expandido (`*_one_of`, `effects`, `narrative`, `alternatives`, refs parametrizadas, `mutuallyExclusiveWith`). O motor foi atualizado pra cobrir tudo isso em `src/domain/rules/aptitudes.ts`, mas:

- Os 49 testes unit do checker rodam em fixtures inventadas, não contra o catálogo real.
- Não há garantia que cada uma das 180 aptidões do banco consegue ser **lida pelo motor sem exceção**.
- Não há cobertura medida.

#### Tarefas concretas

1. **Rodar a suíte completa**:
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```
   Reporte se algo está vermelho. Não comece a "consertar" tudo de uma vez — me mostre a lista primeiro.

2. **Criar teste de integração** em `tests/integration/aptitude-coverage.test.ts`:
   - Carrega TODOS os `aptitudes-*.json` de `prisma/seed-data/` via `loadSeedData()`
   - Para cada aptidão, monta uma fixture mínima de `CharacterCore` (NC 6, atributos 3, sem aptidões/powers)
   - Chama `checkAptitudePrerequisites(apt.prerequisites, character)` — **não pode lançar exceção em nenhuma**
   - Falha se algum `prerequisites.<chave>` é desconhecido (não bate com `AptitudePrerequisites` nem com refinements declarados em SCHEMA-PATTERNS)

3. **Medir cobertura** do módulo `src/domain/rules/aptitudes.ts`:
   ```bash
   pnpm test:coverage -- src/domain/rules/aptitudes.ts
   ```
   Reporte o número. Critério: ≥ 90%.

4. **Reportar achados** em formato resumido:
   - Quantos testes passaram / falharam
   - Quantas aptidões do banco têm chaves de pré-req desconhecidas pelo motor
   - Cobertura atual de `aptitudes.ts`
   - Qualquer surpresa

### 🚫 Regras de trabalho (do CLAUDE.md — leia o arquivo todo, isso é só lembrete):

- **Não improvise schema**. Vocabulário de pré-reqs canônico está em `SCHEMA-PATTERNS.md §2`.
- **Não suavize feedback**. Se o motor está quebrado, diga.
- **Strict TypeScript total** — zero `any` sem justificativa em comentário.
- **Antes de commitar:** `pnpm lint && pnpm typecheck && pnpm test`.
- **Não revisite decisões em "Decisões já tomadas"** do CLAUDE.md (acuidade não afeta dano CC, round up exceto limite de poder, etc.).
- **Bug do Write tool**: arquivos >15KB devem ser escritos via `cat > file << 'EOF'` + heredoc bash, não Write tool.

### 📊 Critério de aceite

- [ ] `pnpm test` verde (260+ testes)
- [ ] `pnpm typecheck` zero erros
- [ ] `pnpm lint` zero erros
- [ ] Novo teste de integração roda e passa pra **toda** aptidão do banco
- [ ] Cobertura `aptitudes.ts` ≥ 90%
- [ ] Relatório final em < 200 palavras

### 📝 Quando terminar

Marque P0.1 como `[x]` em `BACKLOG.md` e ofereça começar **P0.2 (Wizard de criação)** — leia o item completo no BACKLOG antes de prosseguir.

⚠️ **Cuidado especial:** P0.4 (editor) tem dependência em DT.6 (`learnedEffects`/`narrativeFlags` no Prisma) — se for atacar P0.2/P0.3 antes, tudo bem; se for P0.4, resolver DT.6 primeiro.

## Fim do prompt

---

## Notas sobre este prompt

- **Auto-suficiente:** sessão nova consegue executar sem precisar voltar.
- **Focado em UM item** (P0.1). Não tente mega-prompt — Claude Code performa melhor com escopo apertado.
- **Indica os próximos itens** mas não força sequência cega.
- **Lembretes críticos** (regras de trabalho) destacados.
- **Critério de aceite verificável** (checklist).

Quando P0.1 terminar, gere prompt similar pra P0.2 substituindo a seção "Tarefa".
