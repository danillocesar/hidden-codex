# Handoff — sessão ficha/UI (jun/2026)

Branch: **`test-lazy-web`** · commits **locais (sem push)** · suíte **467 testes verdes**, typecheck e lint limpos.

> Guia operacional de escopo segue em `ROADMAP-ESTRUTURADO.md`; convenções em `CLAUDE.md`. Este arquivo é o resumo pra **retomar em outra sessão**.

## Estado atual (o que funciona)

- **Fundação**: Next 14 + TS estrito + Tailwind + Prisma/Postgres (Docker) + Firebase Auth real.
- **Motor de regras** (`src/domain/rules/`) completo, 467 testes.
- **Seed** de catálogos populado (aptidões, poderes, efeitos, equipamentos, clãs, vilas, KGs).
- **Wizard** de criação (`/characters/new`) — 8 passos, incluindo **inventário**.
- **Ficha read-only** (`/characters/[id]`) — completa e alinhada à `arcana-forge-spec/reference/satsuki-ficha-reference.html`:
  - **Hero**: retrato (clicável p/ o dono trocar) + Atributos · Energias · Habilidades de Combate · Sociais; **Combate Rápido** (tabela Acerto/Dano/Chakra/Níveis).
  - **Talentos e Perícias**: Aptidões, Poderes (com efeitos aprendidos), Perícias (todas, base do atributo nas não-treinadas, ordenadas).
  - **Técnicas**: cards de **jutsu** (criação real via JutsuEditor, troca de imagem, ícone de info → drawer com a descrição do efeito; "ver descrição" também abre o drawer).
  - **Arquivo**: Inventário (checkbox "equipada" alimenta o Combate Rápido).
  - **Capas de seção**: trocar/escolher imagem + **ajustar (pan + zoom)** — controles só no hover, atrás de um toggle "Ajustar".
  - **Fundo da ficha inteira** (imagem P&B + overlay, full screen) via botão "Fundo".
- **Dashboard** (`/dashboard`): grid de cards, busca por nome, filtros (NC/origem), soft delete.

## Decisões e gotchas desta sessão

- **Efeitos aprendidos** persistem em `Character.learnedEffects` (JSON `Record<powerCode, effectCode[]>`), **não** mais derivados de `CharacterJutsu`. `CharacterJutsu` é reservado para jutsus reais. (migration `add_character_learned_effects`)
- Migrations novas: `add_inventory_equipped` (`CharacterInventoryItem.equipped`), `add_jutsu_levels` (`CharacterJutsu.levels Int[]`), `add_character_learned_effects`.
- **"Comum do poder"** resolvido com Espírito no motor (`jutsus.ts`): `commonPowerRange = 10 + 2×Esp`, `commonPowerDifficulty = 9 + nível + ⌈Esp/2⌉`, `commonPowerSize = Esp`; dano base = `calculateNinpouBaseDamage`. Card/Combate mostram valores **por nível conjurável** (ex.: níveis 1·2·3 → dano 3·4·5).
- Stats do efeito (`rollType`/`damage`/`chakraCost`/`range`/`duration`) vêm de `PowerEffect.stats` e são exibidos com rótulos PT (helpers em `mapPrismaToCore.ts`). **Cobertura parcial no seed** — efeito sem `rollType`/dano fica "—".
- **Uploads**: `/api/upload/character-image` agora **preserva aspecto** (`fit:inside` 1600px, sem crop) — cada contexto recorta via CSS. `/api/upload/character-portrait` = 600×900 (2:3).
- `uiState` guarda: `sectionCovers`, `sectionCoverPositions`, `sectionCoverZooms`, `fichaBackground`.
- **Fundo da ficha** = `fixed inset-0 z-0`; o header do `(app)/layout.tsx` recebeu `z-20` pra não ser coberto.
- **Tooltip** usa `group-hover` genérico → onde a section também é `group`, use **group nomeado** (`group/cover`) pra não abrir todos os tooltips juntos.
- ⚠️ **Windows**: `prisma generate` falha com EPERM se o `next dev` estiver rodando (lock do query engine). **Pare o dev server antes** de `migrate dev`/`generate`.

## Pendências (próximos passos)

1. **Botão "Criar jutsu"** só aparece se a ficha tem efeitos aprendidos. Fichas criadas **antes** da migration `learnedEffects` têm `{}` → fazer **backfill** (a partir dos `CharacterJutsu` legados) ou recriar pelo wizard.
2. **Calculadora de combate (Fase 4)**: acerto hoje reaproveita CC/CD/LM do personagem; falta dano final com bônus/½Esp por contexto, Especialista por arma, opção meio-chakra do Canhão, e o modal "usar jutsu" (gastar chakra, tomar dano, curar).
3. **Perícia social** (Obter Informação, base Carisma) sem cálculo (Carisma + ½ Int) → mostra "—".
4. **Seed**: preencher `stats.rollType`/`damage` faltantes em efeitos de ataque.
5. **Docs**: README/ROADMAP refletir que dashboard + criação de jutsus + edição foram entregues.
6. `.claude/hooks/` (format-on-edit, guard-paths) está **untracked** — decidir versionar.
7. **`git push`** pendente (tudo local em `test-lazy-web`).

## Como rodar

```bash
docker start arcana-forge-db          # Postgres local
pnpm dev                              # localhost:3000 (ou 3001 se ocupada)
pnpm lint && pnpm typecheck && pnpm test
# migrations (pare o dev antes no Windows):
pnpm prisma migrate dev --name <nome>
```
