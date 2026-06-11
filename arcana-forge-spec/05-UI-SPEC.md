# 05 — Especificação de UI

> ⚠️ **LEIA ANTES DE IMPLEMENTAR:** Este documento descreve **estrutura e fluxos** de UI. Para a **estética visual real** (cores, fontes, animações, layout final), você DEVE ler também `08-VISUAL-REFERENCE.md` e estudar o arquivo `reference/satsuki-ficha-reference.html`. Este documento sozinho não comunica suficientemente a identidade visual do produto.

## 🎯 Visão geral

A UI do Arcana Forge prioriza **clareza informacional** e **estética cinematográfica**. Cada tela é desenhada para ser **utilizada na mesa de jogo** — o jogador precisa achar a informação em menos de 5 segundos, mesmo em telas mobile pequenas.

### Princípios de UI

1. **Above-the-fold matters.** Em qualquer tela, o que importa mais aparece primeiro.
2. **Densidade controlada.** Informação completa, mas sem poluição.
3. **Feedback imediato.** Cada ação tem confirmação visual em < 200ms.
4. **Mobile-first nas telas críticas** (ficha, jutsu modal, combate). Desktop é otimização.
5. **Estados claros.** Loading, vazio, erro, sucesso — cada um tem visual próprio.
6. **Acessibilidade respeitada.** Contraste WCAG AA, navegação por teclado, ARIA labels.

---

## 🎨 Sistema de design

### Tokens de cor (CSS variables)

```css
:root {
  /* Backgrounds */
  --bg-deep: #0a0b0e;
  --bg-paper: #14161c;
  --bg-card: #1a1d25;
  --bg-card-2: #1f2330;

  /* Ink (text) */
  --ink: #e8e4dc;
  --ink-muted: #8a8b94;
  --ink-faint: #4a4d57;

  /* Ice (accent primary) */
  --ice: #9bb8d1;
  --ice-bright: #c8dcea;
  --ice-deep: #5b7a96;

  /* Semantic */
  --success: #6ec45c;
  --warning: #d4a04c;
  --danger: #a8302a;
  --seal: #8a1f1f;  /* selo vermelho (忍) */

  /* Borders */
  --border: rgba(155, 184, 209, 0.15);
  --border-strong: rgba(155, 184, 209, 0.4);

  /* Shadow */
  --shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.8);
}
```

### Tipografia

| Uso | Fonte | Peso | Tamanho típico |
|---|---|---|---|
| Display (nomes grandes) | Cormorant Garamond | 400 italic | 48-92px |
| Headers de seção | Cormorant Garamond | 400 | 22-32px |
| Body | EB Garamond | 400 | 13-15px |
| Labels técnicos | Cinzel | 500-600 | 9-11px (letter-spacing alto) |
| Kanji | Shippori Mincho | 700 | varia |
| UI inputs/botões | Inter (system) | 500 | 14px |

### Spacing

Múltiplos de 4px: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96.

### Componentes base (shadcn/ui)

Usar:
- `Button` (variants: primary, secondary, ghost, danger, ice)
- `Dialog` (modais)
- `Sheet` (drawers mobile)
- `Input`, `Textarea`, `Select`
- `Tabs`
- `Tooltip`
- `Toast` (sonner)
- `Avatar`
- `Skeleton` (loading states)
- `Badge`

Customizações:
- Trocar cor primária para `--ice`
- Bordas: 1px sólida com `--border`
- Hover states: leve scale (1.02) + border-strong
- Active: scale (0.98)

---

## 🗺️ Mapa de rotas

```
/                                  Landing/marketing page (pública)
/login                             Login com Google
/dashboard                         Lista de personagens do user (autenticado)
/characters/new                    Wizard de criação
/characters/[id]                   Visualizar ficha (próprio ou compartilhada)
/characters/[id]/edit              Editor da ficha
/characters/[id]/diary             Diário (também acessível como aba dentro de /[id])
/characters/[id]/levelup           Modo Subir NC
/settings                          Perfil do user, preferências
/share/[token]                     Ficha pública (sem login)
/u/[username]                      Perfil público do user (lista de PJs públicos)
```

---

## 📱 Telas principais

### 1. Landing page (`/`)

**Objetivo:** apresentar o produto, captar interesse, login.

**Estrutura:**
- Hero: tagline grande, imagem da Satsuki (ou outra), CTA "Entrar com Google"
- Seção de features (3-4 cards): "Ficha automática", "Visual cinematográfico", "Ferramenta de mesa", "Diário narrativo"
- Demo: screenshot ou GIF da ficha em uso
- Footer: links GitHub, créditos do sistema SnS, contato

**Visual:** o mesmo dark+ice da ficha. Marketing **não** é separado em estética.

### 2. Login (`/login`)

Simples. Card centralizado:
- Logo Arcana Forge
- Título "Entre no Arcana Forge"
- Botão "Continuar com Google" (variant `ice`)
- Texto pequeno: "Não criamos conta com senha. Use sua conta Google."
- Link "Voltar"

**Após login:** redirect pra `/dashboard`.

### 3. Dashboard (`/dashboard`)

**Objetivo:** lista de personagens do user, criar novo.

**Estrutura:**
```
┌────────────────────────────────────────────────────┐
│ [Navbar com logo, avatar, menu]                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Bem-vindo de volta, [nome]                        │
│                                                    │
│  ┌─[+ Novo Personagem]──────────────────────────┐  │
│                                                    │
│  Meus Personagens (3)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ [hero]   │  │ [hero]   │  │ [hero]   │         │
│  │ Satsuki  │  │ Naruto   │  │ Sasuke   │         │
│  │ NC 6     │  │ NC 4     │  │ NC 7     │         │
│  │ Genin    │  │ Genin    │  │ Chuunin  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Card de personagem:**
- Imagem (hero ou header), 200x280px
- Nome (Cormorant 24px)
- NC + Rank (badge)
- Clã (badge ice)
- Tags: "Público" se compartilhado
- Hover: borda ice + leve scale
- Click: vai pra `/characters/[id]`
- Menu de contexto (3 pontos): Editar, Duplicar, Compartilhar, Deletar

### 4. Wizard de criação (`/characters/new`)

**Objetivo:** criar personagem em 4 passos rápidos, depois cair no editor.

**Passos:**

**Step 1 — Identidade**
- Nome (input)
- Idade (number)
- Gênero (select com opções comuns + outro)
- NC inicial (select 4-20, default 4)
- Rank (auto-calculado pelo NC, mas mostrável)

**Step 2 — Clã/Hijutsu**
- Select de clã (autocomplete)
- Ou checkbox "Sem clã" (orfão / desconhecido)
- Preview dos benefícios do clã selecionado

**Step 3 — Atributos (preview rápido)**
- Mostra 7 sliders/inputs já com mínimos do NC respeitados
- Indicador de pontos restantes
- Botão "Distribuir depois" pula essa parte (atributos ficam no mínimo)

**Step 4 — Confirmação**
- Resumo de tudo
- Botão "Criar e continuar pro editor"

**Após criar:** redirect pra `/characters/[id]/edit` com ficha já carregada.

### 5. Ficha (`/characters/[id]`)

Esta é **a tela principal do produto**. Reusa todo o trabalho de design feito até agora. Layout:

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER FIXO (imagem 9 ao fundo, translúcido)                   │
│ Clã · 雪 Yuki    │   FICHA DE PERSONAGEM   │ Vila · Nami       │
├────────────────────────────────────────────────────────────────┤
│ HERO                                                           │
│ ┌──────────┐  Hijutsu · Hyouton                                │
│ │          │  Satsuki Yuki                                     │
│ │ [imagem] │  A Lâmina do Gelo                                 │
│ │  hero    │              Idade 14 | Genin | NC 6 | Neutra     │
│ │          │  ┌──┬──┬──┬──┬──┬──┬──┐                          │
│ │   忍    │  │1 │6 │6 │2 │1 │5 │3 │                          │
│ │          │  └──┴──┴──┴──┴──┴──┴──┘                          │
│ │          │  Energias  Habilidades            Sociais         │
│ │          │  Vit 55    CC 12  CD 9            Car 1           │
│ │          │  Chk 19    ESQ 9  LM 3            Man 2           │
│ └──────────┘  "Não confunda silêncio com perdão."              │
├────────────────────────────────────────────────────────────────┤
│ BANNER FULL-WIDTH (imagem 10, translúcida)                     │
│         才能 · 技能                                            │
│         APTIDÕES · PERÍCIAS                                    │
├────────────────────────────────────────────────────────────────┤
│ APTIDÕES                       │ PERÍCIAS                      │
│ Gratuitas | Compradas          │ Acrobacia 5 | Furtividade 5  │
│ Especialista (Katana)          │ Escapar 5   | Prestidig 5   │
│ Acuidade                       │ Atletismo 3 | Procurar 3    │
│ Ataque Poderoso                │ Prontidão 3 | Rastrear 3    │
│ Velocista (comprada)           │ (não treinadas, opacas)      │
│ Lutar às Cegas                 │ Arte | Cultura | Disfarce   │
├────────────────────────────────────────────────────────────────┤
│ JUTSUS (4 cards com imagem de fundo)                           │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│ │ Gekkō- │ │ Getsu- │ │ Getsu- │ │ Shira- │                   │
│ │ ken    │ │ ga     │ │ mei    │ │ ha     │                   │
│ │ (Hyou) │ │ (Sui)  │ │ (Sui)  │ │ (Fuu)  │                   │
│ │ Click  │ │ p/ ver │ │ modal  │ │        │                   │
│ └────────┘ └────────┘ └────────┘ └────────┘                   │
├────────────────────────────────────────────────────────────────┤
│ COMBATE RÁPIDO              │ INVENTÁRIO                       │
│ Tachi    CC 12  Dano 3      │ Tachi ×1 · Wakizashi ×0          │
│ Tachi+AP CC 11  Dano 4      │ Shuriken ×18 · Colete            │
│ ...                          │ ...                              │
├────────────────────────────────────────────────────────────────┤
│ DIÁRIO (default colapsado)                                     │
│ ▸ Diário (17 entradas)                                         │
├────────────────────────────────────────────────────────────────┤
│ FOOTER (imagem 2 ao fundo, escrevendo à noite)                 │
│ Shinobi no Sho 4.1b · Genin · Vila Oculta do Tubarão           │
└────────────────────────────────────────────────────────────────┘
```

### Estados das seções

Cada seção (exceto Hero/Atributos/Energias) é **colapsável** via chevron no header. Quando colapsada:
- `Aptidões (5) ▸` — mostra contador
- Click expande
- Estado salvo em `Character.uiState.collapsedSections`

### Toolbar de ações flutuante

No canto inferior direito, **toolbar fixa** com botões:

| Botão | Ação | Quando aparece |
|---|---|---|
| **Editar** | Vai pro modo edição | Sempre que é dono |
| **Compartilhar** | Abre modal de link público | Sempre que é dono |
| **Subir NC** | Inicia fluxo de levelup | Sempre que é dono |
| **Voltar ao topo** | Scroll top | Após rolar |

---

### 6. Modal de Jutsu (clique em card de jutsu)

⭐ **Componente crítico.** Inspirado na referência que você mostrou.

```
┌──────────────────────────────────────────────────┐
│ Hyouton: Gekkōken                            [✕] │
│ 月光剣の術  · Lâmina da Luz da Lua               │
├──────────────────────────────────────────────────┤
│ [projectile] [Padrão] [Uma criatura]             │
│ [Comum do poder (à distância)] [Instantânea]     │
│                                                  │
│ NÍVEL DE USO                                     │
│ [1]  [2]  [3]   ← tabs                          │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ Chakra                                  3  │   │
│ │ Teste de Acerto (CD)              9 = 9    │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ CALCULADORA DE DANO                              │
│ ┌────┬──────┬────┬──────┬───────┬─────┬─────┬─┐ │
│ │DDA │2/ESP │ NV │OUTRO │ TOTAL │ 4-8 │ ... │ │ │
│ ├────┼──────┼────┼──────┼───────┼─────┼─────┤ │ │
│ │ 0  │  0   │ 6  │  0   │   6   │  6  │ 12  │..│ │
│ └────┴──────┴────┴──────┴───────┴─────┴─────┴─┘ │
│                                                  │
│ Chakra atual: 19                                 │
├──────────────────────────────────────────────────┤
│  [Cancelar]              [Usar Jutsu (3 Chk)]    │
└──────────────────────────────────────────────────┘
```

**Comportamento:**
- Tabs de nível mudam **TODAS** as colunas da calculadora ao serem clicadas (re-calcula tudo).
- Toggle "Ataque Poderoso" disponível como checkbox extra abaixo da calculadora (atualiza coluna OUTRO).
- "Usar Jutsu" debita chakra. Toast confirma: *"Chakra: 19 → 16"*. Se chakra < custo, botão fica disabled com tooltip.
- Tags no topo (`Padrão`, `Uma criatura`, etc.) são `Badge` pequenos.
- Background do modal: `bg-card`, blur leve no fundo.

### 7. Modal de Ataque (clique em arma da seção Combate Rápido)

Similar ao modal de jutsu, mas pra armas físicas:

```
┌──────────────────────────────────────────────────┐
│ Tachi                                        [✕] │
│ Espada mediana · corte · crítico 15-16           │
├──────────────────────────────────────────────────┤
│ [☐ Ataque Poderoso]   [☐ Ataque Múltiplo (2)]    │
│                                                  │
│ Precisão CC                              12      │
│                                                  │
│ CALCULADORA DE DANO                              │
│ DDA  2/ESP  NV  OUTRO  TOTAL  4-8  9-11  12-14  15-16
│  2     1    0    0      3     3    6     9     12   │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Cancelar]                              [OK]    │
└──────────────────────────────────────────────────┘
```

**Diferença do jutsu:** armas físicas não têm "Usar" (não custam chakra). É só calculadora. O botão "OK" só fecha o modal.

### 8. Modal de "Tomar Dano" (clique em barra de Vitalidade)

```
┌─────────────────────────────────────────┐
│ Tomar Dano                          [✕] │
├─────────────────────────────────────────┤
│ Vitalidade atual: 55                    │
│                                         │
│ Quanto de dano você sofreu?             │
│ [    8    ]                             │
│                                         │
│ ☐ Foi crítico (causa sangrando)         │
│                                         │
├─────────────────────────────────────────┤
│  [Cancelar]                  [Aplicar]  │
└─────────────────────────────────────────┘
```

### 9. Editor da ficha (`/characters/[id]/edit`)

Mesmo layout da ficha view, mas:
- Cada valor numérico vira clicável → input inline (igual ao protótipo atual)
- Aptidões: botão "+" pra adicionar (modal com pesquisa nas aptidões disponíveis, filtro por pré-requisitos cumpridos)
- Perícias: spinners +/- ao lado de cada valor
- Jutsus: lista com botão "+ Adicionar Jutsu" (modal pra escolher poder + efeito + customizar nome/lore)
- Toolbar topo: "Salvar" (ou auto-save), "Pontos restantes: X attr, Y per, Z pod", "Validar"
- Quando há erro/aviso: badge no canto da seção afetada

### 10. Diário (aba ou rota `/characters/[id]/diary`)

```
┌────────────────────────────────────────────────────┐
│ Diário                          [+ Nova Entrada]   │
├────────────────────────────────────────────────────┤
│ Filtrar por arco: [Todos ▾]                        │
│                                                    │
│ ▼ Ato 2 — Porto da Lua (10 entradas)               │
│   ┌────────────────────────────────────────────┐   │
│   │ Confronto com Sotan                        │   │
│   │ 12 de maio, 2026                           │   │
│   │ "Ao amanhecer, o pombo retornou..."        │   │
│   │                              [Ler] [Editar]│   │
│   └────────────────────────────────────────────┘   │
│   ...                                              │
│                                                    │
│ ▼ Ato 1 (4 entradas)                               │
│   ...                                              │
└────────────────────────────────────────────────────┘
```

**Editor de entrada:** modal full-screen com markdown editor simples (textarea + preview side-by-side).

### 11. Fluxo de Subir NC (`/characters/[id]/levelup`)

```
┌────────────────────────────────────────────────────┐
│ Subir Nível de Campanha                            │
├────────────────────────────────────────────────────┤
│ Atual: NC 6 (Genin)        Novo: NC 7 (Chuunin)    │
│                                                    │
│ Você ganhou:                                       │
│ +6 atributos   +4 perícias   +2 poder              │
│ +2 sociais (mínimo de atributo subiu)              │
│                                                    │
│ ⚠️ Atributos abaixo do novo mínimo (2):           │
│   For: 1 → precisa ≥ 2                             │
│   Int: 1 → precisa ≥ 2                             │
│   (gaste pelo menos 2 pontos aqui antes de outros) │
│                                                    │
│ ┌───────── Distribuir Atributos ─────────┐         │
│ │ [editor inline igual ao da ficha]      │         │
│ │ Pontos restantes: 4                    │         │
│ └────────────────────────────────────────┘         │
│                                                    │
│ ┌───────── Distribuir Perícias ──────────┐         │
│ │ [...]    Pontos restantes: 4           │         │
│ └────────────────────────────────────────┘         │
│                                                    │
│ ┌───────── Comprar Poder/Aptidões ───────┐         │
│ │ [...]    Pontos restantes: 2           │         │
│ └────────────────────────────────────────┘         │
│                                                    │
│ [Cancelar]            [Finalizar e Salvar]         │
└────────────────────────────────────────────────────┘
```

**Validação em tempo real:**
- Pontos restantes não podem ficar negativos
- Atributos abaixo do mínimo bloqueiam finalização
- Aptidões com pré-requisitos não cumpridos não aparecem na lista de compra

### 12. Modal de Compartilhar

```
┌──────────────────────────────────────────────────┐
│ Compartilhar Satsuki Yuki                    [✕] │
├──────────────────────────────────────────────────┤
│ Link público (qualquer um com o link vê)         │
│ ┌────────────────────────────────────┐ [Copiar] │
│ │ arcanaforge.app/share/aB3xY9...    │           │
│ └────────────────────────────────────┘           │
│                                                  │
│ ☑ Link ativo                                    │
│ ☐ Mostrar no meu perfil público                  │
│                                                  │
│ Estatísticas:                                    │
│ Visualizações: 12 · Última: há 2 horas           │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Desativar link]                       [Pronto] │
└──────────────────────────────────────────────────┘
```

### 13. Ficha pública (`/share/[token]`)

Mesmo layout da ficha, **read-only**, sem navbar/menu de usuário. Banner discreto no topo:
- *"Você está vendo a ficha pública de [nome]. Criada com Arcana Forge."*
- Botão "Criar minha conta" → `/login`

Visitante pode **expandir/colapsar seções localmente**, mas mudanças não persistem.

---

## 🎬 Componentes-chave detalhados

### `<CollapsibleSection>`

```typescript
type Props = {
  title: string;
  kanji?: string;
  count?: number;            // pra mostrar "(12)" quando colapsado
  defaultOpen?: boolean;     // padrão true
  storageKey: string;        // chave em uiState.collapsedSections
  characterId: string;       // pra salvar no banco
  children: ReactNode;
};
```

Comportamento:
- Header sempre visível com título + chevron
- Quando aberta: mostra conteúdo abaixo
- Click no header alterna estado
- Debounce de 500ms antes de persistir no banco (evita spam de saves)
- Visitante (ficha pública): muda só localmente, não persiste

### `<EditableValue>`

```typescript
type Props = {
  value: string | number;
  type?: 'number' | 'text';
  min?: number;
  max?: number;
  onSave: (newValue: string | number) => Promise<void>;
  readonly?: boolean;        // pra ficha pública
  validate?: (v: any) => string | null; // mensagem de erro ou null
};
```

Comportamento:
- Render como texto normal por default
- Click → vira input inline (mantém font/size/cor)
- Enter ou blur → tenta salvar
- Esc → cancela
- Loading state durante save
- Toast de erro se validation falhar

### `<JutsuCard>`

```typescript
type Props = {
  jutsu: CharacterJutsu;
  power: Power;
  powerEffect: PowerEffect;
  character: FullCharacter;
  onUse?: (chakraCost: number) => void;  // null = read-only
};
```

- Mostra: imagem do jutsu (background full), kanji do elemento (canto sup. esq.), nome em japonês, romaji, stats (CD, dano, chakra), descrição curta
- Click abre `<JutsuModal>`
- Hover: leve elevação

### `<DamageCalculator>`

```typescript
type Props = {
  character: FullCharacter;
  source: { type: 'weapon'; equipmentId: string } | { type: 'jutsu'; powerCode: string; effectCode: string };
  levelOverride?: number;  // pra tabs de nível em jutsus
  ataquePoderoso?: boolean;
  ataqueMultiplo?: 1 | 2 | 3;
};
```

Renderiza a tabela DDA/½ESP/NV/OUTRO/TOTAL/grau 1-4 conforme spec do motor.

### `<EnergyBar>`

```typescript
type Props = {
  label: string;
  current: number;
  max: number;
  color: 'vitality' | 'chakra' | 'social';
  onAdjust?: (newValue: number) => void;  // pra editor
  showAdjustButtons?: boolean;            // botões de tomar dano / gastar chakra
};
```

Visual:
- Label à esquerda
- Barra horizontal preenchendo proporcionalmente
- Valor "current/max" à direita
- Botões opcionais "−" e "+" pra ajustes rápidos
- Animação smooth ao mudar de valor

### `<AptitudePicker>` (modal pra adicionar aptidão)

- Lista todas as aptidões disponíveis
- Filtros: categoria, pré-requisitos cumpridos
- Cada item mostra: nome, custo, descrição curta, pré-reqs (com check ou X)
- Aptidões com pré-req não cumprido aparecem com opacity 0.5 + tooltip explicando
- Selecionar → preview à direita com descrição completa
- Botão "Adicionar" só ativa se pode comprar

---

## 📱 Responsividade

### Breakpoints

```typescript
sm: '640px'   // mobile landscape
md: '768px'   // tablet
lg: '1024px'  // desktop pequeno
xl: '1280px'  // desktop
2xl: '1536px' // wide
```

### Adaptações principais

| Componente | Desktop | Tablet | Mobile |
|---|---|---|---|
| Hero | 2 col (imagem 380px + info) | 1 col (imagem em cima) | 1 col compacto |
| Atributos | 7 col grid | 7 col | 4 col (2 linhas) |
| Stats row | 3 col (energias/skills/sociais) | 2 col | 1 col |
| Jutsus | 4 col | 2 col | 1 col |
| Aptidões + Perícias | 2 col | 1 col | 1 col |
| Modal jutsu | Centro 500px | Centro 90% | Full screen |
| Toolbar flutuante | Canto inferior direito | Canto | Bottom bar fixa |

### Navegação mobile

- Navbar vira hamburger menu
- Toolbar flutuante vira **bottom bar** fixa (mais ergonômico)
- Modais ocupam tela inteira em mobile

---

## ⚡ Estados de feedback

| Estado | Visual |
|---|---|
| **Loading inicial** | Skeleton (cards cinza animados) |
| **Loading após ação** | Spinner discreto no botão + disabled |
| **Empty (sem dados)** | Ilustração + texto + CTA "Criar primeiro personagem" |
| **Erro** | Toast vermelho + mensagem clara + ação de retry |
| **Sucesso** | Toast verde 2 segundos + pulso na área afetada |
| **Validação inline** | Borda vermelha + mensagem abaixo do campo |
| **Não autenticado** | Redirect pra /login com toast "Faça login para continuar" |
| **Sem permissão** | Página 403 com "Você não tem acesso a este personagem" |
| **Não encontrado** | 404 amigável "Personagem não existe ou foi removido" |

---

## ♿ Acessibilidade

### Mínimos do MVP

- **Contraste AA:** todo texto sobre fundo respeita 4.5:1 (já validado na paleta atual).
- **Navegação por teclado:** Tab atravessa todos os interativos. Enter ativa botões. Esc fecha modais.
- **Focus visible:** outline ice ao redor de elementos focados.
- **Labels ARIA:** todo input, botão ícone, e elemento custom tem `aria-label`.
- **Reduced motion:** animações respeitam `prefers-reduced-motion`.

### Skip no MVP (v2):
- Screen reader thorough testing
- Modo de alto contraste extra
- Tradução para outros idiomas

---

## 🎯 Fluxos críticos (sequência de telas)

### Fluxo: Novo Usuário cria primeiro PJ

```
/  → "Entrar" → Google popup → /dashboard
   → "+ Novo Personagem" → /characters/new
   → Step 1 (identidade) → Step 2 (clã) → Step 3 (atributos)
   → Step 4 (resumo) → "Criar" → /characters/[id]/edit
   → Distribui pontos → Auto-save → "Voltar" → /characters/[id]
   → Vê ficha pronta
```

### Fluxo: Usar jutsu em sessão (no celular)

```
/dashboard → tap no personagem → /characters/[id]
   → Scroll até Jutsus → tap em "Gekkōken"
   → Modal abre → mostra calculadora
   → tap "Usar Jutsu (3 Chk)"
   → Toast "Chakra 19 → 16"
   → Modal fecha → ficha mostra nova vit/chakra
   → "Tomei 8 de dano" → tap na barra de Vit
   → Modal "Tomar Dano" → digita 8 → Aplicar
   → Toast "Vit 55 → 47"
```

### Fluxo: Subir NC

```
/characters/[id] → toolbar "Subir NC"
   → Modal de confirmação → "Sim, NC 6 → 7"
   → /characters/[id]/levelup
   → Vê alertas de mínimo + pontos ganhos
   → Distribui atributos (For 1→2, Int 1→2 obrigatórios)
   → Distribui perícias
   → Compra Ambidestria (aptidão)
   → "Finalizar"
   → Validação OK → save → /characters/[id] (ficha atualizada)
```

---

## 🚧 Questões abertas

> 🔶 **Animations:** quanto investir em micro-animations no MVP? Recomendo **mínimo** — só feedback visual essencial. Cinematic transitions ficam pra v2.

> 🔶 **Sound design:** o produto tem ambiente sonoro? Tocar SFX ao usar jutsu, tomar dano? Não no MVP, talvez nunca. Discutir antes de v2.

> 🔶 **Print/PDF:** ficha imprimível? Útil pra mesa física. Não no MVP, fácil de adicionar depois com `@media print`.

> 🔶 **Theme toggle:** mesmo que MVP só tenha 1 tema, o toggle (dark/light) vale ser preparado? Sugiro **não** — light theme não combina com identidade, melhor manter dark-only.

---

*Próximo documento: `06-MVP-ROADMAP.md` — plano de implementação em fases.*
