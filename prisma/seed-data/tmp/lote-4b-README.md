# Seed Data — Lote 4b (Efeitos Exclusivos dos 5 Elementos Básicos)

Segunda onda do **Lote 4 (Efeitos)**.

## 📦 Conteúdo desta onda

| Arquivo | Efeitos | Elemento |
|---|:---:|---|
| `effects-suiton.json` | 3 | Suiton (Água) |
| `effects-doton.json` | 3 | Doton (Terra) |
| `effects-katon.json` | 1 | Katon (Fogo) |
| `effects-fuuton.json` | 4 | Fuuton (Vento) |
| `effects-raiton.json` | 3 | Raiton (Trovão/Raio) |
| **Total** | **14** | |

## 🌊 Onda 4b detalhada

### Suiton (3 efeitos exclusivos)
- **Névoa** (Nv 2) — Camuflagem parcial. Requer Lutar às Cegas ou sensor
- **Prisão de Água** (Nv 3) — Redoma paralisando alvo. Concentração
- **Colisão de Ondas** (Nv 6) — Tsunami devastador (10 dano base, dobra contra construções)

### Doton (3 efeitos exclusivos)
- **Imergir** (Nv 2) — Funde-se com terra/pedra. Furtividade + Falsa Decapitação. **Cross-element: Suiton e Hyouton também acessam**
- **Tremor** (Nv 2) — Chão treme, alvos caem se falhar defesa
- **Pele de Pedra** (Nv 6) — Dureza de corpo + Soco de Pedra

### Katon (1 efeito exclusivo)
- **Inflamável** (Nv 5) — Líquido/gás inflamável. Combustão com Canhão Katon/Raiton. **Cross-element: Fuuton e Suiton também acessam (via Guia Avançado)**

### Fuuton (4 efeitos exclusivos)
- **Venenoso** (Nv 5) — Veneno em fumaça (requer perícia Venefício)
- **Afiar** (Nv 6) — Energizar+++ pra armas cortantes. Crítico melhor + Lâmina Estendida
- **Lâmina de Vento** (Nv 7) — Múltiplas lâminas invisíveis (Prontidão antes da defesa)
- **Flutuar** (Nv 5, Guia Avançado) — Voa sobre Leque Gigante

### Raiton (3 efeitos exclusivos)
- **Lâmina de Raios** (Nv 2, Esp 8) — Chidori clássico. Toque corporal com Raiton concentrado
- **Arma Elétrica** (Nv 4) — Versão Raiton-only de Criar Arma/Energizar
- **Descarga** (Nv 6) — Corrente em área, atordoa

## 🔑 Pontos importantes

### 1. Efeitos cross-element

Alguns efeitos exclusivos são **acessíveis por outros poderes** (cross-element). O campo `availableFor` no JSON lista isso explicitamente:

| Efeito | Disponível para |
|---|---|
| **Imergir** | Doton, **Suiton**, **Hyouton** |
| **Inflamável** | Katon, **Fuuton** (GA), **Suiton** (GA) |
| **Venenoso** | Fuuton (também Suiton — referenciado em Suiton mas modelado aqui) |

Os outros são exclusivos do elemento dono (Lâmina de Raios = só Raiton, etc.).

### 2. Restrições de efeito por poder

Cada elemento tem efeitos universais bloqueados (campo `blockedNinpouEffects` no `_meta` de cada arquivo):

| Elemento | Bloqueados | Razão |
|---|---|---|
| Katon | Algemar, Restringente, Barreira, Lança, Criar Arma, Nuvem, Correnteza | Fogo é imaterial |
| Fuuton | Algemar, Restringente, Lança, Criar Arma | Vento é imaterial |
| Raiton | Algemar, Restringente, Barreira, Lança, Criar Arma | Raio é imaterial |
| Doton | Nenhum (todos os universais) | - |
| Suiton | Nenhum (todos os universais) | - |

**Motor de regras precisa validar** isso quando o personagem comprar um efeito.

### 3. Parâmetros customizados de cada poder

O `_meta` de cada arquivo tem `powerNotes` com as fórmulas específicas:

- **Suiton:** Alcance Médio (10+2/Esp), Tamanho 1m/Esp, bônus de dano 0
- **Doton:** Alcance Curto (5+1/Esp), Tamanho 1m/Esp, bônus de dano 0, **+2 dureza adicional em criações**
- **Katon:** Alcance Médio (10+2/Esp), Tamanho 2m/Esp (maior!), **+2 dano**
- **Fuuton:** Alcance Médio (10+2/Esp), Tamanho 1m/Esp, **+2 dano**
- **Raiton:** **Alcance Longo (15+3/Esp)**, Tamanho 0,5m/Esp (menor!), **+1 dano**

Esses parâmetros já estão modelados nos poderes (lote 3) — não duplicar nos efeitos.

### 4. Hyouton e Mokuton

Esses KGs herdam dos efeitos universais (Ninpou) E dos efeitos Suiton/Fuuton/Doton conforme suas regras. **Vão ter arquivos próprios na onda 4c** com seus efeitos exclusivos (Espelhos Demoníacos pra Hyouton, Soushinki pro Mokuton).

### 5. Pré-requisitos por efeito

Alguns efeitos têm pré-requisitos no campo `rules.prerequisites`:

| Efeito | Pré-requisito |
|---|---|
| Névoa | Aptidão Lutar às Cegas OU habilidade de sensor |
| Venenoso | Perícia Venefício |
| Afiar | Efeito Energizar |
| Lâmina de Vento | Efeito Energizar |
| Lâmina de Raios | Atributo Espírito 8 |
| Arma Elétrica | Efeito Lâmina de Raios |
| Flutuar | Aptidão Maestria (Fuuton) + Usar Arma: Leque Gigante |

## 📋 Shape mantido

Mesmo shape do Lote 4a — não muda nada. Campo `powerNotes` no `_meta` é metadado pra rastreabilidade, **não importar no banco**.

## 🔧 Padrão de seed atualizado

```typescript
async function seedPowerEffects() {
  const files = [
    'effects-ninpou-universal.json',   // 4a (já existente)
    'effects-suiton.json',              // 4b (novos)
    'effects-doton.json',
    'effects-katon.json',
    'effects-fuuton.json',
    'effects-raiton.json',
    // 4c, 4d, 4e virão depois
  ];

  let total = 0;
  for (const file of files) {
    const effects = loadSeedFile(file);
    for (const e of effects) {
      await prisma.powerEffect.upsert({
        where: { code: e.code },
        create: e,
        update: e,
      });
    }
    total += effects.length;
  }
  console.log(`✓ ${total} efeitos de poder`);
}
```

## ✅ Validação pós-seed

Depois de `pnpm prisma db seed`, total deve ser **18 (lote 4a) + 14 (lote 4b) = 32 efeitos no banco**.

Verifique:
- **Névoa**: `availableFor: ["suiton"]`, `minLevel: 2`, `rules.prerequisites.aptitudes: ["lutar_as_cegas"]`
- **Imergir**: `availableFor: ["doton", "hyouton", "suiton"]` (3 poderes — cross-element)
- **Inflamável**: `availableFor: ["katon", "fuuton", "suiton"]` (3 poderes)
- **Lâmina de Raios**: `availableFor: ["raiton"]`, `rules.prerequisites.attributes.esp: 8`
- **Colisão de Ondas**: `minLevel: 6`, `stats.damage: 10`
- **Pele de Pedra**: `stats.duration: "INSTANTANEA_OU_SUSTENTADA"`
- Tabela tem 32 linhas totais

---

# 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── seed.ts                                          ← atualizar lista de arquivos em seedPowerEffects()
│   ├── seed-data/
│   │   ├── attributes.json
│   │   ├── clans.json
│   │   ├── combat-skills.json
│   │   ├── effects-ninpou-universal.json                 (lote 4a)
│   │   ├── effects-doton.json                            ← NOVO (4b)
│   │   ├── effects-fuuton.json                           ← NOVO (4b)
│   │   ├── effects-katon.json                            ← NOVO (4b)
│   │   ├── effects-raiton.json                           ← NOVO (4b)
│   │   ├── effects-suiton.json                           ← NOVO (4b)
│   │   ├── kekkei-genkais.json
│   │   ├── pericias.json
│   │   ├── powers.json
│   │   └── villages.json
```

---

# 🛠️ Comandos manuais seus

```bash
# Na raiz do projeto
cd ~/projects/arcana-forge

# 1. Confirma que lote 4a está aplicado e funcionando
pnpm prisma studio &
# Verifica: power_effects tem 18 linhas (do 4a)
# Fecha (Ctrl+C)

# 2. Descompacta o lote 4b
unzip ~/Downloads/seed-data-lote-4b.zip -d /tmp/

# 3. Copia os 5 JSONs novos pra prisma/seed-data/
cp /tmp/seed-data-lote-4b/effects-suiton.json prisma/seed-data/
cp /tmp/seed-data-lote-4b/effects-doton.json prisma/seed-data/
cp /tmp/seed-data-lote-4b/effects-katon.json prisma/seed-data/
cp /tmp/seed-data-lote-4b/effects-fuuton.json prisma/seed-data/
cp /tmp/seed-data-lote-4b/effects-raiton.json prisma/seed-data/

# 4. (opcional) Guarda README pra referência
cp /tmp/seed-data-lote-4b/README.md /tmp/lote-4b-README.md

# 5. Confere
ls prisma/seed-data/effects-*.json
# Esperado: 6 arquivos (1 universal + 5 elementais)
```

---

# 💬 Prompt pro Claude Code

```
# Aplicar Lote 4b do Seed: Efeitos Exclusivos dos 5 Elementos Básicos

Onda 4b do Lote 4 (Efeitos) pronta. 5 arquivos novos em `prisma/seed-data/` cobrindo Suiton, Doton, Katon, Fuuton e Raiton.

## Arquivos novos

- `prisma/seed-data/effects-suiton.json` (3 efeitos: Névoa, Prisão de Água, Colisão de Ondas)
- `prisma/seed-data/effects-doton.json` (3 efeitos: Imergir, Tremor, Pele de Pedra)
- `prisma/seed-data/effects-katon.json` (1 efeito: Inflamável)
- `prisma/seed-data/effects-fuuton.json` (4 efeitos: Venenoso, Afiar, Lâmina de Vento, Flutuar)
- `prisma/seed-data/effects-raiton.json` (3 efeitos: Lâmina de Raios, Arma Elétrica, Descarga)

## Antes de codar

1. **Leia `/tmp/lote-4b-README.md`** — explica:
   - Efeitos cross-element (Imergir está em Doton+Suiton+Hyouton; Inflamável em Katon+Fuuton+Suiton)
   - Restrições por elemento (Katon não pode usar Algemar, etc.) — documentadas no `_meta.powerNotes.blockedNinpouEffects` de cada arquivo
   - Validação esperada: total no banco vira 32 efeitos (18 do 4a + 14 do 4b)

2. **Schema não muda** — tabela `PowerEffect` do 4a serve. Não criar migration.

3. **Não invente regras** — siga o livro fielmente, descritos em cada JSON.

## Tarefas

1. Atualizar função `seedPowerEffects()` em `prisma/seed.ts` pra incluir os 5 arquivos novos na lista de arquivos a carregar
2. Rodar `pnpm prisma db seed`
3. Validar no Prisma Studio conforme checklist no README:
   - Tabela `power_effects` tem 32 linhas totais
   - **Névoa** com `availableFor: ["suiton"]` e `rules.prerequisites.aptitudes: ["lutar_as_cegas"]`
   - **Imergir** com 3 poderes em `availableFor` (cross-element)
   - **Inflamável** com 3 poderes em `availableFor` (cross-element via GA)
   - **Lâmina de Raios** com `rules.prerequisites.attributes.esp: 8`

## ⛔ Limites

- **NÃO criar** validações no motor de regras pra restrições de efeito por poder ainda — virá em sessão dedicada quando todas as ondas chegarem
- **NÃO criar** UI de seleção de efeitos
- **NÃO toque** em outros JSONs (powers, clans, etc.)
- **NÃO faça** `git push`

## Após aplicar

Documente no `SESSION-LOG.md`:
- Total de efeitos no banco após esta onda
- Validações que rodaram com sucesso
- Próximo passo: aguardando ondas 4c, 4d, 4e
```
