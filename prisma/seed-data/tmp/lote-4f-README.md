# Seed Data — Lote 4f (Poderes Faltantes + Validador de Dados)

Lote suplementar fora da numeração principal. Resolve o problema dos **13 poderes mencionados em `availableFor` dos efeitos do 4d/4e que ainda não tinham entrada no catálogo principal** (eram strings dormentes).

## 📦 Conteúdo

| Arquivo | Propósito |
|---|---|
| `powers-additional.json` | Catálogo dos 13 poderes faltantes (metadados básicos) |
| `validate-seed-data.ts` | Script TypeScript de validação de dados (não regra) |

## 🎯 Os 13 poderes catalogados

| Code | Nome | Categoria | Origem |
|---|---|---|---|
| `kami_ninpou` | Kami Ninpou (Arte Secreta dos Papéis) | HIJUTSU | Clã Fuuma (Konan, Shigure) |
| `sumi_ninpou` | Sumi Ninpou (Arte da Tinta) | HIJUTSU | Sai (ROOT Konoha) |
| `kumo_ninpou` | Kumo Ninpou (Arte das Teias) | HIJUTSU | Kidoumaru (4 Som) |
| `hebi_ninpou` | Hebi Ninpou (Arte das Cobras) | HIJUTSU | Orochimaru |
| `kujaku_myoho` | Kujaku Myoho (Lei Suprema do Pavão) | HIJUTSU | Pouco documentado — ver _meta.needsDeepResearch |
| `dokujutsu` | Dokujutsu (Arte dos Venenos) | HIJUTSU | Sasori (Akatsuki) |
| `ototon` | Ototon (Elemento Som) | HIJUTSU | Otogakure (Tayuya, Dosu) |
| `kibaku_nendo` | Kibaku Nendo (Argila Explosiva) | HIJUTSU | Deidara (Iwa) |
| `futton_mei` | Futton (Mei) — Elemento Vapor | HIJUTSU | Mei Terumi, 5ª Mizukage |
| `youton_mei` | Youton (Mei) — Elemento Lava | HIJUTSU | Mei Terumi, 5ª Mizukage |
| `shakuton` | Shakuton (Elemento Calor) | HIJUTSU | Pakura (Suna) |
| `shouton` | Shouton (Elemento Cristal) | HIJUTSU | Guren |
| `ranton` | Ranton (Elemento Tempestade) | HIJUTSU | Darui (Kumo) |

## ⚠️ Decisões transparentes

### 1. Catálogo MÍNIMO, não completo

Esses 13 poderes têm efeitos exclusivos próprios no livro (Kami Ninpou tem Anjo de Papel, Julgamento, Emissário Divino; Dokujutsu tem Energizar Venenoso; etc.). **Eu NÃO modelei esses efeitos exclusivos aqui** — só o metadado básico do poder. Justificativa:

- Objetivo do 4f era resolver strings dormentes, não fazer Lote 4 expandido.
- Efeitos exclusivos viriam num lote suplementar dedicado quando houver demanda (campanha que use Sasori/Deidara/etc.).
- Mantém escopo controlado.

Se quiser efeitos exclusivos depois, é só pedir um **Lote 4g de efeitos exclusivos de hijutsus avançados**.

### 2. Kujaku Myoho ficou minimalista

O livro de Hijutsus 2 tem capítulo dedicado, mas minha pesquisa nas fontes não retornou detalhes mecânicos completos. Marquei `_meta.needsDeepResearch: true` e deixei apenas a entrada existindo pra `availableFor` resolver. Quando você for usar, vale revisitar o livro.

### 3. PATCH IMPORTANTE: `kamijutsu` → `kami_ninpou`

**No Lote 4e eu usei `kamijutsu` em alguns `availableFor`** (efeitos Projetar, Repelir, Cegante). O code correto do **poder** é `kami_ninpou`. Kamijutsu é só o nome do conjunto/hijutsu, não do poder mecânico.

**O script de validação detecta isso automaticamente** e reporta como erro com a mensagem `KNOWN PATCH: replace "kamijutsu" with "kami_ninpou"`. Quando aplicar o Lote 4f, faça também o find-replace nos 3 JSONs do 4e:

```bash
# No diretório prisma/seed-data/
sed -i 's/"kamijutsu"/"kami_ninpou"/g' effects-guia-avancado.json
```

(Esse comando é seguro — `kamijutsu` só aparece nos `availableFor` desses efeitos. Confirme rodando o validador depois.)

## 🔧 Script de Validação

`validate-seed-data.ts` faz 6 checagens:

1. **Required fields**: todo entry tem `code` e `name`
2. **Code format**: codes seguem snake_case (`/^[a-z0-9_]+$/`)
3. **Duplicates**: mesmo `code` em arquivos do mesmo tipo
4. **availableFor**: poderes referenciados existem OU estão em `_meta.unmodeledPowers`
5. **prerequisites**: powers/effects de pré-reqs existem
6. **Known patches**: detecta inconsistência `kamijutsu` vs `kami_ninpou`

### Níveis de issue

- **error**: bloqueia seed. Exit 1.
- **warning**: não bloqueia (a menos que use `--strict`). Issues de naming, codes não-encontrados sem `_meta` marker.
- **info**: meramente informativo. Strings dormentes esperadas (em `unmodeledPowers`).

### Uso

```bash
# Validação padrão (só erros bloqueiam)
pnpm tsx scripts/validate-seed-data.ts

# Validação estrita (warnings também bloqueiam)
pnpm tsx scripts/validate-seed-data.ts --strict
```

### Recomendação de integração

Adicione no `package.json`:

```json
{
  "scripts": {
    "seed:validate": "tsx scripts/validate-seed-data.ts",
    "seed:apply": "pnpm seed:validate && prisma db seed"
  }
}
```

Assim `pnpm seed:apply` valida antes de aplicar — falhou validação, não toca no banco.

### Limitações conhecidas

- **NÃO valida pré-requisitos cruzados em runtime** (isso é motor de regra — fora do escopo deste script)
- **NÃO valida** que `availableFor` faz sentido semanticamente (ex: efeito de Doton em availableFor de Suiton seria flag pra revisão humana)
- **NÃO checa** se `rules` segue um shape consistente (intencional — JSONB amorfo)

## ✅ O que esperar ao rodar o validador (estado atual)

Depois de aplicar 4f e fazer o patch do `kamijutsu`, esperado:

```
✅ Seed data validation passed with no issues.
```

**Antes do patch** (com `kamijutsu` ainda dormente em alguns lugares):

```
❌ 3 ERROR(S):
  [effects-guia-avancado.json] projetar.availableFor: KNOWN PATCH: replace "kamijutsu" with "kami_ninpou"...
  [effects-guia-avancado.json] repelir.availableFor: KNOWN PATCH...
  [effects-guia-avancado.json] cegante.availableFor: KNOWN PATCH...
```

---

# 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── seed.ts                                  ← incluir powers-additional.json em seedPowers()
│   ├── seed-data/
│   │   ├── (anteriores)
│   │   └── powers-additional.json               ← NOVO
└── scripts/
    └── validate-seed-data.ts                    ← NOVO
```

---

# 🛠️ Comandos manuais seus

```bash
cd ~/projects/arcana-forge

# 1. Descompacta
unzip ~/Downloads/seed-data-lote-4f.zip -d /tmp/

# 2. Copia arquivos
cp /tmp/seed-data-lote-4f/powers-additional.json prisma/seed-data/
mkdir -p scripts
cp /tmp/seed-data-lote-4f/validate-seed-data.ts scripts/

# 3. Aplica patch de kamijutsu → kami_ninpou nos JSONs do 4e
sed -i 's/"kamijutsu"/"kami_ninpou"/g' prisma/seed-data/effects-guia-avancado.json

# 4. Guarda README
cp /tmp/seed-data-lote-4f/README.md /tmp/lote-4f-README.md

# 5. Confere
ls prisma/seed-data/powers*.json
ls scripts/validate-seed-data.ts
```

---

# 💬 Prompt pro Claude Code

```
# Aplicar Lote 4f do Seed: Poderes Faltantes + Validador de Dados

Lote suplementar. Resolve 13 strings dormentes do 4d/4e + adiciona script de validação de dados.

## Arquivos novos

- `prisma/seed-data/powers-additional.json` — 13 poderes faltantes (Kami Ninpou, Sumi Ninpou, Kumo Ninpou, Hebi Ninpou, Kujaku Myoho, Dokujutsu, Ototon, Kibaku Nendo, Futton-Mei, Youton-Mei, Shakuton, Shouton, Ranton)
- `scripts/validate-seed-data.ts` — script de validação (6 checagens, 3 níveis de severidade)

## Antes de codar

1. **Leia `/tmp/lote-4f-README.md`** — pontos importantes:
   - O JSON tem 13 entradas, schema idêntico ao `powers.json` do Lote 3
   - Patch obrigatório: substituir `"kamijutsu"` por `"kami_ninpou"` em `effects-guia-avancado.json` (foi inconsistência do Lote 4e)
   - Validador deve ser integrado ao seed workflow

2. **Confira que o usuário já aplicou o patch sed**:
   ```bash
   grep -c "kamijutsu" prisma/seed-data/effects-guia-avancado.json
   ```
   Resultado esperado: 0 (zero ocorrências). Se ainda tiver, rode o sed antes de prosseguir.

## Tarefas

### 1. Instalar dependência (se necessário)

```bash
pnpm add -D tsx
```

### 2. Atualizar `prisma/seed.ts`

Na função `seedPowers()` (ou equivalente), adicione `powers-additional.json` à lista de arquivos junto com `powers.json`:

```typescript
const powerFiles = ['powers.json', 'powers-additional.json'];
```

O seeder deve usar `upsert` por `code` (idempotente).

### 3. Adicionar scripts no `package.json`

```json
{
  "scripts": {
    "seed:validate": "tsx scripts/validate-seed-data.ts",
    "seed:validate:strict": "tsx scripts/validate-seed-data.ts --strict",
    "seed:apply": "pnpm seed:validate && prisma db seed"
  }
}
```

### 4. Rodar validação ANTES do seed

```bash
pnpm seed:validate
```

Resultado esperado: `✅ Seed data validation passed with no issues.`

Se aparecer erros de `kamijutsu`, faça o sed:
```bash
sed -i 's/"kamijutsu"/"kami_ninpou"/g' prisma/seed-data/effects-guia-avancado.json
```
E rode validação de novo.

### 5. Aplicar seed

```bash
pnpm prisma db seed
```

### 6. Validar no Prisma Studio

- Tabela `powers` deve ter 19 (Lote 3) + 13 (Lote 4f) = **32 poderes** totais
- `kami_ninpou` deve existir com category `HIJUTSU`
- `dokujutsu` deve ter `rules.prerequisites.skills.venefico: 6`
- Tabela `power_effects` continua com 138 efeitos (nada novo)

### 7. Teste do validador

Crie `tests/seed/validate-seed.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Seed Data Validator', () => {
  it('roda sem erros no estado atual do banco', () => {
    const output = execSync('pnpm tsx scripts/validate-seed-data.ts', { encoding: 'utf-8' });
    expect(output).toContain('Validation PASSED');
  });

  it('detecta o patch kamijutsu → kami_ninpou se desfeito', () => {
    // Não execute na CI — só doc do comportamento esperado
    expect(true).toBe(true);
  });
});
```

## ⛔ Limites

- **NÃO modele** efeitos exclusivos dos 13 poderes (Anjo de Papel, Julgamento, Energizar Venenoso etc.). Fica pra lote 4g futuro.
- **NÃO implemente** motor de validação de regras (pré-requisitos cruzados em runtime). Esse script só valida dados.
- **NÃO toque** em outros JSONs do seed.
- **NÃO faça** `git push`.

## Após aplicar

Documente no `SESSION-LOG.md`:

```markdown
## Lote 4f (Poderes Faltantes + Validador) — APLICADO

- 13 poderes adicionados ao catálogo (total: 32 poderes)
- Script `scripts/validate-seed-data.ts` integrado ao workflow via `pnpm seed:validate`
- Patch aplicado: `kamijutsu` → `kami_ninpou` em `effects-guia-avancado.json`
- Pendências documentadas no validador:
  - Efeitos exclusivos dos 13 poderes (Lote 4g futuro)
  - Motor de validação de regras (depende de UI de ficha)
- Próximo passo: Lote 5 (Aptidões ~80)
```

Rode `pnpm typecheck && pnpm lint && pnpm seed:validate` antes de fechar.
```
