# Seed Data — Lote 4c (KGs e Hijutsus Complexos)

Terceira onda do **Lote 4 (Efeitos)**. Inclui KGs avançadas e Hijutsus restritos com mecânicas únicas.

## 📦 Conteúdo desta onda (9 arquivos)

| Arquivo | Efeitos | Poder |
|---|:---:|---|
| `effects-hyouton.json` | 1 | **Hyouton** — KG do clã Yuki ✨ pra Satsuki |
| `effects-mokuton.json` | 2 | **Mokuton** — KG do clã Senju |
| `effects-sabaku.json` | 6 | **Sabaku Hijutsu** — Manipulação de areia (Gaara) |
| `effects-jiton.json` | 2 | **Jiton** — Magnetismo (Satetsu/Sakin) |
| `effects-yonbi-youton.json` | 2 | **Yonbi Youton** — Elemento Lava (Bijuu) |
| `effects-aoi-katon.json` | 1 | **Aoi Katon** — Fogo Azul (Matatabi) |
| `effects-sanbi-suiton.json` | 2 | **Sanbi Suiton** — Água do Sanbi (Isobu) |
| `effects-senjutsu.json` | 2 | **Senjutsu** — Modo Eremita |
| `effects-hachimon.json` | 15 | **Hachimon Tonkou** — Oito Portões + Taijutsus avançados |
| **Total** | **33** | |

## 🔑 Pontos importantes

### 1. Hyouton — efeito chave pra Satsuki

**Espelhos Demoníacos** (Nv 6) é o efeito icônico do clã Yuki. Pré-requisitos: aptidão Ataque em Movimento + efeito Imergir. Satsuki precisaria evoluir esses dois primeiro pra ter acesso.

### 2. Hachimon — abstração diferente do livro

Cada **portão** é modelado como um efeito separado (`hachimon_1_kaimon` até `hachimon_8_shimon`). Isso permite o motor de regras tratar cada um como entrada no banco. **Eles são CUMULATIVOS no sentido de "libera gradualmente"** mas os bônus de cada portão **substituem** o anterior (regra do livro). Lógica fica no motor, não nos dados.

Os **7 Taijutsus avançados** (Elbow, Straight, Lariat, Hell Stab, Guillotine Drop, Linger Bomb, Reverse Chop) entram como efeitos separados com `minLevel` correspondente ao nível mínimo do poder Hachimon pra acessá-los.

### 3. Senjutsu — abstração ainda mais diferente

O livro não usa "efeitos" tradicionais pra Senjutsu. Modelei como **lista de bônus selecionáveis** dentro de um único "efeito" (`modo_eremita_bonus`), com cada bônus listado em `rules.availableBonuses`. Quando o usuário usa Senjutsu, ele escolhe da lista qual ativar. Motor precisa entender esse shape.

### 4. Yonbi Youton, Aoi Katon, Sanbi Suiton — variantes Bijuu

Esses poderes são variações de Ninpou com efeitos exclusivos. **Por padrão são Hijutsus que requerem Jinchuuriki**, mas o Guia Avançado permite comprar como hijutsu independente (Esp 4).

**Restrições de elemento críticas:**
- Yonbi Youton: só pode aprender Youton + Doton + Katon
- Aoi Katon: funciona como Katon comum, sem desvantagem vs Suiton
- Sanbi Suiton: funciona como Suiton comum

### 5. Jiton — sub-variantes

Jiton tem **2 variantes obrigatórias**: Satetsu (Areia de Ferro) ou Sakin (Poeira de Ouro). Modelado no `_meta.powerNotes.variants`. Os efeitos têm `rules.variantOnly: "satetsu"` quando exclusivos de uma vertente. **Areia Especial é compra obrigatória** pra Jiton.

### 6. Sabaku — Pirâmide tem pré-req de Prisão de Areia

Pirâmide (Nv 9) requer **efeito Prisão de Areia** comprado antes. Não pode pular evoluções, mas pode pular níveis se cumprir pré-req específico.

## ⚠️ Decisões que tomei (transparência)

- **NÃO incluí Gobi Futton, Rokubi Suiton, Kyuubi Cura da Raposa** porque o Guia Avançado as descreve com estruturas completamente diferentes (técnicas individuais, não efeitos). Cabem em lote separado se quiser depois — me avisa.
- **NÃO incluí Magen** (genjutsus do clã Kurama/Sarutobi) — é poder restrito de clã, vai no lote 4d junto com Iryou, Fuuinjutsu, Rasengan, etc.
- **NÃO incluí Dokujutsu** (Arte dos Venenos do Sasori) — é hijutsu restrito que mereceria entrar aqui mas o livro o trata como variante de Ninpou. Se quiser eu acrescento num lote suplementar.
- **NÃO incluí Modos Bijuu/Bijuudama/Manto** (ver Livro de Hijutsus p. 22-50) — essas são **regras do poder Jinchuuriki**, não efeitos. Vão precisar entrar no poder Jinchuuriki diretamente (lote suplementar de poderes).

Se você quiser TUDO TUDO mesmo (Gobi Futton, Bijuus completos), me sinaliza e eu faço lote 4f depois.

## 📋 Shape mantido

Mesmo shape do 4a/4b. Apenas o `effects-hachimon.json` e `effects-senjutsu.json` usam mais campos em `rules` por causa das mecânicas particulares. Motor JSONB lida.

## 🔧 Padrão de seed atualizado

```typescript
async function seedPowerEffects() {
  const files = [
    'effects-ninpou-universal.json',   // 4a
    'effects-suiton.json',              // 4b
    'effects-doton.json',
    'effects-katon.json',
    'effects-fuuton.json',
    'effects-raiton.json',
    'effects-hyouton.json',             // 4c (novos)
    'effects-mokuton.json',
    'effects-sabaku.json',
    'effects-jiton.json',
    'effects-yonbi-youton.json',
    'effects-aoi-katon.json',
    'effects-sanbi-suiton.json',
    'effects-senjutsu.json',
    'effects-hachimon.json',
    // 4d, 4e virão
  ];
  // resto igual
}
```

## ✅ Validação pós-seed

Total no banco depois de aplicar **4a + 4b + 4c = 32 + 33 = 65 efeitos**.

Verifique:
- **Espelhos Demoníacos**: `availableFor: ["hyouton"]`, `minLevel: 6`, pré-reqs `["ataque_em_movimento"]` + `["imergir"]`
- **Golem (Mokujin)**: `availableFor: ["mokuton"]`, `minLevel: 7`, com evolução Nv 10 (Selar Chakra)
- **Areia Especial**: `availableFor: ["sabaku_hijutsu", "jiton"]` (cross), `minLevel: 2`
- **Pirâmide**: `availableFor: ["sabaku_hijutsu"]`, `minLevel: 9`, `rules.prerequisites.effects: ["prisao_de_areia"]`
- **Hachimon 8 (Shimon)**: `availableFor: ["hachimon_tonkou"]`, `rules.afterClosing.deathAfter: true`
- **Modo Eremita Bonus**: `availableFor: ["senjutsu"]`, com 9 bônus em `rules.availableBonuses`
- Total tabela: 65 linhas

---

# 📁 Estrutura de pasta esperada

```
arcana-forge/
├── prisma/
│   ├── seed.ts                                  ← atualizar lista
│   ├── seed-data/
│   │   ├── (arquivos anteriores 1, 2, 3, 4a, 4b)
│   │   ├── effects-hyouton.json                 ← NOVO (4c)
│   │   ├── effects-mokuton.json                 ← NOVO
│   │   ├── effects-sabaku.json                  ← NOVO
│   │   ├── effects-jiton.json                   ← NOVO
│   │   ├── effects-yonbi-youton.json            ← NOVO
│   │   ├── effects-aoi-katon.json               ← NOVO
│   │   ├── effects-sanbi-suiton.json            ← NOVO
│   │   ├── effects-senjutsu.json                ← NOVO
│   │   └── effects-hachimon.json                ← NOVO
```

---

# 🛠️ Comandos manuais seus

```bash
cd ~/projects/arcana-forge

# 1. Confirma lote 4b aplicado
pnpm prisma studio &
# power_effects deve ter 32 linhas
# Ctrl+C

# 2. Descompacta lote 4c
unzip ~/Downloads/seed-data-lote-4c.zip -d /tmp/

# 3. Copia os 9 JSONs novos
cp /tmp/seed-data-lote-4c/effects-hyouton.json prisma/seed-data/
cp /tmp/seed-data-lote-4c/effects-mokuton.json prisma/seed-data/
cp /tmp/seed-data-lote-4c/effects-sabaku.json prisma/seed-data/
cp /tmp/seed-data-lote-4c/effects-jiton.json prisma/seed-data/
cp /tmp/seed-data-lote-4c/effects-yonbi-youton.json prisma/seed-data/
cp /tmp/seed-data-lote-4c/effects-aoi-katon.json prisma/seed-data/
cp /tmp/seed-data-lote-4c/effects-sanbi-suiton.json prisma/seed-data/
cp /tmp/seed-data-lote-4c/effects-senjutsu.json prisma/seed-data/
cp /tmp/seed-data-lote-4c/effects-hachimon.json prisma/seed-data/

# 4. Guarda README
cp /tmp/seed-data-lote-4c/README.md /tmp/lote-4c-README.md

# 5. Confere
ls prisma/seed-data/effects-*.json
# Esperado: 15 arquivos (1 universal + 5 4b + 9 4c)
```

---

# 💬 Prompt pro Claude Code

```
# Aplicar Lote 4c do Seed: KGs e Hijutsus Complexos

Onda 4c do Lote 4 pronta. 9 arquivos novos cobrindo Hyouton, Mokuton, Sabaku Hijutsu, Jiton, Yonbi Youton, Aoi Katon, Sanbi Suiton, Senjutsu e Hachimon Tonkou.

## Arquivos novos

- `effects-hyouton.json` (1 efeito: Espelhos Demoníacos)
- `effects-mokuton.json` (2 efeitos: Transmissor/Soushinki, Golem/Mokujin)
- `effects-sabaku.json` (6 efeitos: Areia Especial, Armadura de Areia, Terceiro Olho, Prisão de Areia, Areia Suspensa, Pirâmide)
- `effects-jiton.json` (2 efeitos: Areia Selada, Projétil Venenoso)
- `effects-yonbi-youton.json` (2 efeitos: Manto de Lava, Vulcão)
- `effects-aoi-katon.json` (1 efeito: Nekozume)
- `effects-sanbi-suiton.json` (2 efeitos: Sangoshō, Espelho D'Água)
- `effects-senjutsu.json` (2 efeitos: Modo Eremita Bonus, Senpou Ryōsei)
- `effects-hachimon.json` (15 efeitos: 8 Portões + 7 Taijutsus avançados)

Total: 33 efeitos novos.

## Antes de codar

1. **Leia `/tmp/lote-4c-README.md`** — pontos importantes:
   - Hachimon: 8 portões modelados como efeitos separados (não cumulativos por padrão — substitui)
   - Senjutsu: bônus selecionáveis dentro de UM efeito (não efeitos individuais por bônus)
   - Variantes Jiton (Satetsu/Sakin) marcadas em `rules.variantOnly`
   - Cross-element: Areia Especial vale pra Sabaku E Jiton

2. **Schema não muda** — tabela `PowerEffect` do 4a serve. Não criar migration.

3. **NÃO tente normalizar** o shape de Senjutsu/Hachimon — eles divergem propositalmente do padrão. JSONB resolve.

4. **Validar referências cruzadas**:
   - `imergir` (do 4b) é pré-requisito de Espelhos Demoníacos. Confirmar que o efeito Imergir existe no banco antes de aceitar Espelhos Demoníacos.
   - `prisao_de_areia` é pré-requisito de Pirâmide.
   - `energizar` é pré-requisito de Manto de Lava.
   - `lamina_de_raios` (Raiton, 4b) é pré-requisito de Hell Stab.
   - **Não implementar validação em código ainda** — só registrar no SESSION-LOG que existe dependência.

## Tarefas

1. Atualizar `seedPowerEffects()` em `prisma/seed.ts` pra incluir os 9 arquivos novos
2. Rodar `pnpm prisma db seed`
3. Validar no Prisma Studio:
   - Tabela `power_effects` tem 65 linhas totais (32 anteriores + 33 novos)
   - Espelhos Demoníacos com `availableFor: ["hyouton"]` e pré-reqs corretos
   - 8 portões Hachimon presentes com nomes japoneses corretos (Kaimon, Kyūmon, Seimon, Shōmon, Tomon, Keimon, Kyōmon, Shimon)
   - Hachimon 8 Shimon com `rules.afterClosing.deathAfter: true`
   - Modo Eremita Bonus com 9 bônus em `rules.availableBonuses`
   - Areia Especial em 2 poderes (cross-element Sabaku + Jiton)

## ⛔ Limites

- **NÃO implemente** validações de pré-requisito cruzadas no motor de regras ainda
- **NÃO modele** Modos Bijuu (Manto, Forma, Bijuudama) — esses são parte do poder Jinchuuriki, não efeitos
- **NÃO toque** em outros JSONs
- **NÃO faça** `git push`

## Após aplicar

Documente no `SESSION-LOG.md`:
- Total de efeitos no banco
- Pré-requisitos cruzados detectados (Imergir, Prisão de Areia, Energizar, Lâmina de Raios) que vão precisar de validação no motor em sessão futura
- Próximo passo: ondas 4d (poderes restritos de clã) e 4e (efeitos novos do Guia Avançado)
```
