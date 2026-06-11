# Design System — `src/components/ui`

Primitives sem lógica de domínio. Use SEMPRE estes componentes em vez de digitar classes Tailwind à mão para containers, tipografia, layout, formulários, alertas, etc.

> **Princípio:** se você está digitando `rounded border bg-bg-card` ou `font-display text-[10px] uppercase tracking-[0.3em]` direto em uma tela, há um primitive faltando — pare e adicione um aqui antes de continuar.

Galeria visual interativa em `/components` (requer estar logado).

---

## Convenções

1. **`ui/*` é "burro"** — sem regra de RPG, sem fetch, sem state global. Só tokens semânticos e variants.
2. **Domain components (`character/*`) podem importar `ui/*`** — nunca o contrário.
3. **Props tipadas via union discriminada** (ex: `tone: 'danger' | 'success'`). Sem `string` solto.
4. **`className` aceito em todos** via `cn()` — escape-hatch local, mas evite usar pra recriar o estilo "do zero".
5. **`asChild`/`as`** quando faz sentido semântico (Section pode ser `section/div/article`).
6. **Cada primitive novo precisa ter showcase em `/components`** com badge "aprovado" verde.

---

## Containers

### `<Section>`
Container principal (card grande de uma seção/step do wizard).

```tsx
<Section>Conteudo</Section>
<Section tone="accent">Destacado com borda ice-deep</Section>
<Section tone="paper" padded={false}>Sem padding interno</Section>
```

Variants:
- `tone`: `default` (bg-card) · `accent` (borda ice-deep) · `paper` (bg-paper) · `plain` (sem fundo nem borda)
- `padded`: `true` (default, p-6) · `false`
- `as`: `section` (default) · `div` · `article` · `aside`

### `<Surface>`
Tile menor, aninhado dentro de Section ou listas.

```tsx
<Surface>Tile padrao</Surface>
<Surface tone="elevated" padding="lg">Maior</Surface>
<Surface interactive>Card clicavel</Surface>
```

Variants:
- `tone`: `default` (bg-card-2) · `elevated` (bg-card) · `sunken` (bg-deep)
- `bordered`: `true` (default) · `false`
- `interactive`: `true` (hover state)
- `padding`: `none` · `sm` · `md` (default) · `lg`

---

## Tipografia

### `<Heading>`
Cormorant Garamond com hierarquia tipográfica padronizada.

```tsx
<Heading level={1}>Criar personagem</Heading>
<Heading level={2}>Atributos</Heading>
<Heading level={3} italic accent>B1 — Aprovado</Heading>
<Heading level={4}>Sub-item</Heading>
```

Props:
- `level`: `1 | 2 | 3 | 4` — mapeia pra tag semântica + tamanho
- `as`: override semântico
- `italic`: aplica `font-style: italic`
- `accent`: cor `text-ice-bright` (padrão é `text-ink`)

### `<Eyebrow>`
Label CINZEL uppercase tracking-[0.3em]. Substitui o pretitulo/kicker repetido +50 vezes no app.

```tsx
<Eyebrow>Passo 1 de 6</Eyebrow>
<Eyebrow tone="success">grátis (origem)</Eyebrow>
<Eyebrow tone="deep" size="md">Sistema de design</Eyebrow>
```

Variants:
- `tone`: `default` · `faint` · `accent` · `strong` · `deep` · `success` · `warning` · `danger`
- `size`: `xs` (9px) · `sm` (10px, default) · `md` (11px)

### `<Text>`
Texto corrido (descrições, hints, help).

```tsx
<Text>Texto principal</Text>
<Text variant="muted">Auxiliar</Text>
<Text variant="help" size="xs">Dica pequena</Text>
<Text variant="mono">5 / 24 pontos</Text>
```

Variants:
- `variant`: `body` · `muted` · `help` · `mono` · `accent` · `strong`
- `size`: `xs` · `sm` (default) · `base` · `lg`
- `as`: `p` (default) · `span` · `div`

---

## Layout

### `<Stack>` (flex column)

```tsx
<Stack gap="md">
  <Heading level={2}>Titulo</Heading>
  <Text>Descricao</Text>
</Stack>
<Stack gap="sm" align="center">...</Stack>
```

Variants:
- `gap`: `none` · `xs` · `sm` · `md` (default) · `lg` · `xl` · `2xl`
- `align`: `start` · `center` · `end` · `stretch` (default)

### `<Cluster>` (flex row com wrap)

```tsx
<Cluster gap="sm" justify="between">
  <Eyebrow>Titulo</Eyebrow>
  <Badge>3 itens</Badge>
</Cluster>
```

Variants:
- `gap`: idem Stack
- `align`: `baseline` · `start` · `center` (default) · `end`
- `justify`: `start` · `center` · `between` · `end`
- `wrap`: `true` (default) · `false`

### `<Inline>` (linha sem quebra, baseline)

```tsx
<Inline gap="xs">
  <span>名</span>
  <Eyebrow>Identidade</Eyebrow>
</Inline>
```

---

## Formulários

### `<Field>` + `<Input>` / `<Select>` / `<Textarea>`
Wrapper canônico de campo. Erro inline embaixo (com `mt-0.5`, sem reserva).

```tsx
<Field label="Nome" htmlFor="char-name" required error={errors.name}>
  <Input id="char-name" value={...} onChange={...} />
</Field>

<Field label="NC" htmlFor="char-nc">
  <Select id="char-nc" value={...} onChange={...}>
    {options.map(...)}
  </Select>
</Field>
```

### `<Combobox>` (creatable)
Select + input livre — usuário digita pra criar valor custom.

```tsx
<Combobox
  options={[{ value: 'yuki', label: 'Yuki' }, ...]}
  value={value}
  onChange={setValue}
/>
```

Tipo do `value`:
```ts
type ComboboxValue =
  | { type: 'canonical'; value: string }
  | { type: 'custom'; value: string }
  | null;
```

### `<Checkbox>`

```tsx
<Checkbox checked={value} onChange={setValue} label="Apenas selecionadas" />
```

### `useFormErrors()` hook
Padrão "touched on blur + reveal on submit".

```tsx
const formErrors = useFormErrors();
const visible = formErrors.visible(allIssues);

<Field error={visible.name}>
  <Input onBlur={() => formErrors.markTouched('name')} ... />
</Field>

// no submit invalido:
formErrors.revealAll();
```

---

## Feedback

### `<Alert tone="...">`

```tsx
<Alert tone="danger">Soma das bases deve ser 12.</Alert>
<Alert tone="warning">Atributo abaixo do mínimo.</Alert>
<Alert tone="info">Hyouton concede +1 Fuuton.</Alert>
<Alert tone="success">Personagem criado.</Alert>
```

### `<Badge tone="..." variant="..." size="...">`
Chip pequeno pra metadados (grátis, treinada, origem, contadores).

```tsx
<Badge tone="success">grátis</Badge>
<Badge tone="warning">treinada</Badge>
<Badge tone="info" variant="solid">novo</Badge>
<Badge tone="neutral" variant="outline">12 itens</Badge>
```

Variants:
- `tone`: `neutral` · `info` · `success` · `warning` · `danger` · `accent`
- `variant`: `soft` (default) · `solid` · `outline` · `plain`
- `size`: `xs` · `sm` (default) · `md`

### `<Tooltip content="...">`
Tooltip dark+ice puro CSS no hover/focus do trigger.

```tsx
<Tooltip content="10 + 3·Vig + 5·NC">
  <span>VIT 55</span>
</Tooltip>
```

### `<EmptyState>`

```tsx
<EmptyState
  title="Nenhum personagem ainda"
  description="Comece criando o seu primeiro shinobi."
  action={<Button asChild><Link href="/new">Criar</Link></Button>}
/>
```

---

## Botões

### `<Button>`

```tsx
<Button>Próximo</Button>                  // variant="default"
<Button variant="outline">Voltar</Button> // ghost, sem borda
<Button variant="seal" size="sm">Apagar</Button>
<Button asChild><Link href="/...">Ir</Link></Button>
```

Variants:
- `variant`: `default` (ice-deep escuro) · `ghost` · `outline` (ghost, alias) · `seal` (vermelho selo)
- `size`: `sm` · `default` · `lg` · `icon`
- `asChild`: usa Slot (passa estilos pro filho — útil pra `<Link>`)

---

## Overlay

### `<Modal>` (centralizado)

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Apagar personagem?"
  description="Esta acao nao pode ser desfeita."
  size="sm"
  footer={
    <>
      <Button variant="ghost">Cancelar</Button>
      <Button>Apagar</Button>
    </>
  }
>
  <Text>Tem certeza?</Text>
</Modal>
```

Sizes: `sm` (max-md) · `md` (default, max-xl) · `lg` (max-3xl) · `xl` (max-5xl)

ESC fecha. Click no backdrop fecha (a menos que `dismissOnBackdrop={false}`). Scroll do body bloqueado.

### `<InfoDrawer>` (lateral)
Para descrições longas (perícia/poder/aptidão). Vive em `character/wizard/`, mas o padrão pode evoluir pra `ui/Drawer` genérico se aparecer outro caso.

---

## Quando criar um novo primitive

Crie um primitive em `ui/` quando:
1. O mesmo padrão de markup + classes aparece **≥ 3 vezes** no app
2. Você se pega copiando classes Tailwind entre arquivos
3. Você está prestes a digitar um seletor de cor ou tipografia "à mão"

Sempre que criar:
1. Adicionar showcase em `/components/<Nome>Playground.tsx`
2. Plugar na galeria via `page.tsx`
3. Atualizar este README com exemplo

---

## Outras pastas

```
src/components/
├── ui/                  ← PRIMITIVES (este README)
├── auth/                ← domínio: autenticação
└── character/
    ├── ficha/           ← componentes de leitura de ficha
    └── wizard/          ← componentes específicos do wizard
```

Domínio importa `ui/*`, nunca o contrário.
