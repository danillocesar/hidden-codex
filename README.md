# Arcana Forge

Plataforma open source de fichas de personagem para o RPG **Shinobi no Sho 4.1b**.

> Motor de regras + ficha cinematográfica + uso em mesa. Dark+ice como identidade.

---

## Estado atual

**MVP local em construção.** Guia operacional atualizado em `ROADMAP-ESTRUTURADO.md`.

Já funciona localmente:

- Next.js 14 + TypeScript estrito + App Router + Tailwind 3.4 (tema dark+ice)
- Prisma + Postgres local (Docker) — schema completo + migrations aplicadas
- **Firebase Auth real** (login Google, sessão HTTP-only, middleware)
- **Motor de regras** completo em `src/domain/rules/` (495 testes verdes)
- **Seed de catálogos** populado (aptidões, poderes, efeitos, equipamentos, clãs, vilas, KGs)
- **Wizard de criação** (`/characters/new`) — 8 passos incluindo inventário
- **Ficha read-only** (`/characters/[id]`) — hero, energias/combate/sociais, combate rápido, perícias, aptidões, poderes/efeitos, técnicas (jutsus) e inventário
- **Dashboard** (`/dashboard`) — lista, busca, filtros (NC/origem) e soft delete
- **Uso em mesa** — calculadora de dano, usar jutsu (gasta chakra), tomar dano/curar/restaurar, com toasts e skeletons
- Storage local em `public/uploads/` (cloud fica para fase futura)

Próximas frentes (ver roadmap): **editor da ficha** (F3) e **compartilhamento público** (F6).
Sem deploy/CI ainda — tudo localhost até o MVP amadurecer.

---

## Setup local

### Pré-requisitos

- Node.js 20 LTS (recomendado via [nvm](https://github.com/nvm-sh/nvm))
- pnpm 9+
- Docker (para Postgres local)

### Passos

```bash
# 1. instalar deps
pnpm install

# 2. iniciar Postgres em Docker (já provisionado neste setup)
docker start arcana-forge-db
# Caso precise criar do zero:
#   docker run -d --name arcana-forge-db \
#     -e POSTGRES_PASSWORD=local_dev_password \
#     -e POSTGRES_DB=arcana_forge \
#     -p 5432:5432 postgres:16

# 3. preencher .env.local copiando .env.example
#    (a versão deste setup já vem com credenciais Firebase reais — nunca comite o arquivo)

# 4. aplicar migrations + gerar Prisma Client
pnpm prisma migrate deploy
pnpm prisma generate

# 5. rodar dev server
pnpm dev
```

App em `http://localhost:3000`.

### Scripts úteis

| Comando | Faz |
|---|---|
| `pnpm dev` | Inicia o servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm lint` | ESLint (Next config) |
| `pnpm typecheck` | `tsc --noEmit` em todo o projeto |
| `pnpm test` | Vitest (unit) |
| `pnpm test:coverage` | Vitest com cobertura (alvo ≥90% em `src/domain/rules/`) |
| `pnpm format` | Prettier escreve nos arquivos |
| `pnpm db:studio` | Prisma Studio (UI visual do banco) |
| `pnpm db:migrate` | Cria nova migration em desenvolvimento |
| `pnpm db:seed` | Roda `prisma/seed.ts` (popula os catálogos do livro) |

---

## Documentação

A especificação técnica completa está em `arcana-forge-spec/` (00 a 08). Comece pelo `00-README.md` para o índice.

- `01-VISION.md` — visão de produto, personas, casos de uso
- `02-ARCHITECTURE.md` — stack, estrutura de pastas, padrões
- `03-DATA-MODEL.md` — schema Prisma e JSONB shapes
- `04-RULES-ENGINE.md` — fórmulas do sistema
- `05-UI-SPEC.md` — componentes e telas
- `06-MVP-ROADMAP.md` — fases F0 → F4
- `07-SEED-DATA-PLAN.md` — extração dos catálogos do livro
- `08-VISUAL-REFERENCE.md` + `reference/satsuki-ficha-reference.html` — fonte de verdade visual

`CLAUDE.md` na raiz é o contexto operacional para sessões com o Claude Code (decisões já tomadas, gotchas, comandos comuns).

---

## Licença

MIT (a confirmar — pode mudar para AGPL antes do primeiro release público).

---

*Guia operacional e próximas fases: `ROADMAP-ESTRUTURADO.md`.*
