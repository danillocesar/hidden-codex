# Handoff — sessão Fase 4 (combate) + limpeza (jun/2026)

Branch: **`test-lazy-web`** · commits **locais (sem push)** · suíte **495 testes verdes**, typecheck e lint limpos.

> Guia operacional de escopo em `ROADMAP-ESTRUTURADO.md`; convenções em `CLAUDE.md`. Este arquivo é o resumo pra **retomar em outra sessão**.

## Estado atual (jornada do MVP: loga → cria → vê → editar ⬜ → joga ✅ → compartilha ⬜)

- **Fundação**: Next 14 + TS estrito + Tailwind + Prisma/Postgres (Docker) + Firebase Auth real.
- **Motor de regras** (`src/domain/rules/`) completo.
- **Wizard** de criação (`/characters/new`) — 8 passos com inventário.
- **Ficha read-only** (`/characters/[id]`) — completa (hero, combate rápido, talentos/perícias/aptidões, técnicas/jutsus, inventário, capas com pan+zoom, fundo).
- **Dashboard** (`/dashboard`) — grid, busca, filtros (NC/origem), soft delete.
- **Fase 4 — Uso em mesa** (entregue nesta leva):
  - Calculadora de dano (`DamageCalculatorTable`) por grau (DDA·½·NV·Elem·Outro·Total·graus 1-4).
  - **Modal de jutsu** (`JutsuUseModal`): tabs de nível, Ataque Poderoso, Canhão-sem-chakra, **Usar Jutsu** (debita chakra). Efeitos sem dano (Névoa/Barreira/Criar Arma) não mostram calculadora.
  - **Modal de ataque** (`WeaponAttackModal`): Ataque Poderoso + Múltiplo.
  - **Energias clicáveis** (`EnergyAdjuster` + `EnergyAdjustModal`): Tomar Dano/Curar, Gastar/Restaurar Chakra, com status (agonizando/morto).
  - Server actions em `src/server/actions/characters/combat.ts` (`useJutsu`, `adjustVitality`, `adjustChakra`) — owner-only, recalculam máximos no servidor.
  - **Toasts** (`ui/toast.tsx`, provider no `(app)/layout`) no topo-direito; **skeleton** de imagem (`ui/image-with-skeleton.tsx`) em retrato/capa/card de jutsu.

## Decisões e gotchas desta sessão

- **Acuidade RAW** mantida (não afeta dano). Para homebrew, criamos a aptidão **`acuidade_homebrew`** ("Acuidade (Homebrew)") que usa Des no dano de CC (só em arma que aceita Acuidade). Flag desce via `abilities` na page → `QuickCombatPanel` → modais.
- **Toggles gateados**: Ataque Poderoso só em ataque CC **e** se o personagem tem a aptidão; Ataque Múltiplo só com a aptidão. Confirmado no livro (Ataque Poderoso é corpo-a-corpo).
- **Fuuton +2 de dano base** em todos os efeitos (`domain/rules/elements.ts`; Katon comentado p/ habilitar). Entra como componente `elemento` no breakdown e é dividido junto no Canhão-sem-chakra.
- **Névoa** = efeito de **nível fixo** (`stats.scaling:false`), custo de chakra = nível do efeito (`chakraCost:"nivel_do_efeito"` → 2). Mapper expõe ação/alvo/área/pré-requisito; editor não pede multi-nível pra efeitos `scaling:false`.
- **Perícia social Obter Informação** = Carisma + ½ Int (`calculateSocialPericiaLevel`; catálogo ganhou `socialRequiredAttribute`).
- **Portais (React) borbulham pela árvore de componentes**, não a do DOM: `InfoDrawer` faz `stopPropagation` na raiz pra não disparar o onClick da linha do Combate Rápido. `Toaster` só monta o portal pós-hidratação (evita mismatch).
- **Imagem com cache** completa antes do `onLoad`: `ImageWithSkeleton` usa `key={src}` + checa `img.complete` no efeito (senão a img some/skeleton trava).

## Pendências (próximos passos)

1. **Editor da ficha (F3)** — `characters/[id]/edit` vazio. Maior lacuna da jornada principal.
2. **Compartilhamento público (F6)** — `share/[token]` vazio. Menor, alto valor de demo.
3. **Level-up + Diário (F5)** — `characters/[id]/diary` vazio.
4. **DT.6 (ROADMAP)**: ~38 efeitos avançados sem `rollType` no seed — preencher caso-a-caso com o livro (não chutar).
5. **README** raiz pode estar desatualizado.
6. `.claude/hooks/` untracked — decidir versionar. **`git push`** pendente (tudo local).

## Como rodar

```bash
docker start arcana-forge-db          # Postgres local
pnpm dev                              # localhost:3000
pnpm lint && pnpm typecheck && pnpm test
pnpm tsx scripts/backfill-learned-effects.ts [--apply]   # backfill de fichas legadas
# migrations/seed (pare o dev antes no Windows):
pnpm prisma migrate dev --name <nome>
pnpm prisma db seed                   # reaplica catálogos (Névoa, acuidade_homebrew, etc.)
```
