# Lote 7h — Rinnegan + 7 Caminhos + Rinne Ninpou

Modela o doujutsu mais poderoso. Hijutsus p. 65-75 lidos integralmente antes de produzir.

## 📦 Conteúdo (3 arquivos novos)

### `powers-rinnegan.json` (1 power)

- **`rinne_ninpou`** — variante de Ninpou que aceita 5 elementos básicos (Doton/Fuuton/Katon/Raiton/Suiton). Troca elemento via ação parcial. Transforma efeito do Rinne Ninpou em outro elemento mantendo propriedades dele. NÃO permite efeitos exclusivos de elementos. Trocas em sustained/contínuo/permanente OK, em concentração NÃO. Kage Bunshin pode usar.

### `aptitudes-rinnegan.json` (8 aptidões)

| Aptidão | Pré-req |
|---|---|
| `rinnegan` (pai) | Narrativo (Mestre decide) — Doujutsu Permanente reduz chakra 10% |
| `shurado` Caminho Asura | Rinnegan + Ocultismo 12 + Mecanismos 12 |
| `jigokudo` Caminho Naraka | Rinnegan + Ocultismo 12 + Esp 12 |
| `ningendo` Caminho Humano | Rinnegan + Ocultismo 14 + Concentração 12 |
| `gakido` Caminho Preta | Rinnegan + Ocultismo 14 + Esp 14 |
| `chikushodo` Caminho Animal | Rinnegan + Ocultismo 16 + Rinne Ninpou 7 |
| `tendo` Caminho Deva | Rinnegan + Ocultismo 16 + Rinne Ninpou 8 |
| `gedo` Caminho Externo | Rinnegan + Ocultismo 18 + Esp 18 |

### `effects-rinnegan.json` (2 effects)

- **`shinra_tensei`** (Repelir) — 3 modos como subTechniques: Reativo, Defensivo, Ofensivo
- **`bansho_tenin`** (Atrair) — Atrair Objetos (parcial) + Atrair Criaturas (padrão, invisível, sucesso auto)

## ⚠️ Decisões e trade-offs

### 1. Edo Tensei NÃO existe no RAW

Verifiquei grep nos 3 PDFs (Básico, Hijutsus, GAS). Zero matches pra "Edo Tensei". O que existe é **Reanimação** (subTechnique do Caminho Gedō): controla até 6 cadáveres como extensão do usuário, mesma ficha em vida com -3 precisão, pode copiar 1 das 6 outras aptidões de Caminho. Funcionalmente equivale ao Edo Tensei do anime. Se o user tinha algo diferente em mente, precisa de fonte canônica.

### 2. 8 invocações do Chikushōdō como `creatures[]` na aptidão

Não criei 8 effects separados nem 8 entidades de criatura. Modelei como `effects.creatures[]` na aptidão `chikushodo`. Trade-off: lookup é interno (JSONB), não normalizado, mas evita explosão de entidades. Cada criatura tem atributos/skills/aptitudes/attacks/specialRule.

⚠️ Refs parametrizadas dentro de `creatures[]` (`resistencia_maior_vigor`, `sensor_continuo`, etc.) **NÃO entram no validador** porque estão em campo aninhado, não em `prerequisites`. Decisão consciente — motor de regras precisa interpretar essa estrutura quando o jogador invoca uma criatura.

### 3. Tendō: `tempoDeDescanso` global, não por técnica

RAW p.71-72: "para cada 5 pontos de chakra consumidos, você precisa aguardar 1 turno". É contador global das técnicas do Tendō. Motor precisa rastrear chakra gasto vs timer. Modelado em `effects.tempoDeDescanso` da aptidão `tendo`.

### 4. Gedō Mazō, Caminho da Vida, Naraka Maior como subTechniques

Têm pré-reqs extras (Ocultismo 20 + Esp 20). Modelados como `subTechniques[]` da aptidão `gedo` com `prerequisites` próprios. Motor verifica os pré-reqs adicionais ao desbloquear cada técnica.

### 5. Shinra Tensei como effect (não subTechnique)

Tem ação/alcance/dano explícito por modo. Cabe melhor como effect com `subTechniques` pros 3 modos do que como bloco field na aptidão Tendō. Padrão consistente com Mangekyou (Tsukuyomi/Amaterasu são effects do power Mangekyou).

### 6. Cura de Ferimentos do Gakidō é DIFERENTE de cura comum

NÃO recupera membros perdidos (RAW p.69). Lesões musculares/articulações sim. Restrição modelada em `subTechniques.gakido_cura_ferimentos.description`.

### 7. Caminho da Vida custa a própria vida

Trade-off único de Gedō: ressuscitar mortos recentes ou 1 alvo específico, mas usuário morre. Sem testes, sem reverter. Mestre decide quando permitir.

## 🧪 Validação final

```
Aptitudes:  178 (era 170, +8)
Powers:     44  (era 43, +1)
Effects:    179 (era 177, +2)
Equipments: 151 (sem mudança)
Erros: 0 ✅
```

## 📋 Prompt pro Claude Code

> Aplicar lote 7h no banco. 3 arquivos JSON novos em `prisma/seed-data/`. `seed.ts` atualizado.
>
> ```bash
> docker exec arcana-forge-db pg_dump -U postgres arcana_forge > /tmp/pre-7h-backup.sql
> pnpm prisma db seed
> ```
>
> Verificar:
> - `aptitudes`: 178 entries. Filtrar `code IN ('rinnegan', 'shurado', 'jigokudo', 'ningendo', 'gakido', 'chikushodo', 'tendo', 'gedo')` — 8 aptidões.
> - `powers`: 44 entries. Filtrar `code = 'rinne_ninpou'`.
> - `power_effects`: 179 entries. Filtrar `code IN ('shinra_tensei', 'bansho_tenin')`.

## 🔗 Próximo passo

- **Task #10 do roadmap (7g)** — Senninka completo + Juuinka complemento (saltada). Modo Eremita técnicas exclusivas + Selo Amaldiçoado evoluções.
- **Task #12 (7i)** — Kami Ninpou refino. (Suika expandido já feito em 7e2.)
- **Task #13 (7j)** — Nintaijutsu (resolve `armadura_de_raios`) + Quimeras.
- **Task #15** — pendência pequena: `hibon_ninpou` power.
