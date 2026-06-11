# 08 — Referência Visual

## 🎯 Por que este documento existe

A especificação textual (00-07) define **o quê** construir e **como** estruturar o código. Mas estética **não se descreve bem em palavras**.

Este documento aponta para a **fonte de verdade visual** do projeto: o arquivo `reference/satsuki-ficha-reference.html` que está nesta mesma pasta.

> ⚠️ **CRÍTICO para o Claude Code:** Antes de implementar qualquer componente visual da ficha de personagem, **abra e estude `reference/satsuki-ficha-reference.html`**. Esse arquivo é o **resultado de iterações com o usuário**, e o estilo final foi explicitamente aprovado. Recriar a partir do zero baseado apenas em descrição textual produzirá algo diferente — e diferente é errado.

---

## 📄 Sobre o arquivo de referência

**Arquivo:** `arcana-forge-spec/reference/satsuki-ficha-reference.html`

**O que é:** uma ficha completa da personagem Satsuki Yuki (NC 6, clã Yuki, Hijutsu Hyouton) renderizada em HTML estático, com todos os componentes visuais que existirão no produto final:

- Header com identidade do clã/vila
- Hero com retrato + nome + atributos + energias + habilidades
- Banner full-width entre seções (transição cinematográfica)
- Aptidões + Perícias lado a lado
- 4 cards de jutsu com imagem em fundo full-card
- Combate Rápido + Inventário lado a lado
- Footer com imagem ambient
- Camada atmosférica de fundo (imagem fixed translúcida)
- Marca d'água de kanjis 雪 e 皐月 nos cantos
- Animações sutis (fade-up stagger, shimmer dos kanjis)

**Tecnologia do arquivo:** HTML + CSS puro (sem framework). Imagens em base64 embutidas.

**O que NÃO é:** código de produção pra copiar literalmente. Você vai **adaptar pra Next.js + Tailwind + React components**. Mas a **estética, proporções, sensação** devem ser replicadas fielmente.

---

## 🎨 Decisões visuais NÃO-NEGOCIÁVEIS

Lista do que tem que ser mantido na adaptação pra React/Tailwind. Se em algum momento surgir dúvida "será que mudo isso?", a resposta padrão é **não**.

### Paleta de cor

Exatamente como no HTML de referência:

| Token CSS | Hex | Uso |
|---|---|---|
| `--bg-deep` | `#0a0b0e` | Fundo principal (quase preto, levemente azulado) |
| `--bg-paper` | `#14161c` | Fundo de áreas elevadas |
| `--bg-card` | `#1a1d25` | Fundo dos cards |
| `--bg-card-2` | `#1f2330` | Cards levemente elevados (hover) |
| `--ink` | `#e8e4dc` | Texto principal (creme, não branco puro) |
| `--ink-muted` | `#8a8b94` | Texto secundário (cinza) |
| `--ink-faint` | `#4a4d57` | Texto desabilitado, brushes sutis |
| `--ice` | `#9bb8d1` | Accent principal (azul-gelo médio) |
| `--ice-bright` | `#c8dcea` | Accent destaque (azul-gelo claro) |
| `--ice-deep` | `#5b7a96` | Accent profundo (azul-gelo escuro) |
| `--seal` | `#8a1f1f` | Selo vermelho (忍) — único toque cromático fora da paleta gelo |
| `--border` | `rgba(155, 184, 209, 0.15)` | Bordas sutis padrão |
| `--border-strong` | `rgba(155, 184, 209, 0.4)` | Bordas em hover/foco |

**Branco puro (`#ffffff`) é proibido em texto.** Use sempre `--ink` ou `--ink-muted`. Branco puro fere o olho no fundo escuro e quebra a coesão da paleta.

### Tipografia

**Quatro fontes**, cada uma com propósito específico. Carregar via `next/font/google`:

| Fonte | Uso | Pesos a importar |
|---|---|---|
| **Cormorant Garamond** | Display (nomes grandes, títulos editoriais), itálico nos destaques | 300, 400, 500, 600, 700 + 300i, 400i |
| **EB Garamond** | Body (texto corrido, descrições) | 400, 500, 600 + 400i |
| **Shippori Mincho** | Kanji (japonês decorativo: 雪, 皐月, 氷, 水, 風, 忍, etc.) | 500, 700, 800 |
| **Cinzel** | Labels técnicos (CINZEL EM CAIXA ALTA COM LETTER-SPACING ALTO) | 400, 500, 600 |

**Hierarquia tipográfica:**
- Display 68px Cormorant 400 → nome do personagem
- H2 22px Cormorant 400 → títulos de seção (com kanji ao lado)
- Body 15px EB Garamond 400 → texto corrido
- Label 9-11px Cinzel 500 com `letter-spacing: 0.3em` → CINZEL "ATRIBUTOS", "JUTSUS", etc.
- Kanji 14-38px Shippori 700 → caracteres japoneses

**Nada de fonte sans-serif moderna** (Inter, Roboto, etc.) em conteúdo da ficha. Apenas em UI técnica fora da ficha (botões de formulário, inputs do dashboard).

### Spacing e composição

- **Grid de 7 colunas** para atributos (sempre 7, mesmo em mobile pequeno colapsa pra 4+3 ou 2×4)
- **Padding generoso** mas controlado: cards têm 14-18px interno, seções têm 28-36px entre elas
- **Bordas finas** (1px) com `--border` para divisão sutil; uso de bordas grossas é exceção
- **Sem border-radius arredondado.** Todo elemento tem cantos retos ou no máximo 2-3px. Cantos arredondados modernos não combinam com a estética editorial/marcial

### Efeitos visuais críticos

1. **Camada atmosférica fixa.** Imagem panorâmica do personagem em chakra como `body::before` com `position: fixed`, opacity `0.08`, blur leve, escala de cinza. Persiste durante scroll.
2. **Marca d'água de kanji.** Caracteres gigantes 雪 (esquerda) e 皐月 (direita) em `position: fixed`, opacity `0.025`, animação shimmer 8s.
3. **Brush strokes (suiboku).** Linhas decorativas com mask SVG simulando pinceladas — separam blocos grandes.
4. **Gradient overlay nos cards de jutsu.** Imagem cobre o card todo, gradient escurece de `transparent` (25% do topo) → `rgba(10,11,14,0.92)` (75% baixo). Texto fica perfeitamente legível embaixo, imagem visível em cima.
5. **Selo 忍.** Quadrado vermelho rotacionado -6°, borda dupla, posicionado sobre o canto da imagem do hero.
6. **Animação fade-up stagger.** Seções aparecem com `translateY(20px) → 0` e `opacity 0 → 1` em sequência (delays 0.05s, 0.15s, 0.25s...).
7. **Hover em cards de jutsu.** `translateY(-4px)` + borda fica `--border-strong`.
8. **Cards de jutsu têm `min-height: 420px`** para padronizar grid mesmo quando descrições variam.

### Detalhes de estilo que parecem pequenos mas matam se errado

- **Letter-spacing nos labels Cinzel:** sempre `0.3em` ou `0.4em`. Sem isso vira "fonte chique genérica", com isso vira "label de design editorial".
- **`text-transform: uppercase`** nos labels Cinzel, sempre.
- **Itálico no nome.** Sobrenome "Yuki" é `font-style: italic`, gera contraste com "Satsuki" em romano.
- **Energias têm barra fina (3px),** não barra grossa estilo MMO.
- **Tabela de atributos:** valor central GIGANTE (32px+), label pequeno em cima, kanji minúsculo embaixo. Hierarquia clara.
- **`box-shadow: 0 30px 80px -20px rgba(0,0,0,0.8)` na imagem hero.** Esse shadow específico cria profundidade sem ser óbvio.

---

## 🔄 Como adaptar pra Next.js + React + Tailwind

### Estratégia geral

1. **Tokens CSS** → arquivo `src/styles/tokens.css`. Já estão no HTML, basta extrair as `:root { ... }` variables.
2. **Fontes** → `next/font/google` em `src/app/layout.tsx`. Expor como CSS variables (`--font-cormorant`, etc.).
3. **Tailwind config** → estender `theme.extend.colors` referenciando as CSS vars (`bg-deep: 'var(--bg-deep)'`).
4. **Componentes** → quebrar o HTML em components React. Cada `<section>` do HTML vira tipicamente um component em `src/components/ficha/`.
5. **Animações** → CSS puro via `@keyframes` no `globals.css` ou `tokens.css`. Não use Framer Motion pro stagger inicial — CSS é mais performante.
6. **Imagens** → usar `next/image` sempre. Imagens da Satsuki no HTML são base64 (referência), no produto serão URLs do storage.

### Mapeamento de componentes

| Seção HTML | Component React |
|---|---|
| `.top-header` | `<FichaHeader character={...} />` |
| `.hero` | `<FichaHero character={...} />` |
| `.attributes` (grid 7 col) | `<AttributesGrid attrs={...} />` |
| `.stats-row` | `<StatsRow energies={...} skills={...} socials={...} />` |
| `.quote-line` | `<QuoteLine text="..." />` |
| `.banner-full` | `<SectionDivider kanji="才能" label="APTIDÕES" image={...} />` |
| `.two-cols` (aptidões + perícias) | `<TwoColumnLayout left={<Aptitudes/>} right={<Pericias/>} />` |
| `.jutsus` + `.jutsu` | `<JutsusGrid jutsus={...} />` + `<JutsuCard jutsu={...} />` |
| `.bottom-row` (combate + inventário) | `<TwoColumnLayout left={<CombatTable/>} right={<Inventory/>} />` |
| `.footer-wrap` | `<FichaFooter image={...} />` |

### Exemplo de adaptação — JutsuCard

**No HTML de referência:**
```html
<div class="jutsu">
  <div class="jutsu-img">
    <span class="jutsu-rank">氷</span>
    <img src="data:image/webp;base64,..." alt="">
  </div>
  <div class="jutsu-body">
    <div class="jutsu-element">Hyouton · Canhão</div>
    <div class="jutsu-name">月光剣</div>
    <div class="jutsu-trans">Gekkōken</div>
    <div class="jutsu-stats">
      <div class="jutsu-stat"><div class="ls">CD</div><div class="vs">9</div></div>
      <!-- ... -->
    </div>
    <div class="jutsu-desc">Arco prateado de gelo...</div>
  </div>
</div>
```

**Em React + Tailwind (estrutura, não exatamente o código final):**
```tsx
// src/components/ficha/JutsuCard.tsx
type Props = {
  jutsu: CharacterJutsu;
  power: Power;
  effect: PowerEffect;
  imageUrl?: string;
  onClick: () => void;
};

export function JutsuCard({ jutsu, power, effect, imageUrl, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="
        group relative min-h-[420px] overflow-hidden
        bg-bg-card border border-border
        transition-transform hover:-translate-y-1 hover:border-border-strong
        flex flex-col text-left
      "
    >
      {/* Imagem de fundo cobre o card todo */}
      <div className="absolute inset-0 z-0">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover object-[center_25%] saturate-[0.7] contrast-105 brightness-[0.85]"
          />
        )}
        {/* Gradient overlay: transparente em cima, escuro embaixo */}
        <div className="
          absolute inset-0
          bg-gradient-to-b
          from-[rgba(10,11,14,0.15)] via-[rgba(10,11,14,0.75)] to-[rgba(10,11,14,0.96)]
          [--tw-gradient-stops:rgba(10,11,14,0.15)_0%,rgba(10,11,14,0.2)_35%,rgba(10,11,14,0.75)_55%,rgba(10,11,14,0.92)_75%,rgba(10,11,14,0.96)_100%]
        " />
      </div>

      {/* Glow azul-gelo sutil no topo */}
      <div className="
        absolute top-0 left-0 right-0 h-[40%] z-[1] pointer-events-none
        bg-[radial-gradient(ellipse_at_top,rgba(155,184,209,0.12)_0%,transparent_70%)]
      " />

      {/* Kanji do elemento no canto */}
      <span className="
        absolute top-2.5 left-3.5 z-[3]
        font-jp font-bold text-4xl text-ice-bright
        [text-shadow:0_0_24px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.95)]
      ">
        {getElementKanji(power.element)}
      </span>

      {/* Body (texto no fundo) */}
      <div className="mt-auto relative z-[2] p-4 pt-4">
        <div className="font-sans text-[9px] tracking-[0.35em] text-ice uppercase mb-1.5">
          {power.name} · {effect.name}
        </div>
        <h3 className="font-jp font-bold text-lg text-ink leading-tight">
          {jutsu.kanjiName}
        </h3>
        <p className="font-serif italic text-sm text-ice-bright mb-3">
          {jutsu.translation}
        </p>
        <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-ice-deep/25">
          {/* stats ... */}
        </div>
        <p className="text-[11.5px] text-ink-muted leading-snug mt-2.5">
          {effect.shortDescription}
        </p>
      </div>
    </button>
  );
}
```

**Princípio:** estrutura React enxuta, mas **todos os efeitos visuais do CSS original preservados**. Tailwind permite isso via classes utilitárias + arbitrary values quando necessário.

---

## 🎯 Sequência de implementação visual recomendada

Para o Claude Code, ordem de criação dos componentes visuais (do mais fundamental ao mais específico):

1. **`tokens.css`** — cole as `:root` vars do HTML de referência
2. **`tailwind.config.ts`** — estenda com as cores tokenizadas
3. **`src/app/globals.css`** — keyframes (fadeUp, shimmer), fontes via next/font
4. **`src/app/layout.tsx`** — carrega fontes, aplica `--font-*` no body
5. **Página `/`** Hello World aplicando: bg deep, kanji watermark, um título display em Cormorant
6. **Componentes base** (Button, Input com tema ice via shadcn customizado)
7. **Componentes da ficha** seguindo o mapeamento acima — começa pelos atômicos (`<AttributeBox>`, `<EnergyBar>`) e sobe até os compostos (`<FichaHero>`, `<JutsuCard>`)
8. **Página de ficha** compondo tudo

A cada componente novo, **abra o HTML de referência no browser ao lado** e compare visualmente. Se a diferença for óbvia, ajuste antes de seguir.

---

## ⚠️ Coisas que NÃO copiar do HTML de referência

O HTML é demo estática. Algumas coisas no HTML **não** vão pro produto:

1. **Imagens em base64.** No produto vêm de storage (URL real).
2. **Conteúdo hardcoded da Satsuki.** No produto vem do banco.
3. **Estilo inline em alguns lugares.** Move pra classes Tailwind.
4. **A toolbar de edição inline** que apareceu na última iteração (com localStorage). No produto, edição é via `<EditableValue>` Server Action.
5. **Animação `shimmer` no body::before** com imagem do bg fixed. Manter, mas via CSS modular, não inline.
6. **A barra de "valor X editado(s)"** no canto inferior. No produto, edição é fluida sem toolbar fixa.

---

## 🖼️ Sobre imagens no produto

No HTML de referência, todas as imagens são de UMA personagem (Satsuki) com várias poses. **No produto:**

- Cada personagem tem **sua própria galeria** de imagens uploadadas pelo dono.
- Slots configuráveis: `hero`, `header`, `banner1`, `jutsu1-4`, `combat`, `inventory`, `footer`, `bg_atmosphere`.
- Configuração em `Character.uiState.imageSlots = { hero: 'imageId123', ... }`.
- Se um slot está vazio, o componente renderiza fallback (gradient de tom único, sem imagem). Não quebra layout.

Os slots devem aceitar imagem em proporções variadas e fazer `object-fit: cover` com `object-position` ajustável (idealmente persistido também por slot pro usuário poder fazer "fine tune").

---

## 📐 Responsividade — manter coerência visual

O HTML de referência tem breakpoints. Honre-os:

| Breakpoint | Comportamento |
|---|---|
| `desktop ≥ 1180px` | Layout completo, todas as colunas |
| `tablet 640-1180px` | Hero colapsa pra 1 coluna; jutsus viram 2 col; bottom-row vira 1 col |
| `mobile < 640px` | Tudo 1 col; atributos viram 4+3 ou 2x4; modais full-screen |

**Mobile não é "versão pobre" — é uso real em mesa de jogo.** Em mobile, a calculadora de dano e o uso de jutsu são MAIS importantes que no desktop.

---

## 🔍 Como verificar visual depois de implementar

Antes de marcar um componente como "pronto":

1. **Compare lado a lado** com o HTML de referência aberto no browser.
2. **Verifique 4 coisas em cada componente:**
   - Cores batem (use color picker se preciso)
   - Fontes corretas em cada elemento
   - Spacing parece o mesmo (não exato pixel, mas a sensação)
   - Hover/animações funcionando
3. **Teste em mobile** (DevTools > responsive mode).
4. **Tem dúvida se mudou demais?** Tirou screenshot e comparou? Geralmente "ah, isso aqui parece mais limpo" é você mudando estética sem querer. Volte ao original.

---

## 📌 Resumo executivo

- O arquivo `reference/satsuki-ficha-reference.html` é a **fonte de verdade visual** do projeto.
- Cores, fontes, layout, efeitos — tudo já decidido lá.
- Sua adaptação pra Next/React/Tailwind preserva a estética, não inventa novidade.
- Quando em dúvida, abra o HTML no browser e compare.
- Mudanças visuais que parecem "melhorias" geralmente são desvios — confirme antes.

---

*Este é o último documento da spec inicial. Documentos 00-08 + reference/ formam o pacote completo entregue pra implementação.*
