# Hijutsus — Análise de Lacunas e Plano de Seed

> Cruzamento entre os 3 livros (`books/`) e os seeds atuais (`prisma/seed-data/`).
> Data: jun/2026. Fonte de verdade: seeds JSON × Livro Básico / Livro de Hijutsus / Guia Avançado 4.1b.

---

## 0. Diagnóstico honesto (leia primeiro)

A percepção de que "praticamente todos os hijutsus estão faltando" **não bate com o que está nos seeds**. A cobertura estrutural é alta. O que existe hoje:

- **47 poderes**, **17 clãs**, **6 KGs**, **9 armas especiais**, **189 efeitos**, e dezenas de aptidões de clã/hijutsu — **todos carregados** pelo `seed.ts` (conferido: nenhum JSON órfão fora da lista de carga).
- **Hijutsus já modelados e razoavelmente completos:** Rinnegan (poder + 7 Caminhos como aptidões), Samurai (8 aptidões + armadura), Nintaijutsu (poder + 8 efeitos + Armadura de Raios), Jinchuuriki (poder + 9 Bijuus como aptidões + 20 técnicas de bijuu), Magen (16 efeitos), Hachimon Tonkou (8 portões), Kamijutsu (kami_ninpou + 6 efeitos + Shikigami no Mai), Juuinka (Ichi/Ni), Senjutsu, Tensai, e os 6 poderes de clã do Básico (Juuken, Kagejutsu, Baika, Kikai, Shintenshin, Shikakyu).
- **Todos os clãs dos dois livros** (11 do Básico + 6 do Hijutsus) estão em `clans.json`.
- **Todas as 9 armas especiais** do Livro de Hijutsus + armas de fogo.

### ⚠️ Hipótese mais provável da sua percepção
Se na UI/banco os hijutsus aparecem vazios, o motivo mais provável é **banco desatualizado** — os seeds foram adicionados em lotes; se o seu Postgres local não foi re-seedado depois, ele não tem esse conteúdo. **Antes de criar qualquer seed novo, rode:**

```bash
docker start arcana-forge-db
pnpm prisma db seed       # idempotente (upsert por code)
```

Depois confira no Prisma Studio (`pnpm prisma studio`) as tabelas `Power`, `PowerEffect`, `Aptitude`. Se o conteúdo abaixo aparecer, **não há lacuna** — era só re-seed.

Se mesmo após re-seed houver buracos, eles são os abaixo.

---

## 1. Lacunas REAIS (o que de fato falta nos seeds)

### Categoria A — Hijutsus/poderes totalmente ausentes

| Item | Fonte | O que é | O que falta |
|---|---|---|---|
| **Saika Ikki** | Guia p.13 | Clã/hijutsu de **armas de fogo** | Poder/aptidões inexistentes. Faltam 7 aptidões: Disparos Sujos, Recarga Precisa, Gun Fu, Mira Vital, Armamento Pesado, Alcance Estendido, Atirador Ágil. (As armas de fogo já existem em `equipment-firearms.json`.) |
| **Versatilidade** | Básico p.242 | Poder restrito "2 poderes em 1" (Ninpou, Suiton, Katon, Doton, Fuuton, Raiton, Fuuinjutsu) | Poder inexistente. Tensai existe como aptidão, mas Versatilidade (o poder que Tensai concede) não. |
| **Roster de invocações do Kuchiyose** | Básico p.224 + Hijutsus | As criaturas invocáveis | O poder `kuchiyose` existe (2 efeitos: invocar/reversa), mas as **invocações específicas** não são entidades: Sapos, Cobras, Lesmas, Águias, Macacos (Sarutobi), Cães (Hatake), Tubarão (Hoshigaki). Técnicas nomeadas faltantes: Henge Kongnyoi (Bastão Adamantino), Kuchiyose Doton Tsuiga, Katsuyu Daibunretsu. (Byakugou no In já existe.) |

### Categoria B — "Cascas": poder existe, mas faltam efeitos-assinatura (book-backed)

Esses têm regra OFICIAL nos livros, mas no seed só têm efeitos genéricos compartilhados:

| Poder | Efeitos hoje | Efeitos-assinatura faltando | Fonte |
|---|---|---|---|
| **aoi_katon** | **0** ⚠️ | Nekozume (Garras de Gato, Nv4) — hoje está atribuído errado a `jinchuuriki`. Katon sem desvantagem vs Suiton; Domínio do Fogo grátis. | Guia p.94 |
| **sanbi_suiton** | 1 (Espelho D'Água) | Sangoshō (Soco do Coral, Nv4) | Guia p.94 |
| **yonbi_youton** | 3 | Confirmar Manto de Lava + Vulcão estão no code certo (hoje em `jinchuuriki`/`yonbi_youton` misturado) | Guia p.95 |
| **gobi_futton** | 3 | Tsunoori (Investida do Chifre) + evoluções de Ebulição/Aceleração/Força-Vapor | Guia p.97 / Hijutsus p.40 |
| **rokubi_suiton** | 4 | Corrosão da Lesma / Hiruma; arma "Soprador de Bolhas" | Guia p.99 / Hijutsus p.43 |
| **dokujutsu** | 3 | Veneno Melhorado, Energizar Venenoso, lista de efeitos permitidos (Sasori) | Básico p.201 + Guia p.8 |
| **hibon_ninpou** | **0** | Por design reusa efeitos de Ninpou (escolhe 2 bônus). **Decisão:** confirmar que os efeitos universais de Ninpou listam `hibon_ninpou` em `availableFor`, senão o poder fica inutilizável. | Básico p.212 |
| **senninka** | 2 | Estágios (Primeiro/Segundo) como modos do poder; lista de efeitos de Ninpou permitidos no 2º estágio | Hijutsus p.79 |

### Categoria C — Poderes-placeholder SEM regra nos 3 livros (decisão necessária)

Estes existem no seed (`powers-additional.json`) como cascas com efeitos genéricos, mas **não têm seção de regras nos 3 livros oficiais** que temos. São KGs/hijutsus do anime adicionados como placeholders:

`shouton` (Guren), `ranton` (Darui), `shakuton` (Pakura), `futton_mei` / `youton_mei` (Mei Terumi, versão não-Bijuu), `sumi_ninpou` (Sai), `kumo_ninpou` (Kidoumaru), `hebi_ninpou` (Orochimaru), `ototon` (Oto), `kibaku_nendo` (Deidara), `kujaku_myoho` (placeholder explícito).

> **Decisão do owner necessária:** não dá pra seedar efeitos-assinatura desses a partir dos 3 livros que temos (não há regra RAW). Opções: (1) deixar como cascas com efeitos genéricos; (2) buscar fonte adicional (suplemento/comunidade) e tratar como conteúdo casa; (3) descopar do MVP. **Não inventar regras** (CLAUDE.md).

### Categoria D — Lacuna de catálogo de KG

`kekkei-genkais.json` tem só 6 entradas (hyouton, sharingan, byakugan, mokuton, shikotsumyaku, juuken), mas há poderes categoria KEKKEI_GENKAI/HIJUTSU que são KGs de fato (jiton, shouton, ranton, futton, youton). Alinhar a tabela de KG com esses poderes (ou decidir que KG-de-poder não precisa de entrada própria).

---

## 2. O que NÃO precisa de ação (já coberto — não re-seedar)

Pra evitar retrabalho: **Rinnegan** (completo), **Samurai** (completo), **Nintaijutsu** (completo), **Jinchuuriki + 9 Bijuus** (técnicas presentes), **Magen**, **Hachimon Tonkou**, **Kamijutsu/Shikigami**, **Juuinka**, **Tensai**, **Senjutsu** (base), **Kongou Fuusa**, **Byakugou no In**, todos os **clãs**, todos os **poderes de clã do Básico**, todas as **armas especiais**.

---

## 3. Plano de criação dos seeds

### Princípios
- **Idempotência:** todo seed via `upsert` por `code` (já é o padrão do `seed.ts`). Re-rodar é seguro.
- **Fonte citada:** cada `description` referencia a página do livro (ex.: "Fonte: Guia Avançado p.94"). Padrão já usado no repo.
- **Schema:** seguir o shape existente — efeito = `{ code, name, minLevel, availableFor[], shortDescription, description, stats{...}, rules{...}, evolutions[] }`. Power = `{ code, name, category, ... }`. Aptidão = shape de `aptitudes-*.json`.
- **Validação:** rodar `pnpm seed:validate` (e `:strict`) + `pnpm test` (testes de seed em `tests/seed/`) após cada lote. Atualizar contagens nos testes quando adicionar entradas (ex.: como fizemos com `acuidade_homebrew`).
- **NÃO chutar regras** (Categoria C). Documentar divergências no SESSION-LOG.

### Lotes propostos (ordem por valor × esforço)

**Lote H0 — Verificação (1h, sem código)**
- Re-seedar o banco e auditar no Prisma Studio. Confirmar quais lacunas são reais vs. banco velho. **Pode eliminar 80% do trabalho.**

**Lote H1 — Corrigir cascas book-backed de alto impacto (~meio dia)**
- `effects-aoi-katon.json`: criar Nekozume com `availableFor:["aoi_katon"]` (mover do jinchuuriki se duplicar).
- Conferir/realocar efeitos de bijuu-elemento (sanbi/yonbi/gobi/rokubi) pro power code certo, não só `jinchuuriki`.
- Conferir `hibon_ninpou` nos `availableFor` dos efeitos universais de Ninpou.
- Saída: nenhum poder book-backed com 0 efeitos.

**Lote H2 — Saika Ikki + Versatilidade (~1 dia)**
- `aptitudes-saika-ikki.json` (7 aptidões de armas de fogo, Guia p.13). Reusa armas de `equipment-firearms.json`.
- Adicionar power `versatilidade` em `powers-additional.json` (Básico p.242) + regra de "2 poderes em 1" (provavelmente só metadado, sem efeitos próprios — herda dos 2 poderes escolhidos).

**Lote H3 — Roster de Kuchiyose (~1-2 dias)**
- Modelar invocações. Decisão de modelagem: criar uma tabela/representação de "summons" OU efeitos `kuchiyose_<animal>` com stats da criatura. Recomendo efeitos por invocação (Sapos, Cobras, Lesmas, Águias, Macacos, Cães, Tubarão) + técnicas nomeadas (Bastão Adamantino, Tsuiga, Katsuyu Daibunretsu). Maior esforço (cada criatura tem ficha).

**Lote H4 — Expansão de efeitos-assinatura book-backed (incremental)**
- Dokujutsu, Senninka (estágios), evoluções de bijuu — efeito por efeito, com página. Baixa urgência.

**Lote H5 — Decisão sobre placeholders (Categoria C)**
- Reunião de produto: descopar, manter casca, ou buscar fonte. **Bloqueado por decisão**, não por trabalho.

### Estimativa total (book-backed, sem Categoria C)
~3-5 dias de trabalho, sendo H0 potencialmente resolvendo a maior parte. Categoria C é indefinida (depende de fonte/decisão).

---

## 4. Próximo passo recomendado

1. **Rodar `pnpm prisma db seed`** e auditar (Lote H0) — confirmar o que é lacuna real.
2. Me dizer o resultado: se os hijutsus aparecerem, fechamos isso; se não, ataco H1 → H2 → H3 na ordem.
3. Decidir sobre os placeholders da Categoria C (precisa da sua chamada).
