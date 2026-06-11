# Lote 7f — Jinchuuriki base (Task #8)

Power-pai dos 4 Bijuus Hijutsus já modelados (`aoi_katon`, `sabaku_hijutsu`, `sanbi_suiton`, `yonbi_youton`). Fecha o gap "refs dormentes a `jinchuuriki`" da Fase 7b.

## 📦 Conteúdo (2 arquivos novos)

- `powers-jinchuuriki.json` — 1 power Restrito (Hijutsu/Kinjutsu). Regras gerais de Custo Vit + Duração Segura + Teste de Domínio + Controle Total + Liberar Genjutsu.
- `effects-jinchuuriki.json` — 11 effects:
  - **5 modos** (estados ativados, cadeia natural): presenca_bijuu (Nv 2), manto_bijuu (Nv 3), modo_bijuu (Nv 4), forma_bijuu (Nv 5+Controle Total), transformacao_parcial (alternativa exclusiva)
  - **6 técnicas gerais**: chakra_bijuu (Nv 1 passive), potencia_da_besta (Nv 2 passive), onda_de_chakra (Nv 3), braco_de_chakra (Nv 4), disparo_de_chakra (Nv 5), bijuudama (Nv 7)

## ⚠️ Pontos importantes

### 1. Tabelas específicas por Bijuu NÃO modeladas neste lote

RAW (Hijutsus p. 22): cada Bijuu (Ichibi-Kyuubi) tem tabela própria de benefícios por nível, indicando QUE nível desbloqueia Modo Bijuu, Forma Bijuu, Controle Total + integração com poder elemental embutido (ex: Ichibi+Sabaku Hijutsu, Nibi+Aoi Katon).

Este lote modela apenas as REGRAS GERAIS — válidas pra qualquer Bijuu. Modo Bijuu e Forma Bijuu declaram `unlockLevelVariableByBijuu: true` apontando que a tabela específica governa.

Tabelas específicas vêm em lote separado (Task #9, lote 7f2-7f3 — Bijuus 5-9 + tabelas detalhadas das já modeladas).

### 2. Modos como effects (padrão estabelecido)

Presença/Manto/Modo/Forma Bijuu + Transformação Parcial são MODOS (estados ativados), não técnicas que produzem dano direto. Modelados como effects do power porque têm action/duration/vitCost. Segue o mesmo padrão do Hachimon Tonkou (cada portão é effect).

Cadeia natural: Presença → Manto → Modo → Forma. Cada um exige o anterior ativo (declarado em `prereqs.effects`).

### 3. Custo de Vitalidade em vez de chakra (CRÍTICO pro motor)

Modos do poder consomem ZERO chakra mas causam dano na Vitalidade igual ao nível usado. Dano sofrido na ativação + início de cada turno. **Presença Bijuu e Forma Bijuu são exceção** (sem dano), exceto se a Forma Bijuu vier de transformação forçada (teste de domínio falho).

Após Duração Segura (1 turno + 1 por nível) expirar: dano Vit dobra e Presença Bijuu também passa a causar dano.

Técnicas (Onda/Braço/Disparo/Bijuudama) podem ser pagas com chakra OU Vit (decisão do jogador). Se pago em Vit, recoveryAction NÃO recupera o custo.

### 4. Teste de Domínio (sistema novo)

Trigger: Vit zero durante uso OU estresse emocional (decisão do Mestre).

Mecânica: 2 dados vs Dif 9, **sem precisão** (rola direto). Falha = transformação forçada Modo Bijuu + libera cauda + disputa mental.

3 turnos subsequentes com Dif +1 cada. Falhar em 2 dos 3 = perde consciência total, vira PdM, Bijuu dominante. Passar = transformação contida, exausto resto do dia.

Tentar usar o poder durante exhaustion = falha automática em todos os testes (transformação forçada). Documentado pro motor enforçar.

### 5. Controle Total — bypass do custo Vit

Quando atinge nível variável por Bijuu, Jinchuuriki ganha Controle Total. Bypasses:
- Sem dano Vit ao usar modos
- Custo único de chakra = nível total do poder (pago uma vez enquanto power ativo)
- Sem custo pra trocar entre modos
- Duração Segura removida
- NÃO pode mais pagar técnicas com Vit
- Permite Bijuu falar via usuário em Forma Bijuu
- Habilita Liberar Genjutsu (Kai sucesso auto via chakra da Bijuu, 1x no 2º turno sob ilusão)

### 6. Chakra Bijuu grants Chakra Expandido (Uzumaki!)

Effect Nv 1 passive `chakra_bijuu` concede `chakra_expandido` (aptidão Uzumaki, +50% chakra total). Bypass aplicado (`grantsBypassesPrereq: true`): Bijuu provê o chakra extra naturalmente — não revalida pré-req do clã Uzumaki.

Lembrar que Chakra Bijuu é reserva SEPARADA — não pode ser drenado/selado quando dentro. Drenagem inimiga via Manto/Modo Bijuu causa dano fixo = nível do poder em quem drenou.

### 7. Restrição de técnicas em modos avançados

- Modo Bijuu: blocksSelosMao + blocksTechniquesNotJinchuurikiOrBijuuSpecific
- Forma Bijuu: blocksSelosMao + blocksTechniquesNotJinchuurikiOrBijuuSpecific + blocksBracoDeChakra (chakra fica físico)

Motor de regras precisa enforce: ao ativar Modo Bijuu ou Forma Bijuu, bloquear todas as técnicas que NÃO sejam:
- Técnicas gerais do Jinchuuriki (onda_de_chakra, braco_de_chakra, disparo_de_chakra, bijuudama)
- Técnicas/poderes permitidos pela Bijuu específica (ex: Matatabi pode usar Aoi Katon expelindo chamas; Shukaku pode usar Sabaku Hijutsu sem selos)

### 8. Bijuudama — regra de zona crítica

Requer 5m de distância de qualquer inimigo. Se não respeitar: perde concentração, ação E custos NÃO são recuperados. Motor deve checar distância antes de aplicar.

Defesa: Esquiva/Antecipar bem-sucedido força teste extra de Agi (Dif 9 + 2x nível). Falha = grau 1 dano remanescente. Acelerados têm sucesso auto neste teste.

### 9. Validação resolveu 4 refs dormentes

Antes do 7f, 4 powers (aoi_katon, sabaku_hijutsu, sanbi_suiton, yonbi_youton) declaravam `jinchuuriki` em `_meta.unmodeledPowers`. Validador demovia error → info. Após 7f, ref é real — pode-se REMOVER as declarações dormentes nesses 4 arquivos (limpeza opcional, não bloqueia).

## 🧪 Validação

```
Aptitudes: 161  Powers: 41  Effects: 159  Erros: 0 ✅
```

Δ vs estado pós-7e:
- Powers: 40 → 41 (+jinchuuriki)
- Effects: 148 → 159 (+11)

## 📋 Prompt pro Claude Code

> Aplicar lote 7f (Jinchuuriki base) no banco do Arcana Forge. 2 arquivos JSON novos em `prisma/seed-data/`: `powers-jinchuuriki.json` e `effects-jinchuuriki.json`. `prisma/seed.ts` já atualizado.
>
> ```bash
> docker start arcana-forge-db 2>/dev/null
> docker exec arcana-forge-db pg_dump -U postgres arcana_forge > /tmp/pre-7f-backup.sql
> pnpm prisma db seed
> ```
>
> Verificar via Prisma Studio:
> - `powers` table: 41 entries (filtrar `code = 'jinchuuriki'` — confirmar `rules.modes`, `rules.testeDeDominio`, `rules.controleTotal`).
> - `power_effects` table: 159 entries (filtrar `code IN ('presenca_bijuu', 'manto_bijuu', 'modo_bijuu', 'forma_bijuu', 'transformacao_parcial', 'chakra_bijuu', 'potencia_da_besta', 'onda_de_chakra', 'braco_de_chakra', 'disparo_de_chakra', 'bijuudama')` — 11 entries com `availableFor: ['jinchuuriki']`).
> - Confirmar Chakra Bijuu tem `grantsBypassesPrereq: true`.

## 🔗 Próximo passo

**Task #9 — 7f2: Bijuus 5-9 + tabelas específicas das 4 já modeladas (1-4).**

- Bijuu 1 (Shukaku/Ichibi) — tabela em `sabaku_hijutsu` ou parte de Jinchuuriki?
- Bijuu 2 (Matatabi/Nibi) — Aoi Katon já modelado
- Bijuu 3 (Isobu/Sanbi) — Sanbi Suiton já modelado
- Bijuu 4 (Son Goku/Yonbi) — Yonbi Youton já modelado
- Bijuu 5 (Kokuō/Gobi) — Futton Mei? Confirmar
- Bijuu 6 (Saiken/Rokubi) — Suiton+Acido? Confirmar
- Bijuu 7 (Chōmei/Nanabi) — Lukha (Pó de Escamas)
- Bijuu 8 (Gyūki/Hachibi) — Raiton hijutsu (já mostrado p. 30 antes da Kyuubi)
- Bijuu 9 (Kurama/Kyuubi) — RAW Hijutsus p. 22-30 já mostra esta como exemplo no texto base; tabela completa

Ler livro de Hijutsus cap. Bijuus inteiro antes de produzir — não inferir do padrão.
