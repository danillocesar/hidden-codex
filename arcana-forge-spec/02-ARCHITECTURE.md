# 02 — Arquitetura Técnica

## 🎯 Visão geral

Arcana Forge é uma **aplicação web full-stack monolítica** construída em Next.js 14+ com App Router, escrita em TypeScript ponta a ponta. A arquitetura prioriza:

- **Type safety end-to-end:** schemas Zod compartilhados entre client e server.
- **Simplicidade operacional:** um único deploy (Vercel), um único banco (Supabase Postgres).
- **DX (Developer Experience):** Prisma + Zod + shadcn/ui = velocidade alta com baixa fricção.
- **Escalabilidade gradual:** começa monolito, pode evoluir para edge functions/serviços separados se demanda crescer.

---

## 🧱 Stack técnica

### Core

| Camada | Escolha | Versão alvo |
|---|---|---|
| **Linguagem** | TypeScript | 5.4+ |
| **Framework** | Next.js (App Router) | 14.2+ |
| **Runtime** | Node.js | 20 LTS |
| **Package manager** | pnpm | 9+ |

### Frontend

| Camada | Escolha |
|---|---|
| **UI Library** | React 18+ (Server Components quando possível) |
| **Estilização** | Tailwind CSS 3.4+ |
| **Componentes** | shadcn/ui (copy-paste, não dependência) |
| **Ícones** | lucide-react |
| **Fontes** | next/font (Cormorant Garamond, EB Garamond, Shippori Mincho, Cinzel) |
| **State client** | TanStack Query 5 + Zustand (apenas quando necessário) |
| **Forms** | react-hook-form + Zod resolver |
| **Drag & drop** | (futuro, v2) — dnd-kit |

### Backend

| Camada | Escolha |
|---|---|
| **API** | Next.js Server Actions + Route Handlers |
| **Validação** | Zod (schemas compartilhados client/server) |
| **ORM** | Prisma 5+ |
| **Banco de dados** | Postgres (via Supabase) |
| **Autenticação** | Firebase Auth (Google provider) |
| **Storage de imagens** | Supabase Storage |
| **Cache (futuro)** | Redis via Upstash quando necessário |

### DevOps / Infra

| Camada | Escolha |
|---|---|
| **Hospedagem app** | Vercel |
| **Hospedagem DB** | Supabase (free tier) |
| **Auth provider** | Firebase (free tier) |
| **CI/CD** | GitHub Actions + Vercel automático |
| **Monitoramento** | Vercel Analytics (free) + Sentry (free tier) |
| **Domínio** | (do usuário) ou *.vercel.app inicialmente |

### Qualidade

| Camada | Escolha |
|---|---|
| **Linter** | ESLint (config Next.js) + import-sort |
| **Formatter** | Prettier |
| **Testes unitários** | Vitest |
| **Testes E2E** | Playwright (apenas smoke tests no MVP) |
| **Type check** | `tsc --noEmit` no CI |

---

## 📁 Estrutura de pastas

```
arcana-forge/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI: lint, typecheck, test
├── docs/
│   └── (esta spec aqui)
├── prisma/
│   ├── schema.prisma                 # Schema completo
│   ├── migrations/                   # Migrações
│   └── seed.ts                       # Seed dos catálogos
├── public/
│   └── (imagens estáticas: logo, favicons)
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # Landing page, sobre, etc.
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)/                   # Login, callback
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/                    # App autenticado
│   │   │   ├── layout.tsx            # Verifica auth, navbar
│   │   │   ├── dashboard/page.tsx    # Lista personagens
│   │   │   ├── characters/
│   │   │   │   ├── new/page.tsx      # Wizard de criação
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Ficha view
│   │   │   │       ├── edit/page.tsx # Ficha edit
│   │   │   │       └── diary/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── share/
│   │   │   └── [token]/page.tsx      # Ficha pública (sem auth)
│   │   ├── api/                      # Route handlers (REST)
│   │   │   ├── auth/                 # Firebase callback
│   │   │   └── upload/               # Upload de imagens
│   │   ├── layout.tsx                # Root layout + fonts
│   │   └── globals.css               # Tailwind + tokens
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── ficha/                    # Componentes da ficha
│   │   │   ├── FichaHeader.tsx
│   │   │   ├── AttributesGrid.tsx
│   │   │   ├── EnergyBars.tsx
│   │   │   ├── SkillsBlock.tsx
│   │   │   ├── PericiasGrid.tsx
│   │   │   ├── JutsuCard.tsx
│   │   │   ├── JutsuModal.tsx
│   │   │   ├── DamageCalculator.tsx
│   │   │   ├── CombatTable.tsx
│   │   │   ├── InventoryBlock.tsx
│   │   │   ├── DiarySection.tsx
│   │   │   └── CollapsibleSection.tsx
│   │   ├── shared/                   # Genéricos
│   │   │   ├── Navbar.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── EditableValue.tsx
│   │   └── theme/
│   │       └── ThemeProvider.tsx
│   ├── lib/
│   │   ├── prisma.ts                 # Singleton do client
│   │   ├── firebase/                 # Setup Firebase
│   │   │   ├── client.ts
│   │   │   └── admin.ts
│   │   ├── supabase/                 # Storage helpers
│   │   │   └── storage.ts
│   │   ├── auth/                     # Helpers de auth
│   │   │   ├── session.ts
│   │   │   └── middleware.ts
│   │   └── utils/
│   │       ├── cn.ts                 # tailwind-merge
│   │       └── format.ts
│   ├── server/
│   │   ├── actions/                  # Server Actions
│   │   │   ├── characters.ts
│   │   │   ├── jutsus.ts
│   │   │   ├── diary.ts
│   │   │   ├── upload.ts
│   │   │   └── share.ts
│   │   └── queries/                  # Queries puras (server-side)
│   │       ├── characters.ts
│   │       └── catalog.ts
│   ├── domain/                       # ⭐ Motor de regras puro
│   │   ├── rules/
│   │   │   ├── attributes.ts         # Validações, mínimos
│   │   │   ├── pointsBudget.ts       # Quantos pontos por NC
│   │   │   ├── derivedStats.ts       # CC, CD, ESQ, LM, Vit, Chakra
│   │   │   ├── skills.ts             # Cálculo de perícias
│   │   │   ├── aptitudes.ts          # Validação de pré-requisitos
│   │   │   ├── jutsus.ts             # Custo, dano, efeitos
│   │   │   ├── damage.ts             # Calculadora de dano por grau
│   │   │   └── leveling.ts           # Subir NC
│   │   ├── types/                    # Types do domínio (não Prisma)
│   │   │   ├── character.ts
│   │   │   ├── jutsu.ts
│   │   │   └── ...
│   │   └── catalog/                  # Listas hardcoded
│   │       ├── attributes.ts
│   │       ├── combatSkills.ts
│   │       └── pericias.ts
│   ├── schemas/                      # Zod schemas
│   │   ├── character.ts
│   │   ├── jutsu.ts
│   │   ├── diary.ts
│   │   └── upload.ts
│   ├── hooks/
│   │   ├── useCharacter.ts
│   │   ├── useAuth.ts
│   │   └── useCollapsibleState.ts
│   └── styles/
│       └── tokens.css                # CSS vars do tema
├── tests/
│   ├── unit/
│   │   └── domain/                   # Testes do motor
│   └── e2e/
│       └── critical-paths.spec.ts
├── .env.example
├── .env.local                        # (gitignored)
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

### Por que essa estrutura

- **`src/app/`** — App Router do Next, com **route groups** (`(marketing)`, `(auth)`, `(app)`) para layouts diferentes sem afetar URL.
- **`src/domain/`** — ⭐ **Pasta mais importante.** Motor de regras puro, sem dependência de banco, UI ou framework. Testável isoladamente. Reusável (se um dia for mobile app, esse código vai junto).
- **`src/server/`** — código que só roda no servidor (Server Actions, queries Prisma). Não pode ser importado por Client Components.
- **`src/components/ficha/`** — componentes específicos da ficha. Cada um focado em uma seção. Compõem a página final.
- **`src/schemas/`** — Zod schemas. **Compartilhados client/server**. Forms usam pra validar antes de enviar; server usa pra validar antes de processar.

---

## 🔐 Autenticação

### Fluxo Firebase Auth + Postgres custom

```
┌─────────────┐        ┌─────────────┐        ┌──────────────┐
│   Browser   │        │   Vercel    │        │  Firebase    │
│   (client)  │        │   (Next)    │        │     Auth     │
└──────┬──────┘        └──────┬──────┘        └───────┬──────┘
       │                      │                       │
       │  1. Click "Login"    │                       │
       ├─────────────────────────────────────────────►│
       │                      │                       │
       │  2. Google popup, retorna ID token           │
       │◄─────────────────────────────────────────────┤
       │                      │                       │
       │  3. POST /api/auth/session                   │
       │     { idToken }      │                       │
       ├─────────────────────►│                       │
       │                      │  4. Verify token      │
       │                      ├──────────────────────►│
       │                      │◄──────────────────────┤
       │                      │   5. Token válido     │
       │                      │                       │
       │                      │  6. Upsert User in Postgres
       │                      │     (firebase_uid, email, name)
       │                      │                       │
       │                      │  7. Set HTTP-only cookie
       │                      │     com session token │
       │  8. Cookie setado, redirect /dashboard       │
       │◄─────────────────────┤                       │
```

### Decisões importantes

1. **Firebase Auth só valida identidade.** O `user` real do app está no Postgres (`User` table), conectado por `firebase_uid`.
2. **Session via cookie HTTP-only.** O ID token do Firebase tem validade curta (1h); na primeira request, criamos uma session cookie nossa de duração maior (30 dias). Renovação automática.
3. **Middleware do Next** valida o cookie em rotas autenticadas (`(app)`). Sem cookie ou inválido → redirect para `/login`.
4. **Server Actions sempre rebuscam o user.** Não confiar no que o client manda — buscar `User` do banco em cada action que precisa de identidade.

### Layout de auth no código

```typescript
// src/lib/auth/session.ts
export async function getCurrentUser(): Promise<User | null> {
  const cookie = cookies().get('session')?.value;
  if (!cookie) return null;
  const decoded = await verifySessionCookie(cookie); // Firebase Admin
  if (!decoded) return null;
  return prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
}

// Em qualquer Server Component ou Action:
const user = await getCurrentUser();
if (!user) redirect('/login');
```

---

## 🔄 Comunicação Client ↔ Server

Decisão: **Server Actions** como padrão, **Route Handlers (API REST)** apenas onde necessário.

### Quando usar Server Actions

- Mutations (criar, editar, deletar personagem, jutsu, entrada de diário)
- Buscas simples acionadas por evento de UI

### Quando usar Route Handlers

- Upload de imagens (precisa de `FormData`, multipart)
- Webhooks (Firebase, Supabase Storage)
- Endpoints públicos sem auth (ficha pública via `/share/[token]`)

### Padrão de Server Action

```typescript
// src/server/actions/characters.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { createCharacterSchema } from '@/schemas/character';

export async function createCharacter(input: unknown) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const parsed = createCharacterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  const character = await prisma.character.create({
    data: { ...parsed.data, userId: user.id },
  });

  revalidatePath('/dashboard');
  return { ok: true as const, character };
}
```

### Padrão no Client

```typescript
'use client';

import { useTransition } from 'react';
import { createCharacter } from '@/server/actions/characters';

export function CreateCharacterButton() {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => {
        const result = await createCharacter({ name: 'Satsuki' });
        if (!result.ok) toast.error('Erro');
        else router.push(`/characters/${result.character.id}`);
      })}
    >
      Criar
    </button>
  );
}
```

---

## ✅ Validação com Zod

**Princípio:** schemas Zod são a única fonte de verdade. Tipos são derivados deles, não escritos à mão.

```typescript
// src/schemas/character.ts
import { z } from 'zod';

export const attributeKeys = ['for', 'des', 'agi', 'per', 'int', 'vig', 'esp'] as const;
export type AttributeKey = (typeof attributeKeys)[number];

export const attributesSchema = z.object({
  for: z.number().int().min(1).max(20),
  des: z.number().int().min(1).max(20),
  agi: z.number().int().min(1).max(20),
  per: z.number().int().min(1).max(20),
  int: z.number().int().min(1).max(20),
  vig: z.number().int().min(1).max(20),
  esp: z.number().int().min(1).max(20),
});
export type Attributes = z.infer<typeof attributesSchema>;

export const createCharacterSchema = z.object({
  name: z.string().min(1).max(80),
  age: z.number().int().min(1).max(200).optional(),
  campaignLevel: z.number().int().min(1).max(20),
  clanId: z.string().uuid().optional(),
  villageId: z.string().uuid().optional(),
  attributes: attributesSchema,
  // ... resto
});
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
```

**Onde valida:**
1. **Form (client):** `react-hook-form` com `zodResolver(createCharacterSchema)` — UX rica, erros em tempo real.
2. **Server Action:** `createCharacterSchema.safeParse(input)` — sempre, defensivo. Cliente pode mentir.
3. **Motor de regras (domínio):** validações extras de regras de negócio que Zod não cobre (pontos restantes, pré-requisitos de aptidões).

---

## 🗄️ Acesso ao banco

### Prisma como ORM

- Schema em `prisma/schema.prisma`.
- Tipos auto-gerados em `node_modules/.prisma/client`.
- Singleton do client em `src/lib/prisma.ts` (evita esgotamento de conexões em dev).

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Convenções de queries

- Usar `select` explícito para limitar payload (não trazer colunas não usadas).
- Transações com `prisma.$transaction([...])` quando múltiplas escritas precisam ser atômicas (ex: subir NC = update do personagem + insert do snapshot).
- N+1 evitado com `include` ou queries em batch.

### Migrações

- Toda mudança de schema gera migração: `pnpm prisma migrate dev --name nome_descritivo`.
- Migrações versionadas no Git.
- Em produção: `pnpm prisma migrate deploy` (apply automático no CI/Vercel).

---

## 🖼️ Upload e storage de imagens

### Fluxo

```
1. User seleciona arquivo no input
2. Client envia POST /api/upload com FormData
3. Route handler valida tamanho e mime type
4. Faz upload pro Supabase Storage (bucket "character-images")
5. Retorna URL pública
6. Client salva URL no banco via Server Action
```

### Regras

- **Tamanho máximo:** 5 MB por imagem
- **Formatos aceitos:** PNG, JPEG, WebP
- **Bucket Supabase:** `character-images` (público, com URLs longas/aleatórias)
- **Path no bucket:** `{userId}/{characterId}/{slot}-{uuid}.{ext}` (ex: `user-123/char-abc/hero-xyz.webp`)
- **Conversão:** server faz reencode pra WebP qualidade 88 (sharp lib) — economiza espaço e padroniza.

> 🔶 **ABERTO:** moderação de upload. v1 confia no usuário. v2 pode adicionar AI moderation (Cloudflare Images, AWS Rekognition).

---

## 🎨 Tema e design tokens

### Centralização em CSS variables

```css
/* src/styles/tokens.css */
:root {
  --bg-deep: #0a0b0e;
  --bg-paper: #14161c;
  --bg-card: #1a1d25;
  --ink: #e8e4dc;
  --ice: #9bb8d1;
  --ice-bright: #c8dcea;
  --ice-deep: #5b7a96;
  --seal: #8a1f1f;
  /* ... resto */
}
```

### Tailwind config estende

```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': 'var(--bg-deep)',
        'ice': 'var(--ice)',
        // ...
      },
      fontFamily: {
        serif: ['var(--font-cormorant)'],
        sans: ['var(--font-cinzel)'],
        jp: ['var(--font-shippori)'],
      },
    },
  },
};
```

### Por que CSS vars + Tailwind

- CSS vars permitem **trocar tema em runtime** (futuro: temas por clã/elemento).
- Tailwind dá DX de classes utilitárias.
- shadcn/ui usa esse mesmo padrão nativamente.

---

## 🌐 Internacionalização (i18n)

**MVP:** apenas **português brasileiro**. Tudo hardcoded em pt-BR.

**v2:** quando comunidade internacional aparecer, usar `next-intl` ou `next-i18next`. Strings já organizadas em arquivos separados desde o início pra facilitar migração.

> 🔶 **ABERTO:** se já queremos i18n estruturado desde v1 (custo: ~1 dia de setup) ou se fica pra depois.

---

## ⚡ Performance

### Princípios

1. **Server Components por padrão.** Client Components só quando precisam de interatividade.
2. **Streaming.** Loading states com Suspense em rotas que dependem de queries lentas.
3. **Imagens otimizadas.** `next/image` com lazy loading. Storage em WebP.
4. **Caching agressivo.** Catálogos (atributos, perícias, etc.) cacheados em memória do server (não muda em runtime).
5. **Bundle size.** Monitorar com `@next/bundle-analyzer`. Meta: < 200kb gzip no JS inicial.

### Métricas alvo

| Métrica | Alvo MVP |
|---|---|
| LCP (Largest Contentful Paint) | < 1.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| TTI (Time to Interactive) | < 2.5s |
| Bundle JS inicial (gzip) | < 200kb |

---

## 🧪 Testes

### Estratégia

| Camada | Cobertura alvo |
|---|---|
| **Motor de regras (`src/domain/`)** | **90%+** — crítico, ROI altíssimo |
| **Server Actions** | 60%+ |
| **Componentes** | Não obrigatório no MVP, exceto críticos |
| **E2E (Playwright)** | 3-5 smoke tests dos fluxos principais |

### Por que focar no motor de regras

O motor de regras é onde **erro silencioso causa mais dano** — uma fórmula errada de CC vira ficha matemáticamente quebrada que o usuário usa por meses sem saber. Tests aqui pagam dividendos.

### Estrutura de teste

```typescript
// tests/unit/domain/rules/derivedStats.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCC } from '@/domain/rules/derivedStats';

describe('CC (Combate Corporal)', () => {
  it('soma base + Força quando não tem Acuidade', () => {
    expect(calculateCC({
      base: 5,
      attributes: { for: 4, des: 6 },
      aptitudes: [],
    })).toBe(9);
  });

  it('usa Destreza quando tem Acuidade', () => {
    expect(calculateCC({
      base: 5,
      attributes: { for: 1, des: 6 },
      aptitudes: ['acuidade'],
    })).toBe(11);
  });

  it('soma +1 com Especialista (Katana) ao empunhar katana', () => {
    expect(calculateCC({
      base: 5,
      attributes: { for: 1, des: 6 },
      aptitudes: ['acuidade', 'especialista_katana'],
      weapon: 'katana',
    })).toBe(12);
  });
});
```

---

## 🔄 CI/CD

### Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      # E2E só em PRs pra main:
      - if: github.event_name == 'pull_request'
        run: pnpm test:e2e
```

### Deploy

- **Vercel** automático em todo push pra `main`.
- **Preview deploys** automáticos em todo PR.
- **Migrações Prisma** rodam no build da Vercel (`postinstall` script).

---

## 📦 Variáveis de ambiente

```bash
# .env.example
# Database
DATABASE_URL="postgresql://..."          # Supabase Postgres
DIRECT_URL="postgresql://..."            # Prisma migrations (sem pooler)

# Firebase Auth (client)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."

# Firebase Admin (server)
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."

# Supabase Storage
SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."          # Server-only
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SESSION_SECRET="..."                     # Cookie signing

# Optional
SENTRY_DSN="..."
```

---

## 🚀 Plano de bootstrap (Fase F0)

Para o Claude Code começar do zero:

```bash
# 1. Criar projeto Next.js
pnpm create next-app@latest arcana-forge --typescript --tailwind --app --src-dir --import-alias "@/*"

# 2. Instalar dependências
pnpm add zod prisma @prisma/client \
  firebase firebase-admin \
  @supabase/supabase-js \
  @tanstack/react-query zustand \
  react-hook-form @hookform/resolvers \
  lucide-react sharp

pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom \
  playwright @playwright/test

# 3. Inicializar shadcn/ui
pnpm dlx shadcn-ui@latest init

# 4. Inicializar Prisma
pnpm prisma init

# 5. Aplicar tema (copiar tokens.css + tailwind.config.ts da spec)

# 6. Criar estrutura de pastas (conforme seção "Estrutura de pastas")

# 7. Setup Firebase + Supabase + .env

# 8. Schema inicial do Prisma (do doc 03-DATA-MODEL.md)

# 9. Primeira migração: pnpm prisma migrate dev --name init

# 10. Hello world funcionando: rota / e /login
```

---

## 🎯 Princípios técnicos resumidos

1. **TypeScript estrito.** Sem `any` exceto em interop comprovado.
2. **Schemas Zod como fonte de verdade.** Types derivam, não duplicam.
3. **Motor de regras isolado.** Pura função, sem dependência de framework.
4. **Server Actions sobre REST.** REST só pra upload/webhooks/público.
5. **Server Components por padrão.** Client Components com `'use client'` explícito.
6. **CSS via Tailwind + tokens.** Sem CSS-in-JS, sem styled-components.
7. **Test the rules.** UI pode quebrar, regra não.
8. **Migrations versionadas.** Nunca editar migration antiga.
9. **Erros caem em log estruturado.** `console.error` no dev, Sentry em prod.
10. **Open source friendly.** Sem segredos no repo, README claro, contribuição documentada.

---

*Próximo documento: `03-DATA-MODEL.md` — schema Prisma completo.*
