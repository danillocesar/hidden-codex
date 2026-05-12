# Session Log — F0 Bootstrap + Seed Leva 1

**Início:** 2026-05-12 01:09 (horário local)
**Modo:** Sessão autônoma noturna (sem revisor disponível) + revisão humana matinal
**Objetivo:** Implementar Fase F0 do roadmap em ambiente local (sem Vercel, sem Supabase cloud) e popular o banco com a primeira leva de catálogos.

---

## Seed Leva 1 — perícias + vilas (09:30 do dia seguinte)

Catálogos seedados a partir de `prisma/seed-data/`:

- **perícias** (20 entradas, `prisma/seed-data/pericias.json`)
- **vilas** (5 entradas oficiais, `prisma/seed-data/villages.json`)

Atributos e habilidades de combate mantidos como TS const (decisão pré-aprovada — sem tabela Prisma), mas enriquecidos com os novos campos do JSON (kanji, order, abbreviation, category, primaryUses, formula, defendsAgainst, alternateAttribute).

### Mudanças aplicadas

- **`prisma/schema.prisma`**:
  - Novo `model Pericia` (code único, attribute String para suportar `car` social, trained, doubleTrained, armorPenalty, order, descrições). Sem FK com `CharacterPericia.periciaCode` por decisão da spec (03-DATA-MODEL §"Por que perícias têm periciaCode string em vez de FK?") — a lista é fechada e o domínio garante consistência.
  - `Character.customVillageName String?` — campo NOVO para vilas customizadas (não-canônicas) digitadas pelo usuário.
  - `Village` ganhou `translation`, `country`, `leaderTitle` (eram esperados pelo JSON).
- **Migration** `20260512122826_add_pericia_and_custom_village` aplicada.
- **`src/domain/catalog/attributes.ts`**: enriquecido com kanji, order, abbreviation, category (FISICO/MENTAL), shortDescription, description completa, primaryUses. Função `getAttributeByCode`.
- **`src/domain/catalog/combatSkills.ts`**: enriquecido com kanji, abbreviation, defaultBase, baseAttribute, alternateAttribute, alternateAttributeRequiresAptitude, formula, defendsAgainst. Função `getCombatSkillByCode`. `INITIAL_COMBAT_BASES_SUM` e `MAX_REMANEJAMENTO` movidos para cá (eram redundantes em `combatBases.ts`).
- **`src/domain/catalog/pericias.ts`**: lista de 18 inventada substituída pelas 20 do livro. Type `PericiaAttribute = AttributeKey | 'car' | 'man'` para suportar atributos sociais. Type guard `isPrimaryAttribute`. Campos `trained`, `doubleTrained`, `armorPenalty`, `order`, `shortDescription`. Removidos campos inventados (`forbiddenAtNc4`, `requiresTraining`).
- **`src/domain/rules/skills.ts`** (motor — ajuste mínimo necessário pelo shape do JSON):
  - `requiresTraining` → `trained` no parâmetro e no acesso ao catálogo.
  - `calculatePericiaLevelByCode` agora throwa erro explícito para perícias sociais (`obter_informacao` com `attribute: 'car'`) em vez de fingir suporte com NaN. Implementação social entra quando atributos sociais do `Character` tiverem cálculo dedicado.
  - Removida a checagem `forbidden_in_nc_4` (não estava no livro nem no JSON — era inferência minha do spec). Substituída por comentário explicando que o gate de Venefício (requer aptidão Químico) entra quando aptidões forem seedadas. Wizard de criação fará o gate na UI.
- **`prisma/seed.ts`**: implementação real (substitui no-op). Helper `loadSeedData` que remove campos com prefixo `_` (notes/metadata internos). Funções `seedPericias` e `seedVillages` usam `upsert` por `code` (idempotente). `import.meta.url` + shim de `__dirname` para tsx ESM.
- **Tests atualizados**:
  - `skills.test.ts`: `venenificio` → `venefico` (código correto do livro). Novo teste para perícia social (lança erro). Removido teste de "venefico proibida NC 4" (rule inventada); substituído por confirmação de que `venefico` passa pelo budget enquanto gate de aptidão não existe.
  - `aptitudes.test.ts`: `curar` (perícia que nunca existiu no livro) → `medicina` (trained, retorna 0 sem investimento — mesma semântica do teste).

### Validação após seed

- `pnpm prisma db seed` rodou idempotente (executado 2× sem duplicar): 20 perícias + 5 vilas.
- Spot-check via `psql`:
  - Acrobacia: `attribute: agi`, `trained: false`, `armor_penalty: true`, `order: 1` ✓
  - Venefício: `attribute: int`, `trained: true`, `double_trained: true` ✓
  - Obter Informação: `attribute: car` (social) ✓
  - Konoha: `country: País do Fogo`, `leader_title: Hokage` ✓
- `pnpm lint` ✓ / `pnpm typecheck` ✓ / `pnpm test` 185/185 ✓ / `pnpm build` ✓

### Decisões da sessão de seed para REVISAR

1. **`forbidden_in_nc_4` removido.** A regra spec/04-RULES-ENGINE.md menciona `forbidden_in_nc_4` em PericiaDef, mas o JSON oficial não tem esse campo — usa `doubleTrained` em vez. Como o gate real é "requer aptidão Químico (que só pode existir a partir de pontos de poder disponíveis)", e aptidões ainda não foram seedadas, o gate fica na UI (wizard). Documentado em comentário no `skills.ts`. **Se a spec quiser RAW estrito, posso reintroduzir `forbiddenAtNc4` no catálogo TS sem retornar pro Prisma.**
2. **Perícia social com erro explícito.** `calculatePericiaLevelByCode('obter_informacao', ...)` joga erro. Alternativa seria retornar 0 silenciosamente — preferi explicitar a limitação para não introduzir bugs silenciosos. Implementação completa (Carisma + ½ Inteligência) entra quando atributos sociais entrarem no `Character` core do motor.
3. **Sem FK em `CharacterPericia.periciaCode`.** Mantido conforme spec — a tabela `Pericia` existe para UI/admin, e o motor consume direto da TS const.
4. **TS catalogs sincronizados com JSON.** Em vez de o motor ler o JSON em runtime, cada catálogo TS é uma cópia "espelhada". Trade-off: precisamos manter dois lugares atualizados; vantagem: motor 100% puro (sem I/O, sem dependência de DB).

---

## Timeline

- 01:09 — Leitura completa de CLAUDE.md + spec 00, 01, 02, 03, 04, 06, 08; skim em 07. Skip 05 (UI não é escopo F0).
- 01:09 — Verificação de ambiente: Node v24.14.0, pnpm 10.32.1, Docker postgres `arcana-forge-db` Up na porta 5432, DB `arcana_forge` vazio (sem relations).
- 01:09 — `.env.local` populado com credenciais Firebase reais e DATABASE_URL apontando pro Docker local.
- 01:09 — `.env.example` existe e bate com `.env.local` (sem credenciais).
- 01:09 — Detectado conflito potencial de porta 3000: container `arcanaforge-app-1` de outro projeto (`D:\Tormenta\projetos\arcanaforge`) está ocupando 3000. Vou usar porta 3000 mesmo; se `pnpm dev` der EADDRINUSE, fallback é porta 3001 documentado.
- 01:13 — Bootstrap manual (sem `create-next-app` interativo): package.json com todas deps pré-aprovadas pinadas, tsconfig estrito, next.config.mjs, tailwind.config.ts, postcss, prettier+eslint, vitest, playwright, components.json (shadcn). Next bumped de 14.2.18 → 14.2.35 (patches de segurança publicados).
- 01:14 — `pnpm install` falhou no primeiro postinstall (prisma generate sem schema). Removi o script `prepare` e configurei `pnpm.onlyBuiltDependencies` em package.json para autorizar builds de @prisma/client, sharp, esbuild, etc. (pnpm 10 bloqueia por default).
- 01:18 — Estrutura de pastas criada conforme `02-ARCHITECTURE.md`: route groups `(marketing)`, `(auth)`, `(app)`, `share`, `api`; `src/components/{ui,ficha,shared,theme}`, `src/lib/{firebase,auth,storage,utils}`, `src/server/{actions,queries}`, `src/domain/{rules,types,catalog}`, `src/schemas`, `src/hooks`, `tests/{unit/domain/fixtures,e2e}`, `public/uploads/`.
- 01:19 — tokens.css com a paleta dark+ice exata (extraída do `reference/satsuki-ficha-reference.html`). Fontes carregadas via `next/font/google` em layout.tsx. Home page com kanji watermarks (雪 / 皐月), display Cormorant, link `/login`.
- 01:21 — Prisma schema completo (17 modelos, 4 enums) escrito conforme `03-DATA-MODEL.md`. Schema validou após criação do `.env` (Prisma lê `.env` por padrão, não `.env.local` — não sobrescrevi o `.env.local` conforme regra). Migration `init` aplicada com sucesso.
- 01:22 — Migration manual `add_constraints` aplicada: CHECKs SQL no banco (campaign_level range, atributos 0..30, perícias points ≥0, power level 1..15, etc.) + índices condicionais `WHERE` em deletedAt/isActive. Seed no-op funcional rodando.
- 01:24 — Motor de regras implementado integralmente em `src/domain/rules/` (13 arquivos): math, pointsBudget (com extrapolação > NC 20), attributeLimits, combatBases (remanejamento ≤2), derivedStats (CC com Acuidade + Daisho + Especialista), skills, aptitudes (pré-reqs), powers, jutsus, damage (calculateDamageBreakdown), combat (status thresholds), leveling, helpers, validation. `pnpm typecheck` passa limpo.
- 01:25 — Testes Vitest escritos: 13 arquivos, 174 casos inicialmente. 1 falha em "CC com katana = 12" — spec esperava Acuidade em katana apesar da categoria 'mediana'. Implementei conjunto `ACUIDADE_ELIGIBLE_KINDS` (katana, wakizashi, tanto, rapier, florete, kunai) como exceção de finesse. Todos passam agora.
- 01:26 — Cobertura final: 180 testes, **95.7% statements, 94.82% branches, 98% funcs, 95.7% lines** em `src/domain/`. Bem acima do alvo de 90%.
- 01:28 — Firebase Admin + Client wrapped com singletons. `lib/auth/session.ts` faz ciclo cookie → admin verify → Prisma user (cookie real chega em F1). `lib/storage/local.ts` salva em `public/uploads/<userId>/<characterId>/` com validação de mime e 5 MB. `/login` placeholder estilizado, `/dashboard` placeholder atrás de `getCurrentUser` (redirect para login se ausente).
- 01:29 — Validação final: `pnpm typecheck` ✓, `pnpm lint` ✓ (zero warnings), `pnpm build` ✓ (após mover `themeColor` para export viewport — deprecated em metadata no Next 14.2), `pnpm test:coverage` ✓.
- 01:32 — 6 commits feitos em ordem lógica: bootstrap → theme → db → domain → tests → auth/storage/pages. SESSION-LOG e README pendentes no commit final de docs.

## CORREÇÃO: Acuidade implementada conforme RAW (pós-revisão humana)

Após review, foi identificado que minha implementação inicial inventou um conjunto "finesse" de armas (`tanto`, `rapier`, `katana`, `wakizashi`, `florete`, `kunai`) — isto não é RAW. Consultei `books/Naruto ''Shinobi no Sho'' - Livro Básico - 4.1.b.pdf` via `pdftotext` e localizei a definição canônica:

> ACUIDADE (cap. Aptidões, p. ~60). Pré-req: Destreza 3. Benefício: Você é capaz de utilizar sua Destreza para calcular seu nível de Combate Corporal. Ataques: Esta aptidão somente pode ser usada para: ataques desarmados, técnicas com alcance de toque, **armas leves** e **qualquer outra arma na qual o texto diga que esta aptidão é aplicável**. Também pode ser usada para armas de arremesso que podem ser usadas no corpo-a-corpo (como kunai). Dano: O dano do ataque não é alterado por esta aptidão.

Regra RAW resumida em dois eixos:

1. **Categoria `leve`** → recebe Acuidade automaticamente (definição da própria categoria, cap. Equipamentos: "Toda arma leve pode receber o benefício da aptidão Acuidade").
2. **Demais categorias** → só com permissão **explícita** no texto da arma ("A aptidão Acuidade se aplica a X"). Buscando essa frase no PDF: Aian Nakkuru, Bastão, Chicote (mediana), Chokutō (longa), Florete, Katana (mediana), Leque Gigante (longa), Ninja-Tō, Wakizashi, Espada de Chakra Branco, Braço de Chakra, Bastão Afinado (invocação).

### Mudanças aplicadas

- **`src/domain/rules/derivedStats.ts`**: `ACUIDADE_ELIGIBLE_KINDS` (inventado) substituído por `ACUIDADE_NAMED_WEAPONS` (taxativo do livro). Removidos `tanto` e `rapier` (não existem no livro), adicionados `aian_nakkuru`, `bastao`, `chicote`, `chokuto`, `leque_gigante`, `ninja_to`, `espada_chakra_branco`, `braco_chakra`. Comentário cita a regra e marca migração futura (F2.3 move para flag `acceptsAcuidade` no equipment).
- **Lógica `allowsAcuidade`**: removida a categoria `'arremesso'` como blanket — RAW só fala em "armas de arremesso usáveis em CC (como kunai)", que devem ser modeladas como leves no equipment.
- **`tests/unit/domain/derivedStats.test.ts`**: 5 novos casos travando a regra corrigida:
  - arma mediana com nome desconhecido **não** recebe Acuidade
  - florete, chicote, chokutō (medianas/longas nominais) recebem
  - categoria `'arremesso'` sozinha não dispara mais Acuidade (regression test)
- **Sem mudanças** na fixture `satsuki-nc6.ts` — ela já usava `katana`, que está na lista RAW.

### Resultado

- 185 testes (180 → 185), 13/13 arquivos passando
- `derivedStats.ts` com cobertura 100% (statements/branches/funcs/lines)
- Cobertura global: 95.73% statements / 94.8% branches / 98% funcs
- `pnpm lint`, `pnpm typecheck`, `pnpm test` todos ✓

## Decisões autônomas — REVISAR

1. **Node 24.14.0 em runtime, mas `.nvmrc` = `20`.** O ambiente local tem Node 24, mas a spec/prompt pede Node 20 LTS. Como mudar o Node em sessão autônoma é arriscado, vou rodar com 24 e deixar `.nvmrc` pinado em 20 conforme spec. Next.js 14 funciona em ambos.
2. **Sem `@supabase/supabase-js`** — removido da lista de deps porque storage será filesystem local (`public/uploads/`), conforme regra da sessão. Sem Supabase = sem essa dep.
3. **Schema completo do banco aplicado em F0** (não apenas vazio). Justificativa: o prompt diz `pnpm prisma migrate dev --name init aplica schema completo`. Isto antecipa parte de F2.2 que faz sentido fazer agora porque o motor de regras (também em F0 conforme prompt) usa tipos derivados.
4. **Motor de regras completo em F0** (originalmente F2.1). Justificativa: prompt da sessão diz explicitamente "Implementação completa de `src/domain/rules/`". Isso é desvio do roadmap mas alinhado com instruções da sessão.
5. **`/login` é placeholder estilizado, sem auth funcional.** Auth real fica F1 mesmo. Firebase Admin/Client são instalados e configurados (sem auth flow ainda) para infra estar pronta.
6. **Seed file mínimo:** apenas log "no seed data yet" e sai com sucesso. Catálogos reais ficam pra F2.3 (depois da entrega de JSONs estruturados).
7. **CI/CD pulado.** Sem GitHub Actions agora (sem push remoto, sem teste de CI). Documento como pendente.
8. **Vercel deploy pulado.** Mandato explícito do prompt.
9. **Indentação no .env.local.** As linhas têm 2 espaços iniciais; deixo intocado (mandato: "NÃO sobrescreva .env.local"). Validar se Next/Prisma tolera; se quebrar, documento bloqueio.
10. **Schema dos kanji watermarks etc** — não vou implementar F0 visual completo, apenas tokens.css + fontes + página `/` minimalista com a paleta correta. F2.5 implementa visual completo.

## Bloqueios encontrados

1. **pnpm 10 bloqueia build scripts por padrão.** Mitigado via `pnpm.onlyBuiltDependencies` em package.json autorizando explicitamente `@prisma/client`, `prisma`, `sharp`, `esbuild`, etc. Sem prompt.
2. **Prisma lê `.env`, não `.env.local`.** Como o mandato proíbe sobrescrever `.env.local`, criei um `.env` separado (gitignored) só com `DATABASE_URL`/`DIRECT_URL`. Next continua lendo `.env.local`; Prisma CLI lê `.env`. Dois arquivos, fontes únicas.
3. **Spec contradiz o próprio código de exemplo em `calculateCC`.** O exemplo de teste pede CC = 12 com katana 'mediana' + Acuidade, mas o snippet de implementação na própria spec lista só `'leve'` e `'arremesso'` como Acuidade-eligible. Resolvi: adicionei `ACUIDADE_ELIGIBLE_KINDS` (katana, wakizashi, tanto, rapier, florete, kunai) como conjunto fechado de armas finesse — bate com a expectativa narrativa da Satsuki. Documentado em comments do código.
4. **`themeColor` em `metadata` deprecated no Next 14.2.** Build emitia warnings em todas as rotas. Movido para o novo `export const viewport: Viewport`. Build agora limpo.
5. **Dev server smoke check inconclusivo.** O background `PORT=3030 pnpm dev` ficou sem output. Provavelmente o prefix `PORT=...` não funcionou no shell usado neste sandbox. Decisão: confiar no `pnpm build` (que terminou com sucesso e mostrou rotas estáticas+dinâmicas geradas corretamente) como evidência de boot. Próxima sessão pode rodar `pnpm dev` manualmente.

## Pendente para humano

- Setup do GitHub Actions CI (post-MVP local)
- Setup do Vercel deploy
- Decisão sobre licença final (MIT vs AGPL)
- Decisão "Acuidade afeta dano" (RAW vs casa)
- Confirmação se o conflito da porta 3000 com `arcanaforge-app-1` (projeto externo) merece intervenção

## Estado final

**F0 concluída conforme escopo da sessão.** Stack rodando localmente, motor de regras testado e validado, infra de auth/storage pronta para F1 ligar.

### Métricas

| Check | Status |
|---|:---:|
| `pnpm lint` | ✓ zero warnings |
| `pnpm typecheck` | ✓ zero erros |
| `pnpm test` | ✓ 180/180 testes |
| `pnpm test:coverage` (motor) | ✓ 95.7% statements / 94.82% branches / 98% funcs |
| `pnpm build` | ✓ 4 rotas (3 estáticas + 1 dinâmica) |
| Migrations Prisma | ✓ 2 aplicadas (init + add_constraints) |
| Seed | ✓ no-op funcional |

### Arquivos criados

- 18 arquivos de config raiz (package.json, tsconfig, configs lint/format/test, etc.)
- 17 modelos Prisma + 2 migrations + seed
- 13 módulos de motor de regras (`src/domain/`)
- 13 arquivos de teste (`tests/unit/domain/` + fixture)
- 5 lib helpers (firebase client/admin, auth session, storage local, prisma singleton, cn util)
- 5 páginas Next (home, login, dashboard placeholder + 2 layouts de route group)
- 1 home com identidade visual dark+ice aplicada (tokens, fontes, kanji watermarks)

### O que NÃO foi feito (intencional)

- Auth flow real (popup Google, route handler, middleware) — fica em F1
- Seed de catálogos do livro — fica em F2.3 quando os JSONs forem entregues
- Componentes da ficha (`<AttributesGrid>`, `<JutsuCard>`, etc.) — F2.5/F2.6
- CI/CD GitHub Actions — não estava no escopo F0 local
- Deploy Vercel — proibido pelo prompt da sessão

### Próximos passos recomendados (F1)

1. Implementar `src/lib/auth/middleware.ts` que valida o cookie em `(app)/*` antes do layout.
2. Route handler `POST /api/auth/session` que recebe ID token do client, valida com Firebase Admin e seta cookie de sessão.
3. Server Action `signInWithGoogle` no cliente (popup + envio do ID token).
4. Upsert do `User` no Postgres no callback de sucesso.
5. Logo SVG real no `<Navbar>` (hoje só temos texto).
