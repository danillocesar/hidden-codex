# CLAUDE.md

Este arquivo é seu contexto persistente para o projeto **Arcana Forge**. Ele é carregado automaticamente em toda sessão. Leia-o no início de cada conversa.

---

## ⚡ Resumo de 30 segundos

**Arcana Forge** é uma plataforma web open source para criar e gerenciar fichas de personagem do RPG **Shinobi no Sho 4.1b** (sistema brasileiro inspirado em Naruto). Stack: **Next.js 14 App Router + TypeScript + Prisma + Postgres + Firebase Auth + Tailwind + shadcn/ui**.

Especificação completa em `arcana-forge-spec/` (8 documentos + HTML de referência). **Leia a spec antes de mudanças significativas.**

---

## 🗺️ Documentos da spec — onde encontrar o quê

| Procurando... | Vai em... |
|---|---|
| Por que estamos construindo isso, personas, casos de uso | `arcana-forge-spec/01-VISION.md` |
| Stack, estrutura de pastas, padrões técnicos, env vars | `arcana-forge-spec/02-ARCHITECTURE.md` |
| Schema Prisma, tipos JSONB, relações | `arcana-forge-spec/03-DATA-MODEL.md` |
| Fórmulas de RPG (CC, dano, chakra, perícias), validações | `arcana-forge-spec/04-RULES-ENGINE.md` |
| Componentes UI, telas, fluxos, padrões visuais | `arcana-forge-spec/05-UI-SPEC.md` |
| Roadmap de fases (F0, F1, F2...), critérios de aceite | `arcana-forge-spec/06-MVP-ROADMAP.md` |
| Seed de catálogos do livro (aptidões, poderes, etc.) | `arcana-forge-spec/07-SEED-DATA-PLAN.md` |
| Estética visual real (cores, fontes, efeitos) | `arcana-forge-spec/08-VISUAL-REFERENCE.md` + `reference/satsuki-ficha-reference.html` |
| **Regra específica do sistema RPG não coberta na spec** | `books/` (ver seção "Livros do sistema" abaixo) |

**Regra:** se algo no código contradiz a spec, **a spec está certa** até prova em contrário. Se você acha que a spec está errada, levante a questão antes de divergir.

---

## 📖 Livros do sistema (consulta sob demanda)

A pasta `books/` contém os PDFs oficiais do **Shinobi no Sho 4.1b**:

| Arquivo | Quando consultar |
|---|---|
| `livro-basico-4.1b.pdf` | Regras core (atributos, perícias, combate, aptidões comuns, poderes elementais, equipamentos) |
| `livro-hijutsus-4.1b.pdf` | Técnicas secretas, kekkei genkais (Hyouton, Sharingan, etc.), Jinchuuriki, Senjutsu |
| `guia-avancado-4.1b.pdf` | Regras opcionais, expansões, casos avançados |

### ⚠️ Quando consultar os livros — regras estritas

A spec (00-08) cobre **o que precisamos pro MVP**. Os livros cobrem **o sistema inteiro**. Use os livros APENAS quando:

✅ **Pode consultar:**
- Aparece uma aptidão/poder/efeito que a spec não detalha o suficiente pra seedar
- Dúvida sobre regra específica de uma técnica (ex: "como funciona Ataque Pesado do Hachimon Tonkou?")
- Conflito aparente entre dois pontos da spec (livro é desempate)
- Precisa do texto exato de uma descrição pra colocar no banco (campo `description`)
- Validar uma fórmula que parece estranha ("será que CC realmente é Base+Atr?")

❌ **NÃO consulte para:**
- Decidir arquitetura (livros não falam de software)
- Refazer regras já documentadas em `04-RULES-ENGINE.md`
- Implementar features que não estão no MVP
- "Ah, deixa eu ver se tem algo legal aqui que daria pra adicionar" — escopo definido, não expanda

### Como consultar eficientemente

PDFs são grandes. **NÃO leia o livro inteiro** numa sessão. Estratégias:

1. **Busca direcionada por palavra-chave.** Se você tem ferramenta de search no PDF, use. "Acuidade", "Congelamento", "Ambidestria" — vai direto pra página relevante.
2. **Sumário primeiro.** Os livros têm sumário no início. Identifique seção, depois vá lá.
3. **Cite a página.** Quando documentar algo extraído do livro (commits, comentários, descrições no banco), inclua referência: "Livro Básico p. 87" ou similar. Facilita verificação humana.
4. **Não copie integralmente.** Texto do livro é copyright. Use como referência para entender a regra; escreva descrição própria em português claro pro banco.

### Quando o livro contradiz a spec

Acontece. A spec é interpretação, o livro é fonte. **Mas:**

1. **NÃO mude implementação sozinho.** Documente a divergência em `SESSION-LOG.md`.
2. **Continue seguindo a spec** até decisão humana.
3. **Razão:** algumas divergências são **intencionais** (decisões de produto), outras são erro da spec. Você não sabe diferenciar — eu sei.

Exemplo concreto:
- **Spec 04-RULES-ENGINE.md:** "Acuidade NÃO afeta dano (RAW)."
- **Livro Básico:** confirma RAW.
- **Spec:** ✅ correta, segue spec.

Outro exemplo hipotético:
- **Spec:** "Limite máximo de NC é 20."
- **Livro:** "Pode ir acima de 20 com fórmula contínua."
- **Ação:** documente no SESSION-LOG, **continue com 20 no código**, peça revisão humana.

---

## 🛠️ Comandos comuns

### Desenvolvimento
```bash
pnpm dev                    # Inicia dev server (localhost:3000)
pnpm build                  # Build de produção
pnpm start                  # Roda build de produção
```

### Qualidade
```bash
pnpm lint                   # ESLint
pnpm lint:fix               # ESLint com auto-fix
pnpm typecheck              # tsc --noEmit
pnpm test                   # Vitest (unit)
pnpm test:coverage          # Vitest com coverage
pnpm test:e2e               # Playwright (smoke tests)
pnpm format                 # Prettier
```

### Banco
```bash
pnpm prisma studio                          # UI visual do banco
pnpm prisma migrate dev --name <nome>       # Cria + aplica migration em dev
pnpm prisma migrate deploy                  # Aplica migrations em prod
pnpm prisma generate                        # Regenera Prisma Client
pnpm prisma db seed                         # Roda prisma/seed.ts
pnpm prisma format                          # Formata schema.prisma
pnpm prisma validate                        # Valida schema offline
```

### Postgres local (Docker)
```bash
# Iniciar
docker start arcana-forge-db

# Status
docker ps | grep arcana-forge-db

# Conectar via psql
docker exec -it arcana-forge-db psql -U postgres -d arcana_forge

# Reset completo (CUIDADO: apaga tudo)
docker stop arcana-forge-db && docker rm arcana-forge-db
docker run -d --name arcana-forge-db \
  -e POSTGRES_PASSWORD=local_dev_password \
  -e POSTGRES_DB=arcana_forge \
  -p 5432:5432 postgres:16
```

### Antes de commitar (sempre)
```bash
pnpm lint && pnpm typecheck && pnpm test
```

---

## 📐 Convenções de código

### TypeScript
- **Strict total.** `strictNullChecks`, `noImplicitAny`, `noUncheckedIndexedAccess` ativos.
- **Zero `any`** sem justificativa em comentário acima.
- **Tipos derivados de schemas Zod**, nunca duplicados manualmente.
- **`const` por padrão**, `let` só quando há reassign real.

### Estilo
- **Arquivos em inglês.** Conteúdo do código (variáveis, funções, comments curtos) em inglês.
- **Documentação e comentários longos** podem ser em português.
- **Strings de UI sempre em português brasileiro** (sem i18n no MVP).
- **Prettier:** singleQuote, trailingComma=all, printWidth=100, semi.
- **Imports ordenados:** externos → internos → relativos. ESLint plugin cuida.

### Componentes React
- **Server Components por padrão.** `'use client'` apenas quando necessário (interatividade, hooks de client-only).
- **Naming:** `PascalCase` para components, `camelCase` para funções/variáveis.
- **Co-location:** types específicos do component ficam no mesmo arquivo. Types compartilhados em `src/domain/types/` ou `src/schemas/`.
- **Sem `default export`** exceto em pages/layouts do App Router (onde Next exige).
- **Props sempre tipadas explicitamente.** Inferência de props é ruim de ler.

### Naming de arquivos
- Components: `PascalCase.tsx` (`JutsuCard.tsx`)
- Hooks: `useThing.ts`
- Utilities: `kebab-case.ts` ou `camelCase.ts` — escolha uma e mantenha
- Types: `thing.ts` (sem sufixo `.types.ts`)
- Tests: `thing.test.ts` ao lado do código testado **ou** em `tests/unit/` espelhando estrutura

### CSS
- **Sem CSS-in-JS.** Tailwind + CSS vars apenas.
- **Tokens em `src/styles/tokens.css`** referenciados via `var(--...)`.
- **Classes Tailwind organizadas:** layout → spacing → typography → color → state. ESLint plugin `prettier-plugin-tailwindcss` ordena.
- **`cn()` utility** (de `src/lib/utils/cn.ts`) para condicionalmente compor classes.

### Server Actions
- **Sempre `'use server'`** no topo do arquivo (não da função).
- **Sempre validar input com Zod** logo no início.
- **Sempre rebuscar o user** do banco em ações sensíveis — não confiar em qualquer ID vindo do client.
- **Padrão de retorno:**
  ```typescript
  type ActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; fields?: Record<string, string[]> };
  ```

### Validação com Zod
- **Schemas vivem em `src/schemas/`**, organizados por domínio.
- **Tipos derivados via `z.infer<typeof schema>`**, nunca escritos à mão.
- **Mesmo schema usado client (forms) e server (actions).**

---

## 🧠 Decisões já tomadas (NÃO QUESTIONAR)

Coisas que parecem candidatas a "será que deveria ser diferente?" mas **já estão decididas** na spec:

1. **Acuidade NÃO afeta dano de CC.** Regra RAW do livro. Foi decisão consciente do owner do projeto.
2. **Arredondamento:** sempre para CIMA, exceto **limite de poder/perícia** que é para BAIXO. Único caso especial.
3. **Sem Supabase Storage na fase local.** Imagens em `public/uploads/` filesystem. Quando for pra cloud, é trabalho de migração futura.
4. **Sem Vercel deploy na fase local.** Tudo localhost até MVP estar maduro.
5. **Firebase Auth real, não mock.** Free tier aguenta. Setup já feito.
6. **Postgres local via Docker.** Não SQLite, não cloud — Postgres mesmo (igual prod futura).
7. **Tema dark+ice é a identidade do produto.** Não tem light mode, não tem outras paletas no MVP.
8. **Open Source MIT.** Repositório público.
9. **Sistema é Shinobi no Sho 4.1b apenas no MVP.** D&D, Tormenta e outros são v3+, não interferem em decisões atuais.
10. **Server Actions sobre REST.** REST apenas em casos específicos (upload, webhooks, ficha pública).

Se você acha que algum desses está errado, **levante a questão antes de divergir** — não improvise mudança silenciosa.

---

## ⚠️ Gotchas e armadilhas

### Sistema de RPG
- **Dano de CC usa Força ÷ 2 (round up) + arma**, mesmo se o personagem tem Acuidade. Acuidade só muda o cálculo de CC (precisão), não dano.
- **Limite de poder = NC ÷ 2 (round DOWN).** Único caso de round down no sistema.
- **Hyouton dá 1 nível grátis em Fuuton e 1 em Suiton.** Esses níveis grátis não contam pro budget de pontos.
- **Especialista (Katana) também aplica em Wakizashi** via regra Daisho do livro.
- **Vitalidade pode ir negativa** (-21 = morto). Não force ≥ 0 sem checar contexto.
- **Chakra mínimo é 0**, não negativo (com exceção rara de drenagem forçada — ver `04-RULES-ENGINE.md`).

### Next.js App Router
- **`'use client'` é viral pra baixo na árvore** — se um componente é client, filhos importados por ele também são client. Cuidado em isolar bem.
- **Server Actions retornam Promise** — sempre `await` no client mesmo dentro de `useTransition`.
- **`revalidatePath('/path')`** depois de mutations — senão UI fica stale.
- **`redirect()` em Server Component** lança exception, não retorna — coloque em `try/catch` se há cleanup.
- **`cookies()` é assíncrono no Next 15+**, mas síncrono no 14. Confirme versão antes de assumir.

### Prisma
- **`include` vs `select`:** prefira `select` para limitar payload. `include: { tudo: true }` traz colunas demais.
- **Soft delete** é feito em código (`deletedAt`), Prisma não tem suporte nativo. Sempre filtre `where: { deletedAt: null }` em queries de listagem.
- **JSONB no schema** é tipado como `Json` — tipo fraco. Validate com Zod antes de salvar/usar.
- **`prisma migrate dev` em produção é proibido.** Use `migrate deploy`.

### Tailwind
- **Cores customizadas via `theme.extend`** referenciando CSS vars: `'bg-deep': 'var(--bg-deep)'`. NÃO use cores hardcoded inline em classes.
- **Arbitrary values** (`bg-[#...]`) são code smell — adicione ao theme se for usar > 1 vez.
- **`prefers-reduced-motion`** deve ser respeitado em animações longas.

### Validação
- **Zod no client** valida pra UX (mostra erro antes de enviar).
- **Zod no server** valida pra segurança (cliente pode mentir).
- **Constraints no banco** validam pra integridade (último checkpoint).
- **Não pule camadas** — defesa em profundidade.

### Imagens
- **Sempre `next/image`** — `<img>` raw é raro e justificável.
- **Imagens locais ficam em `public/uploads/`** (gitignored).
- **WebP é o formato preferido** — quando fizer upload, reencode com `sharp`.
- **Tamanho máximo de upload: 5MB.** Validar no client E no server.

---

## 🔒 Onde NÃO mexer sem aprovação

Áreas sensíveis onde você deve **pedir confirmação humana** antes de mudar:

- **`prisma/schema.prisma`** — mudanças de schema afetam dados. Sempre proponha a mudança antes de aplicar.
- **`prisma/migrations/`** — migrations já aplicadas são imutáveis. Nunca edite uma migration existente; gere nova.
- **`src/domain/rules/`** — motor de regras é o coração do produto. Mudanças aqui afetam o comportamento de TODAS as fichas. Testes precisam estar verdes antes E depois.
- **`.env.local`** — credenciais reais. Nunca sobrescreva nem inclua em commits.
- **`.env.example`** — quando adicionar nova env var no `.env.local`, atualize esse arquivo com placeholder descritivo.
- **`reference/satsuki-ficha-reference.html`** — não modifique. É a fonte de verdade visual congelada.
- **`books/`** — PDFs do livro são read-only. Nunca tente modificar, gerar versões, ou extrair conteúdo pra commit público (copyright). Use apenas como consulta local.
- **Documentos `arcana-forge-spec/*.md`** — só atualize com aprovação humana. Se algo mudou na implementação que contradiz a spec, **discuta antes** se a implementação está errada ou se a spec precisa ser atualizada.

---

## 🎯 Workflow de commits

### Padrão de mensagens (Conventional Commits)
```
feat: adiciona componente JutsuCard
fix: corrige cálculo de CC com Especialista
chore: atualiza dependências
docs: melhora README do motor de regras
test: cobertura adicional pra damage calculator
refactor: simplifica useCharacter hook
style: ajustes de formatação no JutsuModal
perf: otimiza render do AttributesGrid
```

### Boas práticas
- **Commits pequenos.** Cada commit deve ser revisável em < 5 minutos.
- **Mensagens descritivas.** "feat: stuff" é proibido. "feat: adiciona cálculo de vitalidade derivada" é bom.
- **Antes de commitar:** `pnpm lint && pnpm typecheck && pnpm test`.
- **Não commite código comentado** (a menos que tenha justificativa explícita em comentário ao lado).
- **Não commite `console.log`** acidental — use `console.warn`/`error` em logging real e remova `console.log` debug.

### Branch strategy
- **`main`** = sempre deployável (mesmo que não tenhamos deploy ainda).
- **Feature branches** para mudanças significativas (`feat/jutsu-modal`, `fix/cc-calculation`).
- **Direto na main** é aceitável durante F0/F1 (projeto pequeno, dev solo).

---

## 🧪 Testes — onde investir

**Cobertura 90%+ obrigatória em:** `src/domain/rules/` (motor de regras).

**Cobertura 60%+ recomendada em:** `src/server/actions/`, `src/lib/`.

**Cobertura opcional em:** componentes React (a menos que tenham lógica complexa).

**E2E (Playwright):** 3-5 smoke tests dos fluxos críticos. Não obrigatório no MVP.

### Padrão de teste do motor
```typescript
// tests/unit/domain/rules/derivedStats.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCC } from '@/domain/rules/derivedStats';
import { satsukiNC6 } from '../fixtures/satsuki-nc6';

describe('calculateCC', () => {
  it('aplica Acuidade quando arma permite', () => {
    expect(calculateCC(satsukiNC6, { weaponKind: 'katana' })).toBe(12);
  });

  it('soma +1 com Especialista da arma certa', () => {
    // ...
  });
});
```

### Fixtures
Em `tests/unit/domain/fixtures/`:
- `satsuki-nc6.ts` — personagem completo NC 6 com Hyouton (caso real)
- Outros conforme necessário

---

## 🚨 Quando você travar

Se você não souber como prosseguir, siga essa ordem:

1. **Leia a seção relevante da spec.** A resposta provavelmente está lá.
2. **Procure padrão similar no código existente.** Sigamos o estilo do projeto.
3. **Se há ambiguidade real:** documente as opções, escolha a mais conservadora, marque com `// TODO(human-review): explicação` e siga.
4. **Se está bloqueado de verdade:** pare, documente o problema, peça revisão humana.

**Nunca improvise grandes mudanças arquiteturais sozinho.** Se você acha que o schema está errado, ou que uma decisão da spec não faz sentido, **pergunte primeiro**.

---

## 📚 Glossário de termos do projeto

| Termo | Significado |
|---|---|
| **NC** | Nível de Campanha (1-20+). Define limites de atributos, perícias, poderes. |
| **CC** | Combate Corporal (precisão pra ataque corpo-a-corpo). |
| **CD** | Combate à Distância. |
| **ESQ** | Esquiva. |
| **LM** | Ler Movimento (defesa contra previsão). |
| **Vit** | Vitalidade (HP do sistema). |
| **Chakra** | Pontos de energia para usar técnicas. |
| **Jutsu** | Técnica ninja. No nosso sistema, é instância de um Poder + Efeito + customização. |
| **Poder** | Categoria de técnicas (Hyouton, Suiton, Fuuton, Katon, Raiton, Doton, Ninpou, etc.). |
| **Efeito** | Sub-técnica de um poder (Canhão, Névoa, Criar Arma, Energizar, etc.). |
| **Aptidão** | Habilidade especial comprada com pontos de poder. |
| **Kekkei Genkai (KG)** | Linhagem sanguínea (Hyouton, Sharingan, etc.). |
| **Hijutsu** | Técnica secreta de clã (Jinchuuriki, Senjutsu, etc.). |
| **RAW** | "Rules as Written" — fielmente como o livro escreveu. |
| **Ryos** | Moeda do sistema. |
| **Daisho** | Par katana + wakizashi empunhadas juntas. |

---

## 🔄 Manutenção deste arquivo

`CLAUDE.md` deve evoluir com o projeto. Atualize quando:

- Uma decisão importante for tomada (RAW vs casa, escolha de lib, etc.)
- Um padrão de código for estabelecido
- Um gotcha for descoberto (bug recorrente, comportamento surpreendente)
- Um comando comum for adicionado
- Um termo de domínio novo aparecer

**Não vire este arquivo numa cópia da spec** — referencie a spec ao invés de duplicar conteúdo. `CLAUDE.md` é resumo operacional, spec é referência detalhada.

**Tamanho ideal:** < 500 linhas. Se passar disso, está virando enciclopédia — refatore.

---

*Última atualização: maio/2026 — versão inicial do projeto.*
