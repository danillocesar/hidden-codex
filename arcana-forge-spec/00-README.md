# Arcana Forge — Especificação Técnica

Plataforma de criação e gestão de fichas de personagem para o RPG **Shinobi no Sho 4.1b**, com motor de regras, calculadora de dano, diário narrativo e visual cinematográfico dark+ice.

---

## 📚 Índice da Documentação

Os documentos são feitos para serem lidos **nessa ordem** se você está se familiarizando com o projeto pela primeira vez. Para implementação, podem ser consultados isoladamente.

| # | Documento | Conteúdo | Páginas |
|:---:|---|---|:---:|
| 00 | **README.md** | Índice, escopo geral, como usar esta spec | (este) |
| 01 | **VISION.md** | Visão de produto, personas, casos de uso, escopo MVP vs roadmap | ~5 |
| 02 | **ARCHITECTURE.md** | Stack técnica, estrutura de pastas, padrões, infra | ~8 |
| 03 | **DATA-MODEL.md** | Schema Prisma completo, relações, índices, JSONB shapes | ~10 |
| 04 | **RULES-ENGINE.md** | Fórmulas do sistema SnS, validações, cálculos derivados | ~12 |
| 05 | **UI-SPEC.md** | Componentes principais, telas, fluxos, padrões de UI | ~10 |
| 06 | **MVP-ROADMAP.md** | Fases de implementação, critérios de aceite, milestones | ~6 |
| 07 | **SEED-DATA-PLAN.md** | Plano de extração e seed dos catálogos do livro | ~4 |
| 08 | **VISUAL-REFERENCE.md** | ⭐ Referência visual e instruções sobre o HTML de referência | ~6 |
| — | **reference/satsuki-ficha-reference.html** | ⭐ HTML real com toda estética aprovada | (arquivo) |

**Total estimado:** ~60 páginas de especificação técnica + 1 arquivo HTML de referência visual.

> ⭐ **IMPORTANTE:** O arquivo `reference/satsuki-ficha-reference.html` é **fonte de verdade visual** do projeto. Antes de implementar qualquer componente visual, leia `08-VISUAL-REFERENCE.md` que explica como usar esse HTML como referência durante a implementação.

---

## 🎯 Para o Claude Code

Esta spec foi escrita assumindo que você (Claude Code, ou outro agente de implementação) vai consumir os documentos um por vez. Recomendações:

1. **Comece lendo `01-VISION.md`** para entender o problema sendo resolvido. Não pule isso — decisões técnicas só fazem sentido com o contexto do produto.
2. **Leia `02-ARCHITECTURE.md` antes de gerar qualquer código.** Lá estão as decisões de stack que evitam retrabalho.
3. **`03-DATA-MODEL.md` é a fonte de verdade do schema.** Se algo no código contradiz esse doc, o doc está certo até prova em contrário.
4. **`04-RULES-ENGINE.md` define o motor.** Toda lógica de cálculo de ficha SnS está lá. Implemente como módulo puro, testável independente da UI.
5. **`05-UI-SPEC.md`** especifica componentes e fluxos, mas pra estética visual real, **leia também `08-VISUAL-REFERENCE.md`** e abra `reference/satsuki-ficha-reference.html` no navegador.
6. **`06-MVP-ROADMAP.md` define ordem de implementação.** Siga as fases. Não tente entregar tudo de uma vez.
7. **⭐ `08-VISUAL-REFERENCE.md` + `reference/satsuki-ficha-reference.html` definem a ESTÉTICA real do produto.** Antes de implementar qualquer componente visual, abra esse HTML no navegador. Cores, fontes, layout, animações, efeitos — tudo já está decidido lá. Não invente design novo.
8. **Quando em dúvida, prefira:** explicitude sobre concisão; tipos sobre comentários; validações sobre confiança; tests sobre debug manual.

---

## 🚦 Status atual

| Item | Status |
|---|:---:|
| Especificação inicial | ✅ |
| Catálogos seedados (JSON) | ⏳ Pendente |
| Setup do repositório | ⏳ Pendente |
| Implementação F0 (bootstrap) | ⏳ Pendente |
| Implementação F1 (MVP core) | ⏳ Pendente |

---

## 📐 Convenções desta documentação

- **Termos do sistema RPG** (Shinobi no Sho) aparecem em *itálico* quando introduzidos: *kekkei genkai*, *jutsu*, *chakra*.
- **Identificadores técnicos** (tabelas, campos, tipos) aparecem em `code`: `Character`, `attribute_str`, `JSONB`.
- **Decisões com trade-off** aparecem em blocos destacados — leia com atenção, são pontos onde há alternativa válida.
- **TODOs e questões abertas** aparecem como `> 🔶 ABERTO:` — não bloqueiam implementação mas precisam ser decididos antes da feature relevante.

---

## 🔗 Referências externas

- **Shinobi no Sho 4.1b** — sistema de RPG base. Livros do projeto (Livro Básico, Livro de Hijutsus, Guia Avançado) são a fonte de verdade para regras.
- **Next.js** — https://nextjs.org/docs (App Router)
- **Prisma** — https://www.prisma.io/docs
- **Supabase** — https://supabase.com/docs (apenas Postgres + Storage; auth via Firebase)
- **Firebase Auth** — https://firebase.google.com/docs/auth
- **shadcn/ui** — https://ui.shadcn.com
- **TanStack Query** — https://tanstack.com/query/latest
- **Zod** — https://zod.dev

---

*Última revisão: maio/2026*
