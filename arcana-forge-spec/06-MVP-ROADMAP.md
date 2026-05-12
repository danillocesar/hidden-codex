# 06 — Roadmap do MVP

## 🎯 Visão geral

O MVP do Arcana Forge é dividido em **fases sequenciais**. Cada fase tem **critérios de aceite** claros — só passa pra próxima quando a anterior está estável.

**Filosofia:**
- Fase F0 destrava tudo (infra). Sem ela, nada existe.
- F1 a F3 entregam o produto core. Vai pra produção quando F3 acabar.
- F4+ são polish e features comunitárias.
- **Nunca pular fases.** A tentação é grande, o custo é caro.

**Estimativa de tempo:** assumindo Claude Code + revisão humana, ~**8-12 semanas calendário** pra MVP completo (F0-F3).

---

## 🚀 Fase F0 — Bootstrap (Setup do projeto)

**Duração estimada:** 3-5 dias.
**Objetivo:** repositório vivo, deployável, com infra mínima.

### Tarefas

1. **Criar repositório GitHub** `arcana-forge` (público, MIT).
2. **README inicial** com descrição do projeto.
3. **Bootstrap Next.js 14** com App Router, TypeScript, Tailwind, src/, alias `@/*`.
4. **Setup pnpm**. Lockfile commited.
5. **Estrutura de pastas** conforme `02-ARCHITECTURE.md`.
6. **shadcn/ui inicializado** com tema dark+ice.
7. **Tokens CSS** em `src/styles/tokens.css`.
8. **Fontes** carregadas via `next/font` (Cormorant, EB Garamond, Shippori Mincho, Cinzel).
9. **Prisma + Postgres setup**: schema vazio, primeira migração `init`, conexão via Supabase.
10. **Firebase Auth setup**: projeto Firebase criado, Google provider habilitado, credenciais em `.env`.
11. **Supabase Storage**: bucket `character-images` criado, políticas básicas.
12. **CI/CD**: GitHub Actions com lint + typecheck + test.
13. **Deploy Vercel**: projeto conectado ao repo, env vars configuradas, deploy automático.
14. **Variáveis de ambiente**: `.env.example` completo e documentado.
15. **README** atualizado com instruções de setup local.

### Critérios de aceite

- ✅ `pnpm dev` roda local sem erros
- ✅ `pnpm build` roda sem erros
- ✅ `pnpm lint && pnpm typecheck && pnpm test` passa
- ✅ Vercel deploy automático funcionando em cada push
- ✅ Acesso público à URL Vercel com página "Hello World" estilizada
- ✅ Conexão com Postgres testada via Prisma Studio

---

## 🛡️ Fase F1 — Autenticação e Base (1.5 semanas)

**Objetivo:** sistema de login completo, dashboard inicial, navegação.

### F1.1 — Auth core (3-4 dias)

1. Setup Firebase Auth client (`src/lib/firebase/client.ts`)
2. Setup Firebase Admin server (`src/lib/firebase/admin.ts`)
3. Route handler `/api/auth/session` (POST: cria sessão, DELETE: logout)
4. Cookie de sessão HTTP-only
5. Middleware do Next.js: protege `(app)` routes, redireciona pra `/login`
6. Helper `getCurrentUser()` em `src/lib/auth/session.ts`
7. Server Action `signInWithGoogle` (client) + verificação no server
8. Upsert do User na primeira autenticação (sync Firebase → Postgres)

### F1.2 — Telas core (3-4 dias)

1. **Landing page (`/`)** — apresentação do produto, CTA login
2. **Login (`/login`)** — Google OAuth, redirect pra dashboard
3. **Dashboard (`/dashboard`)** — lista vazia inicial com CTA "Criar primeiro personagem"
4. **Navbar** com avatar + menu (perfil, logout)
5. **Settings (`/settings`)** mínimo: nome editável, logout

### Critérios de aceite F1

- ✅ Usuário faz login com Google
- ✅ Após login, vai pra dashboard
- ✅ Logout funciona
- ✅ Tentar acessar `/dashboard` sem login redireciona pra `/login`
- ✅ Sessão persiste após reload
- ✅ User criado no Postgres na primeira autenticação
- ✅ Navbar mostra avatar + nome do Google
- ✅ Mobile responsivo

---

## 🎴 Fase F2 — Ficha Core (3-4 semanas)

**Objetivo:** criar, editar, visualizar fichas com motor de regras funcionando.

### F2.1 — Motor de regras (1 semana)

⭐ **Fase mais crítica.** Sem motor sólido, resto desmorona.

1. Implementar todos os módulos de `src/domain/rules/` conforme `04-RULES-ENGINE.md`:
   - `pointsBudget.ts`
   - `attributeLimits.ts`
   - `derivedStats.ts`
   - `skills.ts`
   - `aptitudes.ts`
   - `powers.ts`
   - `jutsus.ts`
   - `damage.ts`
   - `combat.ts`
   - `leveling.ts`
   - `validation.ts`
2. **Tests com cobertura 90%+** em todos os módulos
3. Fixtures de teste: Satsuki NC 6, NC 7 hipotético, personagem novo NC 4
4. Tipos do domínio em `src/domain/types/`
5. Catálogos hardcoded em `src/domain/catalog/`:
   - `attributes.ts` (7 atributos)
   - `combatSkills.ts` (4 habilidades)
   - `pericias.ts` (18 perícias)

### F2.2 — Schema completo do banco (2-3 dias)

1. Aplicar schema Prisma completo conforme `03-DATA-MODEL.md`
2. Migration `add_all_tables`
3. Constraints SQL via raw migration (CHECKs no banco)
4. Índices adicionais
5. Testes de integração básicos com banco em memória (SQLite mock?) ou test database

### F2.3 — Seed de catálogos do livro (5-7 dias)

> 🔶 Esta tarefa depende do **doc 07-SEED-DATA-PLAN.md** estar pronto.

1. Extração estruturada dos catálogos do PDF (eu faço, entrego JSONs)
2. Implementar `prisma/seed.ts` que importa JSONs
3. Rodar seed e popular: Aptitudes, Powers, PowerEffects, Equipments, Clans, Villages, KekkeiGenkais
4. Verificar manualmente algumas entradas (especialmente as do clã Yuki, pra Satsuki)

### F2.4 — Wizard de criação (4-5 dias)

1. Rota `/characters/new` com 4 steps
2. Server Action `createCharacter`
3. Validação via Zod
4. Apply de benefícios de clã/kekkei genkai automaticamente
5. Apply de aptidões e poderes gratuitos
6. Redirect pra `/characters/[id]/edit` no final

### F2.5 — Ficha view (`/characters/[id]`) (5-7 dias)

1. Layout completo conforme `05-UI-SPEC.md`
2. Componentes:
   - `<FichaHeader>` (banner translúcido + identificação)
   - `<HeroSection>` (imagem + nome + quickfacts)
   - `<AttributesGrid>`
   - `<EnergyBars>`
   - `<CombatSkillsBlock>`
   - `<SocialsBlock>`
   - `<AptitudesSection>`
   - `<PericiasGrid>`
   - `<JutsusGrid>`
   - `<CombatTable>`
   - `<InventoryBlock>`
   - `<CollapsibleSection>` (wrapper)
3. Imagens carregadas do banco (`CharacterImage` table)
4. Estado de colapso persistido em `Character.uiState`
5. Banner full-width entre seções (com imagem do user)

### F2.6 — Editor da ficha (`/characters/[id]/edit`) (5-7 dias)

1. Mesma estrutura do view, mas com edição inline
2. `<EditableValue>` para todos os números
3. Spinners +/- para perícias e energias
4. Pontos restantes em badge fixo
5. Validação em tempo real (mostra erro se gastar acima do budget)
6. Auto-save com debounce 1s
7. Servidor recalcula derivados em cada save (não confia no client)
8. Modal `<AptitudePicker>` para adicionar aptidões
9. Modal `<JutsuEditor>` para criar/editar jutsus (escolher poder + efeito + customizar nome)

### Critérios de aceite F2

- ✅ Usuário cria personagem completo NC 4 em < 5 minutos
- ✅ Usuário edita atributos e vê Vit/CC atualizando em tempo real
- ✅ Tenta gastar acima do budget → bloqueado com mensagem
- ✅ Tenta atributo abaixo do mínimo NC → bloqueado
- ✅ Adiciona aptidão com pré-req cumprido → ok
- ✅ Tenta aptidão sem pré-req → bloqueado com explicação
- ✅ Cria jutsu customizado vinculado a um poder/efeito existente
- ✅ Personagem do tipo "Satsuki Yuki NC 6" pode ser recriado 100% (validação final)
- ✅ Motor de regras com 90%+ de cobertura de testes
- ✅ Todos os derivados (CC, CD, ESQ, LM, Vit, Chakra) calculados corretamente
- ✅ Mobile responsivo

---

## 🎲 Fase F3 — Uso em Mesa + Diário (2-3 semanas)

**Objetivo:** ficha vira ferramenta interativa de jogo.

### F3.1 — Calculadora de dano e modais (1 semana)

1. `<JutsuModal>` com tabs de nível, calculadora, botão "Usar Jutsu"
2. `<WeaponAttackModal>` com calculadora pra armas físicas
3. `<TakeDamageModal>` (clique na barra de Vit)
4. `<RestoreModal>` (clique em "+"  ou botão dedicado pra recuperar)
5. Server Actions:
   - `useJutsu(jutsuId, levelUsed, modifiers)` — deduz chakra
   - `takeDamage(characterId, amount, isCritical)` — deduz vitalidade
   - `restoreVitality/Chakra(characterId, amount)`
6. Feedback visual: pulso na barra, toast, animação suave
7. Estados especiais: chakra esgotado → exausto; vit ≤ 0 → fora de combate (visual claro)

### F3.2 — Subir NC (4-5 dias)

1. Rota `/characters/[id]/levelup`
2. Lógica `getLevelUpDelta()` do motor
3. UI mostra: alertas de mínimo, pontos ganhos, distribuição guiada
4. Validações em tempo real
5. Server Action `finalizeLevelUp()` — salva mudanças
6. Atualiza rank do personagem se NC cruzou threshold

### F3.3 — Diário (4-5 dias)

1. Tabela `DiaryEntry` já no schema
2. Aba/seção dentro da ficha
3. Componente `<DiarySection>` com timeline
4. CRUD:
   - Modal de criação/edição com markdown editor (textarea + preview)
   - Lista com filtro por tag
   - Confirmação antes de deletar
5. Server Actions: `createDiaryEntry`, `updateDiaryEntry`, `deleteDiaryEntry`
6. Markdown rendering (lib `react-markdown` + `remark-gfm`)

### F3.4 — Upload de imagens (3-4 dias)

1. Route handler `/api/upload` com FormData
2. Validação (mime type, tamanho)
3. Reencode pra WebP via `sharp`
4. Upload pro Supabase Storage
5. Salvar URL + path no `CharacterImage`
6. UI: drag & drop ou file input
7. Galeria de imagens no editor da ficha
8. Selector "qual imagem em qual slot" (dropdown por slot)
9. Preview em tempo real

### Critérios de aceite F3

- ✅ Usar jutsu deduz chakra corretamente
- ✅ Tomar dano deduz vitalidade, mostra status
- ✅ Modal de calculadora bate matematicamente com o livro (validar com 5 cenários)
- ✅ Subir NC funciona com Satsuki NC 6 → 7 (caso real)
- ✅ Diário: criar, editar, deletar entradas com markdown
- ✅ Upload de imagem: 5MB WebP no Supabase Storage
- ✅ Selecionar imagem pra cada slot da ficha funciona
- ✅ Estado salvo persiste após reload
- ✅ Mobile: tudo funciona com tap

---

## 🔗 Fase F4 — Compartilhamento & Polish (1.5 semanas)

**Objetivo:** finalizar MVP para lançamento público.

### F4.1 — Compartilhamento (3-4 dias)

1. Modal `<ShareDialog>` na ficha
2. Server Action `createShareLink(characterId)` — gera token único
3. Rota `/share/[token]` sem auth required
4. Renderiza ficha em modo read-only
5. Visitante pode expandir/colapsar localmente (sem persistir)
6. Contador de views (incrementa a cada acesso único — por IP ou session)
7. Toggle "Mostrar no perfil público"
8. Página `/u/[username]` lista PJs públicos do user

### F4.2 — Polish geral (3-4 dias)

1. Loading states em todas as rotas (skeletons)
2. Empty states amigáveis (sem PJs, sem entradas de diário, etc.)
3. Error boundaries com mensagens claras
4. Toast notifications consistentes (sonner)
5. Animations sutis (fade-in stagger nas seções)
6. Páginas 404, 403, 500
7. Favicon + open graph tags
8. Manifest PWA básico (opcional, mas legal pra mobile)

### F4.3 — Testes E2E críticos (2-3 dias)

Playwright tests:
1. Fluxo completo: login → criar PJ → ver ficha
2. Editar atributos e ver derivados atualizarem
3. Usar jutsu → chakra deduz
4. Subir NC com mínimos
5. Compartilhar e abrir link público em browser anônimo

### F4.4 — Documentação pública (1-2 dias)

1. README do repositório com screenshots
2. CONTRIBUTING.md
3. Issue templates
4. Página `/about` no site
5. Página de créditos (sistema SnS, autores)

### Critérios de aceite F4

- ✅ Link público de Satsuki funciona em browser anônimo
- ✅ Loading states em todas as rotas
- ✅ 5 testes E2E críticos passando
- ✅ README claro o suficiente pra alguém clonar e rodar
- ✅ Deploy de produção estável por 7 dias sem crash
- ✅ Performance: LCP < 1.5s, bundle JS < 200kb gzip

---

## 🏁 Definição de "MVP Pronto"

O MVP está pronto quando:

1. **Funcionalmente:** todas as features das fases F0-F4 implementadas e testadas
2. **Tecnicamente:** zero erros de TypeScript, lint passa, testes passam (90%+ no motor)
3. **Performance:** métricas alvo cumpridas
4. **UX:** fluxo crítico (criar PJ → usar em sessão) feito em < 15 minutos sem ajuda
5. **Estabilidade:** 7 dias em produção sem perda de dados
6. **Comunidade:** repositório público, contribuição documentada

---

## 🔮 Pós-MVP (v2+)

Após MVP estável, próximas prioridades por ordem:

### v2.0 — Modo Mestre (~6-8 semanas)

- Sistema de grupos/mesas
- Mestre cria mesa e adiciona jogadores
- Mestre vê fichas dos PJs (read-only ou propor edição)
- Tracker de iniciativa em combate
- Criação rápida de NPCs/inimigos (templates: capanga, mid-boss, boss)
- Painel de combate ao vivo: vida/chakra/iniciativa de todos visível
- Chat/notas da sessão

### v2.5 — Comunidade (~3-4 semanas)

- Busca de personagens públicos
- Filtros (clã, vila, NC, rank)
- Sistema de favoritos
- Discovery na home
- Trending characters

### v2.7 — Funcionalidades avançadas (~3-4 semanas)

- Snapshots de versão da ficha (histórico NC)
- Editor rich text do diário (imagens inline)
- Exportar ficha em PDF
- Exportar diário em PDF
- Comentários do mestre nas entradas

### v3.0 — Multi-sistema (~8-12 semanas)

- Suporte a outros sistemas RPG (D&D 5e, Tormenta)
- Motor de regras abstrato com adapters
- Catálogos modulares por sistema
- Tema visual por sistema

### Roadmap futuro especulativo

- App mobile nativo (React Native ou Flutter)
- Integração com Discord (bot anuncia level ups, usa jutsu via comando)
- IA: gerador de descrição de personagem, sugestões de evolução
- Marketplace de templates de ficha (com royalty pro criador)
- Modo offline (PWA + IndexedDB)

---

## ⚠️ Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|:---:|:---:|---|
| Motor de regras com bug sutil | Alta | Alto | Tests 90%+ no motor + validação com casos reais (Satsuki, NC 7-12 manual) |
| Seed de catálogos demorar mais que o esperado | Média | Médio | Começar seed em paralelo com F2.1; entregar incrementalmente |
| Performance ruim com muitas fichas | Baixa | Alto | Lazy load, pagination no dashboard, queries com select explícito |
| Custos de Supabase/Vercel acima do free tier cedo | Baixa | Médio | Monitorar uso semanal; otimizar imagens; migrar storage pra Cloudinary se necessário |
| User joga com regra-casa diferente da minha implementação | Alta | Baixo | Documentar claramente que é RAW; sistema de flags de campanha pra v2 |
| Bug crítico em produção causa perda de dados | Baixa | Crítico | Backups automáticos do Supabase + snapshot soft delete + monitoring |

---

## 🎯 Checklist por fase

### F0 — Bootstrap
- [ ] Repo criado, README
- [ ] Next.js + TS + Tailwind funcionando
- [ ] Prisma + Postgres conectado
- [ ] Firebase Auth setup
- [ ] Supabase Storage setup
- [ ] CI/CD funcionando
- [ ] Deploy Vercel automático

### F1 — Auth e Base
- [ ] Login Google funciona
- [ ] Sessão persiste
- [ ] Middleware protege rotas
- [ ] Dashboard básico
- [ ] Settings básico
- [ ] Logout

### F2 — Ficha Core
- [ ] Motor de regras completo + tests 90%+
- [ ] Schema completo aplicado
- [ ] Catálogos seedados
- [ ] Wizard de criação
- [ ] Ficha view com todas as seções
- [ ] Editor com edição inline e validações
- [ ] Satsuki NC 6 100% recriável

### F3 — Mesa
- [ ] Modal de jutsu com calculadora
- [ ] Modal de ataque
- [ ] Usar jutsu deduz chakra
- [ ] Tomar dano deduz vit
- [ ] Subir NC
- [ ] Diário CRUD
- [ ] Upload de imagens + slots

### F4 — Lançamento
- [ ] Compartilhamento por link
- [ ] Perfil público
- [ ] Loading/empty/error states
- [ ] Testes E2E
- [ ] README e docs
- [ ] Deploy estável

---

*Próximo documento: `07-SEED-DATA-PLAN.md` — extração dos catálogos do livro.*
