# 01 — Visão de Produto

## 🎯 O que é o Arcana Forge

**Arcana Forge** é uma plataforma web para criação, gestão e uso de fichas de personagem para o RPG **Shinobi no Sho 4.1b** — um sistema brasileiro inspirado no universo Naruto. O produto une três frentes que normalmente vivem separadas:

1. **Ficha automatizada**: motor de regras que valida pontos, calcula derivados, mostra pré-requisitos e impede inconsistências matemáticas.
2. **Visual cinematográfico**: cada ficha é uma página apresentável, com imagens próprias do personagem, paleta dark+ice, e identidade que motiva o jogador a *querer* mostrar o personagem.
3. **Uso em mesa**: durante o jogo, a ficha não é um documento — é uma ferramenta interativa. Botões para usar jutsu (deduz chakra), calcular dano (mostra tabela por grau), tomar dano (deduz vitalidade), diário (registra a sessão).

O nome **Arcana Forge** evoca a ideia de uma forja antiga onde cada personagem é uma lâmina sendo forjada — combina com o tema visual (lâminas, gelo, antiguidade) e funciona em português e inglês.

---

## 👥 Personas

### P1 — Jogador veterano ("o Caçador de Detalhes")

- **Quem:** joga RPG há anos, criou dezenas de personagens, ama narrativa.
- **Dor atual:** planilhas no Google Sheets perdem identidade visual; documentos no Notion são bonitos mas não validam regras; sistemas tipo Roll20 são genéricos demais e feios.
- **O que quer:** uma ficha que pareça digna do personagem que ele criou, mas que também o impeça de gastar pontos errado.
- **Métrica de sucesso:** consegue mostrar a ficha do PJ no Discord/Twitter sem precisar exportar/editar.

### P2 — Jogador novato ("o Iniciante")

- **Quem:** está jogando SnS pela primeira vez, confuso com a ficha de papel.
- **Dor atual:** tabela de pontos por nível é complicada; pré-requisitos de aptidões são opacos; não sabe quando subir um atributo é melhor que comprar um poder.
- **O que quer:** algo que segure a mão dele e explique cada decisão.
- **Métrica de sucesso:** cria a primeira ficha sem precisar de ajuda do mestre.

### P3 — Mestre ("o Maestro")

- **Quem:** mestra campanhas de SnS, controla até 6 jogadores + NPCs.
- **Dor atual:** acompanhar 6 fichas em papel/PDF é caótico; precisa pedir status de chakra/vida toda hora; perde tempo gerenciando inimigos.
- **O que quer:** ver as fichas dos PJs em tempo real, controlar iniciativa, criar NPCs/inimigos rapidamente. *(Fora do MVP — vai para v2)*
- **Métrica de sucesso:** sessão flui sem interrupções administrativas.

---

## 🌍 Casos de uso principais (MVP)

### CU-01 — Criar uma nova ficha

> *"Sou um jogador novo, quero criar minha primeira kunoichi do clã Yuki. Quero entender o que estou gastando e ter a ficha bonita no final."*

**Fluxo:**
1. Login com Google.
2. Dashboard com botão "Novo Personagem".
3. Wizard de criação rápida: nome, idade, gênero, clã, vila, NC inicial.
4. Sistema calcula automaticamente quantos pontos o personagem tem disponíveis.
5. Editor da ficha já abre com valores zerados/mínimos. Usuário vai distribuindo.
6. Indicador "pontos restantes" sempre visível.
7. Validações em tempo real (não pode passar do limite, não pode ir abaixo do mínimo).
8. Ao fechar a ficha, está pronta para usar.

### CU-02 — Editar ficha existente

> *"Já tenho meu personagem. Subi de nível na última sessão e quero distribuir os novos pontos."*

**Fluxo:**
1. Dashboard → clica no personagem → abre ficha.
2. Botão "Subir NC" no canto da ficha.
3. Sistema mostra: "NC 6 → NC 7: você ganhou +6 atributos, +4 perícias, +2 poder, +2 sociais. Aplicar?"
4. Modo edição ativado. Pontos restantes aparecem em badge.
5. Avisos: "For 1 → mínimo subiu para 2, gaste 1 ponto aqui antes de continuar."
6. Confirma → salva snapshot da versão anterior, NC atual fica como novo estado.

### CU-03 — Usar a ficha em sessão

> *"Estou jogando. Quero usar o Gekkōken e ver quanto dano sai."*

**Fluxo:**
1. Abro a ficha do meu PJ no celular/laptop.
2. Clico no card do jutsu Gekkōken.
3. Modal abre: mostra info do jutsu, custo de chakra, calculadora de dano por grau.
4. Calculadora mostra: DDA, 2/ESP, Nível, Outro, **Total**, depois colunas de grau (4-8, 9-11, 12-14, 15-16).
5. Botão "Usar Jutsu (3 Chk)". Confirmo.
6. Chakra atual cai de 19 para 16. Indicador da ficha atualiza.
7. Mestre informa que tomei 8 de dano. Clico em "Tomar Dano" na barra de Vitalidade, digito 8.
8. Vitalidade cai de 55 para 47.

### CU-04 — Registrar entrada de diário

> *"Acabou a sessão. Quero registrar o que aconteceu sob a perspectiva da Satsuki."*

**Fluxo:**
1. Na ficha, vou na aba "Diário".
2. Botão "Nova Entrada".
3. Título: "Confronto com Sotan". Data (in-game ou real). Tag opcional: "Ato 2 - Porto da Lua".
4. Corpo em markdown (futuro: rich text).
5. Salvo. Aparece na timeline.

### CU-05 — Compartilhar ficha

> *"Quero mandar minha ficha pro mestre/grupo verem."*

**Fluxo:**
1. Botão "Compartilhar" no topo da ficha.
2. Opção "Link público read-only" → gera URL.
3. Visitante abre a URL sem login, vê a ficha completa em modo leitura.
4. Visitante pode expandir seções colapsadas localmente (não afeta o estado salvo do dono).

### CU-06 — Customizar visual

> *"Quero subir imagens do meu personagem em diferentes poses para preencher os slots da ficha."*

**Fluxo:**
1. Na ficha, modo edição → seção "Galeria".
2. Upload de múltiplas imagens.
3. Cada slot da ficha (hero, header, banner, jutsus 1-4, combate, inventário, footer) tem dropdown para escolher qual imagem usar.
4. Preview em tempo real.

### CU-07 — Reorganizar layout

> *"Não uso muito a seção de Sociais. Quero esconder."*

**Fluxo:**
1. Cada seção da ficha tem um chevron `▾` para minimizar.
2. Seção minimizada vira: `Sociais (2) ▸` — mostra contador.
3. Estado salvo no banco, por personagem.
4. Default: tudo expandido para personagem novo.

---

## 📐 Escopo

### ✅ Dentro do MVP (Fase 1.0)

**Identidade & Acesso**
- Login com Google (Firebase Auth)
- Dashboard de personagens do usuário
- Perfil básico do usuário (nome, email, avatar Google)

**Fichas de Personagem**
- Criação via wizard rápido + editor livre
- Motor de regras SnS completo (validação + cálculo)
- Todos os atributos, perícias, energias, habilidades, aptidões, poderes, jutsus, equipamentos
- Calculadora de dano por jutsu/arma (modal igual à referência)
- Botões "Usar Jutsu" (deduz chakra) e "Tomar Dano" (deduz vit)
- Subir NC com validação dos pontos ganhos e mínimos atualizados
- Inventário simples (lista de itens + quantidades + Ryos)

**Catálogos**
- Atributos, habilidades, perícias hardcoded
- Aptidões, poderes, efeitos, kekkei genkais, clãs, vilas, equipamentos seedados do livro
- Jutsus customizados criados pelo usuário (referenciam poder + efeito existentes)

**Visual**
- Tema dark+ice como identidade do produto inteiro
- Upload de imagens próprias do personagem
- Slots da ficha customizáveis (qual imagem em qual posição)
- Layout responsivo (desktop + mobile)
- Seções colapsáveis (com sub-collapse em Perícias/Inventário)
- Estado de layout persistido por personagem

**Diário**
- Timeline de entradas por personagem
- CRUD de entradas (título + corpo markdown + data + tag opcional)
- Aba/seção dedicada na página da ficha
- Default colapsado

**Compartilhamento**
- Link público read-only de cada ficha
- Visitantes podem expandir seções localmente
- Ficha pública respeita configuração de layout do dono

**Comunitário (mínimo)**
- Perfil público do usuário (lista de personagens públicos)
- Sem busca/descoberta ainda — só perfil-direto

---

### 🔮 Fora do MVP (v2+)

**Modo Mestre (v2)**
- Criar grupos/mesas
- Mestre vê fichas dos jogadores (read-only ou propor edição)
- Sistema de iniciativa em combate
- Criação rápida de inimigos/NPCs
- Tracker de vida/chakra dos NPCs

**Comunitário avançado (v2)**
- Busca de personagens públicos
- Filtros (por clã, vila, NC)
- Sistema de likes/favoritos
- Discovery na home

**Funcionalidades avançadas de ficha (v2)**
- Snapshots de versão (histórico NC 1 → NC 2 → ...)
- Editor rich text para diário (imagens, embeds)
- Comentários do mestre nas entradas
- Compartilhamento de entrada específica
- Exportar diário em PDF
- Exportar ficha em PDF

**Temas múltiplos (v2)**
- Variações temáticas por clã/elemento (Katon = quente, Doton = terroso, etc.)
- Editor de tema customizado

**Inventário avançado (v2)**
- Transações de Ryos (registro de gastos/ganhos)
- Categorização avançada
- Itens com propriedades (durabilidade, encantamentos)

**Outros sistemas RPG (v3+)**
- Suporte a outros sistemas (D&D 5e, Tormenta, etc.)
- Cada sistema é um motor de regras separado

---

## 🚧 Não-objetivos

Coisas que **não estão na visão do produto**, agora ou no futuro:

- **Não somos um VTT (Virtual Tabletop).** Não vai ter mapa, tokens, grid, fog of war. Foco é a ficha como ferramenta.
- **Não somos uma rede social.** Sem feed, timeline pública, comentários públicos. Compartilhamento é via link direto.
- **Não rolamos dados.** A premissa é que o dado físico cai na mesa e o app calcula com o resultado em mente (calculadora estática mostra todas as faixas).
- **Não somos uma loja.** Sem marketplace de fichas, templates pagos, etc.
- **Não somos um gerador de personagem aleatório.** Cada PJ é criado intencionalmente.

---

## 📊 Métricas de sucesso

Para o MVP, sucesso significa:

1. **Adoção pessoal:** o autor e seu grupo de jogo migram do papel/planilha para o Arcana Forge dentro de 1 mês após o lançamento.
2. **Validação técnica:** uma ficha completa de NC 12 (Jounin) cabe no sistema sem hacks — todos os números batem com o livro.
3. **Performance:** abrir uma ficha leva < 1.5s em conexão 4G.
4. **Estabilidade:** zero perda de dados em 30 dias de uso real.
5. **UX:** novato consegue criar primeira ficha em < 15 minutos sem ajuda.

Métricas comunitárias (usuários ativos, etc.) ficam para depois — primeiro o produto precisa ser bom pra quem usa, depois pensamos em crescer.

---

## 🎨 Princípios de design

1. **A ficha é o produto.** Tudo gira em torno dela. Resto é meio.
2. **Cálculos não mentem.** Se você editou Des de 6 pra 7, CC sobe pra 13 automaticamente. Sempre.
3. **O livro é a fonte de verdade.** Regra-casa existe, mas é exceção marcada explicitamente.
4. **Beleza não é vaidade.** Uma ficha bonita é uma ficha que o jogador *quer abrir*. Isso aumenta engajamento de campanha.
5. **Mobile importa.** Metade do uso vai ser no celular durante a sessão. Tudo precisa funcionar bem em tela vertical.
6. **Privacy by default.** Tudo do usuário é privado até ele explicitamente compartilhar.
7. **Open source.** Código aberto. Comunidade pode contribuir, forks são bem-vindos.

---

## 🔓 Open Source

O projeto será **open source desde o dia 1**, licença **MIT** (a confirmar — pode ser AGPL se quiser proteção contra SaaS competitivos baseados no código).

Implicações:
- Repositório público no GitHub
- README amigável para contribuidores
- CONTRIBUTING.md com guidelines
- Issues abertas para discussão de features
- PRs aceitos da comunidade

> 🔶 **ABERTO:** licença final (MIT vs AGPL) — decidir antes do primeiro push público.

---

*Próximo documento: `02-ARCHITECTURE.md` — stack técnica e estrutura.*
