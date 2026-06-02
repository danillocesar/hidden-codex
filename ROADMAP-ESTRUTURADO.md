# Arcana Forge - Roadmap e Backlog Estruturado

Ultima revisao: 2026-06-01

Este documento consolida o estado real observado no codigo com as pendencias do
backlog existente. Ele nao substitui a spec em `arcana-forge-spec/`, mas serve
como guia operacional atualizado para decidir o que fazer a seguir.

## Estado Atual

### Ja entregue

- Bootstrap Next.js 14, TypeScript, Tailwind, Prisma e Postgres.
- Firebase Auth com login Google, session cookie HTTP-only, middleware e shell autenticado.
- Schema Prisma amplo para usuarios, personagens, catalogos, inventario, diario, imagens e compartilhamento.
- Motor de regras puro em `src/domain/rules/`, com cobertura forte em atributos, pontos, pericias, aptidoes, poderes, efeitos, dano, combate e level-up.
- Seed de catalogos bem avancado em `prisma/seed-data/`, com poderes, efeitos, aptidoes, equipamentos, clans, vilas, kekkei genkais e pericias.
- Wizard de criacao em `/characters/new`, com 7 passos, validacao no client e no servidor, beneficios de origem e persistencia transacional.
- Ficha read-only inicial em `/characters/[id]`, com auth/ownership check, mapper Prisma -> dominio, header e hero.
- Upload local de retrato via `/api/upload/character-portrait`.
- Testes unitarios/integracao cobrindo motor, auth, seed e schema de criacao.

### Parcial

- Dashboard existe, mas ainda mostra empty state e nao lista personagens.
- Ficha renderiza apenas header/hero; blocos de stats, pericias, aptidoes, jutsus, combate e inventario ainda sao placeholders.
- Wizard parece funcional, mas ainda precisa de teste manual responsivo e E2E de criacao.
- `learnedEffects` e `narrativeFlags` existem no dominio, mas nao persistem no Prisma.
- Documentacao raiz esta desatualizada em alguns pontos, especialmente README e topo do BACKLOG.

### Ainda nao iniciado

- Editor da ficha.
- Uso em mesa: usar jutsu, gastar chakra, tomar dano, curar.
- Sistema guiado de subida de NC.
- Diario na UI.
- Compartilhamento publico completo.
- Dashboard com busca/filtros/delete.
- E2E critico com Playwright.
- Deploy, CI e polish de acessibilidade/performance.

## Norte do MVP

O MVP deve provar uma jornada completa:

1. Usuario loga.
2. Usuario cria Satsuki ou personagem equivalente no wizard.
3. Usuario ve a ficha completa e bonita.
4. Usuario edita a ficha sem quebrar regras.
5. Usuario usa a ficha em mesa para gastar chakra, calcular dano e tomar dano.
6. Usuario compartilha um link publico read-only.

Tudo que nao ajuda essa jornada deve ficar para pos-MVP.

## Roadmap Por Fases

### Fase 0 - Estabilizacao Imediata

Objetivo: alinhar documentacao, validar fluxo existente e remover blockers obvios.

Prazo sugerido: 2 a 4 dias.

Entregas:

- Rodar `pnpm test`, `pnpm typecheck`, `pnpm lint` e registrar estado real.
- Atualizar README com estado atual do projeto.
- Validar wizard manualmente em desktop e mobile.
- Criar teste E2E minimo: login mockado/seed local -> criar personagem -> abrir ficha.
- Resolver ou documentar worktree suja em seed-data.
- Decidir persistencia de `learnedEffects` e `narrativeFlags`.

Saida esperada:

- Base verde ou falhas conhecidas.
- Documentacao nao enganosa.
- Wizard considerado pronto ou lista curta de bugs.

### Fase 1 - Ficha Read-only Completa

Objetivo: transformar `/characters/[id]` na ficha completa e apresentavel.

Prazo sugerido: 1 a 2 semanas.

Entregas:

- Stats derivados: Vitalidade, Chakra, CC, CD, ESQ, LM.
- Grid de atributos.
- Bloco de pericias.
- Bloco de aptidoes.
- Bloco de poderes e efeitos/jutsus criados pelo wizard.
- Bloco de combate.
- Bloco de inventario.
- Estado visual responsivo desktop/mobile.
- Secoes colapsaveis, inicialmente local; persistencia pode entrar na fase 2 se necessario.

Saida esperada:

- Uma ficha criada pelo wizard pode ser aberta e entendida sem editor.
- Numeros derivados batem com o motor.
- Layout deixa de ter placeholders funcionais.

### Fase 2 - Dashboard Operacional

Objetivo: permitir que o usuario navegue pelos personagens criados.

Prazo sugerido: 3 a 5 dias.

Entregas:

- Query de personagens do usuario.
- Cards com retrato, nome, NC, clan/vila, atualizado em.
- Empty state mantido apenas para conta sem personagens.
- Busca por nome.
- Filtros simples por NC e vila/clan.
- Soft delete com confirmacao.

Saida esperada:

- Depois de criar uma ficha, ela aparece no dashboard.
- Usuario consegue abrir e remover personagens sem ir direto por URL.

### Fase 3 - Editor Da Ficha

Objetivo: permitir edicao segura da ficha com validacao de regras.

Prazo sugerido: 2 semanas.

Entregas:

- Rota `/characters/[id]/edit`.
- Edicao de identidade, atributos, bases, pericias, aptidoes, poderes e efeitos.
- Badge de orcamento restante.
- Validacao client-side usando motor.
- Server action defensiva que recalcula e valida tudo antes de salvar.
- Autosave ou save explicito; escolher um padrao e manter consistente.
- Modal/picker de aptidoes com pre-requisitos.
- Modal/picker de poderes e efeitos.

Saida esperada:

- Usuario consegue corrigir e evoluir uma ficha sem editar banco.
- Servidor impede estados invalidos mesmo se client mentir.

### Fase 4 - Uso Em Mesa

Objetivo: fazer a ficha virar ferramenta durante sessao.

Prazo sugerido: 1 a 2 semanas.

Entregas:

- Modal de jutsu com custo, alcance, dano e graus.
- Action `useJutsu`: deduz chakra e registra feedback.
- Modal de tomar dano/curar.
- Action de restaurar chakra.
- Status visual de vitalidade: normal, fora de combate, inconsciente, agonizando, morto.
- Historico simples de eventos recentes opcional.

Saida esperada:

- Jogador consegue usar jutsu, gastar chakra e atualizar vida durante jogo.
- Calculos exibidos batem com `src/domain/rules/damage.ts`, `jutsus.ts` e `combat.ts`.

### Fase 5 - Level-up E Diario

Objetivo: cobrir progressao e registro narrativo.

Prazo sugerido: 1 a 2 semanas.

Entregas:

- Rota ou modal de subir NC.
- `getLevelUpDelta` integrado na UI.
- Validacao de minimos novos e pontos ganhos.
- Diario por personagem com CRUD.
- Markdown preview com `react-markdown` e `remark-gfm`.
- Filtro simples por tag.

Saida esperada:

- Personagem pode ir de NC 6 para 7 sem quebrar regras.
- Jogador registra sessoes dentro da ficha.

### Fase 6 - Compartilhamento E Polish MVP

Objetivo: fechar o ciclo publico e preparar lancamento.

Prazo sugerido: 1 a 2 semanas.

Entregas:

- Link publico read-only por personagem.
- Rota `/share/[token]`.
- Controle de ativar/desativar link.
- View count e ultimo acesso, se ja estiver barato de usar.
- Testes E2E principais.
- Revisao mobile 375px, tablet e desktop.
- Lighthouse/accessibility baseline.
- README, env example e setup atualizados.

Saida esperada:

- Uma ficha pode ser compartilhada com mestre/grupo por link.
- MVP esta pronto para uso real local ou primeiro deploy.

### Fase 7 - Deploy E Operacao

Objetivo: tirar do localhost.

Prazo sugerido: 3 a 5 dias.

Entregas:

- Banco Supabase ou Postgres gerenciado configurado.
- Storage escolhido: local em dev, Supabase em producao ou decisao explicita de manter local.
- Vercel deploy.
- GitHub Actions: lint, typecheck, test.
- Variaveis de ambiente documentadas.
- Smoke test pos-deploy.

Saida esperada:

- App acessivel fora da maquina local.
- Pipeline bloqueia regressao basica.

## Backlog Priorizado

### P0 - Fazer Agora

#### P0.1 Validar estado da base

Tipo: qualidade

Arquivos principais:

- `package.json`
- `vitest.config.ts`
- `tests/`

Tarefas:

- Rodar `pnpm test`.
- Rodar `pnpm typecheck`.
- Rodar `pnpm lint`.
- Registrar falhas e separar entre bug real, ambiente e teste desatualizado.

Criterios de aceite:

- Resultado dos comandos documentado.
- Falhas bloqueantes viram cards P0.

#### P0.2 Atualizar README

Tipo: documentacao

Arquivos principais:

- `README.md`
- `BACKLOG.md`

Tarefas:

- Corrigir estado atual: auth ja existe, wizard ja existe, seed ja existe.
- Ajustar scripts: `db:seed` nao e mais no-op.
- Apontar `ROADMAP-ESTRUTURADO.md` como guia operacional atualizado.

Criterios de aceite:

- Novo contribuidor nao sai com ideia errada da maturidade do projeto.

#### P0.3 Testar wizard manualmente

Tipo: QA

Arquivos principais:

- `src/app/(app)/characters/new/WizardClient.tsx`
- `src/app/(app)/characters/new/steps/`
- `src/server/actions/characters/create.ts`

Tarefas:

- Criar personagem NC 6 usando fixture Satsuki.
- Criar personagem manual sem clan/KG.
- Testar mobile 375px e tablet 768px.
- Verificar redirect para `/characters/[id]`.

Criterios de aceite:

- Personagem criado aparece no banco.
- `/characters/[id]` abre sem erro.
- Sem overflow ou texto quebrado em mobile.

#### P0.4 Decidir persistencia de efeitos aprendidos

Tipo: arquitetura

Arquivos principais:

- `prisma/schema.prisma`
- `src/domain/types/character.ts`
- `src/lib/character/mapPrismaToCore.ts`

Tarefas:

- Decidir entre persistir `learnedEffects`/`narrativeFlags` no `Character` ou derivar de `CharacterJutsu`.
- Se persistir, criar migration.
- Se derivar, atualizar mapper para popular `learnedEffects` a partir de jutsus/effects.

Criterios de aceite:

- `CharacterCore.learnedEffects` nao fica sempre vazio em fluxo real.
- Pre-requisitos baseados em efeitos podem funcionar fora do wizard.

### P1 - Ficha Read-only

#### P1.1 Completar mapper da ficha

Tipo: backend

Arquivos principais:

- `src/server/queries/characterById.ts`
- `src/lib/character/mapPrismaToCore.ts`

Tarefas:

- Incluir `jutsus`, `inventory` e `images` na query.
- Montar view model com nomes/descricoes necessarios para UI.
- Garantir que dados sensiveis nao vazam para personagem publico.

Criterios de aceite:

- Ficha tem todos os dados necessarios sem queries extras no client.

#### P1.2 Componentes de stats e atributos

Tipo: frontend

Arquivos principais:

- `src/components/character/ficha/AttributesGrid.tsx`
- `src/components/character/ficha/CharacterSummary.tsx`
- `src/domain/rules/derivedStats.ts`

Tarefas:

- Mostrar atributos primarios.
- Mostrar vitalidade/chakra maximos e atuais.
- Mostrar CC, CD, ESQ e LM calculados.

Criterios de aceite:

- Numeros da ficha batem com testes do motor para fixture Satsuki.

#### P1.3 Secoes de pericias, aptidoes e poderes

Tipo: frontend

Arquivos principais:

- `src/components/character/ficha/`
- `src/domain/rules/skills.ts`

Tarefas:

- Renderizar pericias com pontos e total calculado.
- Renderizar aptidoes com nome, categoria e origem gratis quando aplicavel.
- Renderizar poderes com nivel e niveis gratis.

Criterios de aceite:

- Ficha mostra escolhas do wizard de forma legivel.

#### P1.4 Secao de jutsus e efeitos

Tipo: frontend

Arquivos principais:

- `src/components/character/ficha/`
- `src/domain/rules/jutsus.ts`
- `src/domain/rules/damage.ts`

Tarefas:

- Mostrar jutsus gerados a partir dos efeitos selecionados.
- Exibir poder, efeito, custo base e dano/alcance quando disponivel.
- Preparar estrutura para modal da Fase 4.

Criterios de aceite:

- Jutsus criados no wizard aparecem na ficha.

#### P1.5 Responsividade e referencia visual

Tipo: frontend/design

Arquivos principais:

- `src/app/(app)/characters/[id]/page.tsx`
- `src/components/character/ficha/`
- `src/styles/tokens.css`
- `arcana-forge-spec/reference/satsuki-ficha-reference.html`

Tarefas:

- Aproximar layout da referencia dark+ice.
- Testar mobile e desktop.
- Evitar cards aninhados e placeholders temporarios.

Criterios de aceite:

- Ficha parece produto real, nao tela tecnica.
- Mobile rola bem sem sobreposicao.

### P2 - Dashboard

#### P2.1 Listar personagens

Tipo: full-stack

Arquivos principais:

- `src/app/(app)/dashboard/page.tsx`
- `src/server/queries/`

Tarefas:

- Buscar personagens do usuario autenticado.
- Filtrar `deletedAt: null`.
- Renderizar grid responsivo.

Criterios de aceite:

- Personagem criado aparece imediatamente no dashboard.

#### P2.2 Card de personagem

Tipo: frontend

Arquivos principais:

- `src/components/dashboard/CharacterCard.tsx`

Tarefas:

- Criar componente de card.
- Mostrar retrato, nome, NC, rank, clan/vila e data de atualizacao.
- Linkar para `/characters/[id]`.

Criterios de aceite:

- Dashboard permite abrir ficha sem digitar URL.

#### P2.3 Busca, filtros e delete

Tipo: full-stack

Arquivos principais:

- `src/app/(app)/dashboard/page.tsx`
- `src/server/actions/characters/delete.ts`

Tarefas:

- Busca por nome.
- Filtros por NC e origem.
- Soft delete com modal de confirmacao.

Criterios de aceite:

- Usuario com muitas fichas consegue encontrar e remover itens.

### P3 - Editor

#### P3.1 Rota de edicao

Tipo: full-stack

Arquivos principais:

- `src/app/(app)/characters/[id]/edit/page.tsx`
- `src/server/actions/characters/`

Tarefas:

- Criar rota protegida por ownership.
- Reusar view model da ficha.
- Definir padrao save explicito ou autosave.

Criterios de aceite:

- Dono acessa editor; visitante/publico nao acessa.

#### P3.2 Edicao de atributos, bases e pericias

Tipo: full-stack

Arquivos principais:

- `src/domain/rules/attributeLimits.ts`
- `src/domain/rules/combatBases.ts`
- `src/domain/rules/skills.ts`

Tarefas:

- Controles numericos.
- Mostrar budgets usados/restantes.
- Validar no client e servidor.

Criterios de aceite:

- Impossivel salvar atributos/pericias fora do budget.

#### P3.3 Edicao de aptidoes, poderes e efeitos

Tipo: full-stack

Arquivos principais:

- `src/domain/rules/aptitudes.ts`
- `src/domain/rules/powers.ts`
- `src/domain/rules/effects.ts`

Tarefas:

- Picker com busca/filtro.
- Exibir pre-requisitos cumpridos/faltantes.
- Validar efeitos disponiveis por poder e nivel.

Criterios de aceite:

- Usuario entende por que uma opcao esta bloqueada.
- Server rejeita combinacao invalida.

### P4 - Uso Em Mesa

#### P4.1 Modal de jutsu

Tipo: frontend

Arquivos principais:

- `src/components/character/ficha/`
- `src/domain/rules/jutsus.ts`
- `src/domain/rules/damage.ts`

Tarefas:

- Exibir custo, alcance, dano e graus.
- Permitir selecionar nivel usado/modificadores simples.

Criterios de aceite:

- Usuario consegue calcular dano sem sair da ficha.

#### P4.2 Action de usar jutsu

Tipo: backend

Arquivos principais:

- `src/server/actions/characters/useJutsu.ts`
- `src/domain/rules/combat.ts`

Tarefas:

- Deduzir chakra.
- Bloquear chakra insuficiente.
- Revalidar ownership.

Criterios de aceite:

- Chakra atual muda no banco e na UI.

#### P4.3 Tomar dano, curar e restaurar chakra

Tipo: full-stack

Arquivos principais:

- `src/domain/rules/combat.ts`
- `src/server/actions/characters/`

Tarefas:

- Modal de dano/cura.
- Modal de restaurar chakra.
- Status visual por thresholds.

Criterios de aceite:

- Vitalidade e chakra respeitam maximos/minimos esperados.

### P5 - Level-up E Diario

#### P5.1 Level-up guiado

Tipo: full-stack

Arquivos principais:

- `src/domain/rules/leveling.ts`
- `src/app/(app)/characters/[id]/levelup/`

Tarefas:

- Mostrar delta de pontos.
- Aplicar novo NC.
- Validar minimos e gastos.

Criterios de aceite:

- NC 6 -> 7 funciona com caso Satsuki.

#### P5.2 Diario

Tipo: full-stack

Arquivos principais:

- `prisma/schema.prisma`
- `src/components/character/ficha/`
- `src/server/actions/diary/`

Tarefas:

- Listar entradas.
- Criar, editar, deletar.
- Markdown com preview.
- Filtrar por tag.

Criterios de aceite:

- Entradas persistem e aparecem na ficha.

### P6 - Compartilhamento

#### P6.1 Links publicos

Tipo: full-stack

Arquivos principais:

- `prisma/schema.prisma`
- `src/app/share/[token]/page.tsx`
- `src/server/actions/share/`

Tarefas:

- Criar/revogar token.
- Renderizar ficha read-only sem login.
- Incrementar view count se mantido.

Criterios de aceite:

- Link publico abre ficha sem vazar editor/dados privados.

#### P6.2 Perfil publico minimo

Tipo: frontend/backend

Arquivos principais:

- `src/app/u/[user]/`

Tarefas:

- Listar personagens marcados como publicos.
- Sem discovery/busca global no MVP.

Criterios de aceite:

- Usuario pode mostrar uma pagina publica simples.

### P7 - Qualidade, Deploy E Operacao

#### P7.1 E2E critico

Tipo: teste

Arquivos principais:

- `tests/e2e/`
- `playwright.config.ts`

Tarefas:

- Criar personagem.
- Abrir dashboard.
- Abrir ficha.
- Usar jutsu.
- Compartilhar ficha.

Criterios de aceite:

- 3 a 5 fluxos rodam em ambiente local/CI.

#### P7.2 CI

Tipo: devops

Arquivos principais:

- `.github/workflows/ci.yml`

Tarefas:

- Rodar install, lint, typecheck e test.
- Opcional: Playwright em PR.

Criterios de aceite:

- PR quebrado nao passa silenciosamente.

#### P7.3 Deploy

Tipo: devops

Arquivos principais:

- `README.md`
- `.env.example`
- `next.config.mjs`

Tarefas:

- Configurar Vercel.
- Configurar banco gerenciado.
- Definir storage de producao.
- Rodar migrations e seed.

Criterios de aceite:

- App acessivel publicamente com login e criacao funcionando.

## Dividas Tecnicas

### DT.1 Documentacao desatualizada

README e BACKLOG raiz possuem informacoes antigas. Prioridade alta porque isso
confunde proximas sessoes de trabalho.

### DT.2 Persistencia de `learnedEffects` e `narrativeFlags`

O dominio espera esses campos, mas o mapper atual popula arrays vazios. Isso
afeta pre-requisitos que dependem de efeitos aprendidos ou aprovacoes narrativas.

### DT.3 Refs parametrizadas

Algumas aptidoes usam strings compostas como `perito_medicina` e
`usar_arma_katana`. Funciona via split runtime, mas uma estrutura explicita
`{ code, parameter }` seria mais robusta.

### DT.4 Seed data com alteracoes locais

Ha alteracoes nao commitadas em arquivos de efeitos. Antes de mexer em seed,
entender se sao ajustes intencionais e rodar validador.

### DT.5 Storage local vs Supabase

O projeto usa storage local em `public/uploads/`, enquanto a spec antiga fala em
Supabase Storage. Manter decisao explicita por ambiente.

## Definicao De Pronto

Uma feature so deve ser considerada pronta quando:

- Passa por validacao server-side.
- Tem comportamento vazio/erro/loading quando aplicavel.
- Funciona em mobile 375px e desktop.
- Tem pelo menos teste unitario para regra ou action critica.
- Nao quebra `pnpm typecheck`.
- Atualiza doc/backlog quando muda escopo ou decisao.

## Proximas 5 Acoes Recomendadas

1. Rodar suite de qualidade e registrar estado real.
2. Atualizar README para refletir auth, seed e wizard existentes.
3. Validar wizard no browser com fixture Satsuki e viewport mobile.
4. Completar ficha read-only: stats, atributos, pericias, aptidoes e jutsus.
5. Fazer dashboard listar personagens criados.
