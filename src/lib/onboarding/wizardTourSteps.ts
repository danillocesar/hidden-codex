import type { WizardStepId } from '@/app/(app)/characters/new/wizardValidation';

/**
 * Passos do tour guiado de onboarding do wizard de criacao de personagem.
 *
 * Cada aba do wizard tem seu proprio sub-tour, ancorado aos elementos daquela
 * aba via seletor CSS (`#id` nativo ou `[data-tour="chave"]`). O hook
 * `useWizardTour` dispara o sub-tour da aba atual e filtra passos cujo elemento
 * nao esta no DOM (ex.: secoes opcionais ou condicionais).
 *
 * Texto em pt-BR — base nas specs `04-RULES-ENGINE.md` e `05-UI-SPEC.md`.
 * TODO(human-review): copy redigido pela IA; revisar tom e exatidao de regras.
 */

export type TourStep = {
  /** Seletor CSS do elemento a destacar. */
  element: string;
  title: string;
  description: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
};

export const WIZARD_TOUR_STEPS: Record<WizardStepId, TourStep[]> = {
  identity: [
    {
      element: '[data-tour="progress"]',
      title: 'Bem-vindo à forja',
      description:
        'Criar um personagem tem 8 passos. Esta barra mostra onde você está e marca o que já foi concluído — clique num passo já visitado para voltar a qualquer momento.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '#char-name',
      title: 'Nome do personagem',
      description:
        'Único campo obrigatório aqui. O resto (idade, gênero, NC, vila, clã) pode ficar para depois — você ajusta tudo na ficha quando quiser.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '#char-nc',
      title: 'NC — Nível de Campanha',
      description:
        'O valor mais importante da ficha: define quantos pontos você terá para atributos, perícias e poderes, além dos limites máximos de cada um. Combine com o mestre antes de escolher.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '[data-tour="identity-portrait"]',
      title: 'Retrato',
      description:
        'Opcional. Envie uma imagem (até 5 MB) para ilustrar o personagem. Dá para trocar depois na ficha.',
      side: 'right',
      align: 'start',
    },
    {
      element: '[data-tour="identity-origin"]',
      title: 'Vila e Clã',
      description:
        'Escolha uma opção da lista OU digite um nome livre e pressione Enter para criar o seu. Clã pode conceder benefícios (e até um Hijutsu) automaticamente.',
      side: 'top',
      align: 'start',
    },
    {
      element: '#char-kg',
      title: 'Hijutsu',
      description:
        'Linhagem sanguínea ou técnica secreta de clã (Hyouton, Sharingan, Jinchuuriki…). Algumas concedem poderes ou níveis grátis nos passos seguintes. Deixe em "Nenhum" se o personagem não tiver.',
      side: 'top',
      align: 'start',
    },
    {
      element: '[data-tour="nav"]',
      title: 'Navegação',
      description:
        '"Próximo" avança quando o passo está válido; "Voltar" retorna sem perder nada. O tour da próxima aba aparece sozinho ao avançar.',
      side: 'top',
      align: 'end',
    },
  ],
  attributes: [
    {
      element: '[data-tour="attr-budget"]',
      title: 'Orçamento de pontos',
      description:
        'Seu NC define quantos pontos você tem para distribuir entre os 7 atributos. Este contador mostra gastos / total — não dá para passar do limite.',
      side: 'left',
      align: 'start',
    },
    {
      element: '[data-tour="attr-grid"]',
      title: 'Os 7 atributos',
      description:
        'Use os botões − / + de cada card. O mínimo do NC já vem preenchido de graça; você só gasta pontos para subir acima dele.',
      side: 'top',
      align: 'center',
    },
    {
      element: '[data-tour="attr-bases"]',
      title: 'Bases de combate',
      description:
        'Todas começam em 3. Você pode remanejar até 2 pontos entre CC, CD, ESQ e LM para moldar o estilo de luta.',
      side: 'top',
      align: 'center',
    },
    {
      element: '[data-tour="attr-preview"]',
      title: 'Prévia derivada',
      description:
        'CC, CD, Esquiva, Ler Movimento, Vitalidade e Chakra são calculados automaticamente a partir dos atributos. Passe o mouse em cada um para ver a fórmula.',
      side: 'top',
      align: 'center',
    },
  ],
  pericias: [
    {
      element: '[data-tour="pericia-budget"]',
      title: 'Pontos de perícia',
      description:
        'O NC também define um orçamento de perícias e um teto de pontos por perícia. Este contador acompanha o quanto você já investiu.',
      side: 'left',
      align: 'start',
    },
    {
      element: '[data-tour="pericia-table"]',
      title: 'Tabela de perícias',
      description:
        'Cada linha mostra a fórmula: Total = ⌈atributo ÷ 2⌉ + pontos investidos. Use as setas na coluna "Pontos" para treinar. O "?" abre a descrição completa.',
      side: 'top',
      align: 'center',
    },
  ],
  aptitudes: [
    {
      element: '[data-tour="apt-free-rule"]',
      title: 'Aptidões',
      description:
        'Aptidões são habilidades especiais compradas com pontos de poder. Na criação, as 3 primeiras são grátis — aproveite. Aptidões da sua origem (clã/KG) já vêm marcadas.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '[data-tour="apt-picker"]',
      title: 'Escolher aptidões',
      description:
        'Filtre por categoria ou busque pelo nome. Cada card mostra os pré-requisitos em tempo real (verde = cumprido, vermelho = falta). Cards bloqueados não podem ser escolhidos ainda.',
      side: 'top',
      align: 'center',
    },
    {
      element: '[data-tour="apt-budget"]',
      title: 'Orçamento compartilhado',
      description:
        'Atenção: aptidões e poderes dividem o MESMO orçamento de pontos de poder. Gastar muito aqui deixa menos para os poderes — e vice-versa.',
      side: 'left',
      align: 'start',
    },
  ],
  powers: [
    {
      element: '#power-search',
      title: 'Buscar poderes',
      description:
        'A lista mostra só os poderes liberados pela sua origem (clã / Hijutsu) mais os comuns. Busque por nome ou código para filtrar rápido.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '#power-category',
      title: 'Filtrar por categoria',
      description:
        'Separe entre Comum, Restrito e Hijutsu. Útil quando há muitos poderes disponíveis.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '[data-tour="power-list"]',
      title: 'Selecionar e nivelar',
      description:
        'Clique no card para escolher o poder; um seletor de nível aparece. Poderes "grátis" da origem já vêm marcados em verde. O nível máximo por poder depende do NC.',
      side: 'top',
      align: 'center',
    },
    {
      element: '[data-tour="power-budget"]',
      title: 'Mesmo orçamento das aptidões',
      description:
        'Este contador soma poderes + aptidões. Se estourar, volte e reequilibre — você pode ir e voltar livremente entre Aptidões, Poderes e Efeitos.',
      side: 'left',
      align: 'start',
    },
  ],
  effects: [
    {
      element: '[data-tour="effects-intro"]',
      title: 'Efeitos (jutsus)',
      description:
        'Cada nível de um poder concede 1 slot de efeito. Aqui você escolhe quais técnicas daquele poder o personagem domina.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '[data-tour="effects-slots"]',
      title: 'Preencha todos os slots',
      description:
        'Este contador mostra slots preenchidos / total do poder. É obrigatório preencher todos (verde) para avançar. O "?" em cada efeito abre a descrição.',
      side: 'bottom',
      align: 'start',
    },
  ],
  inventory: [
    {
      element: '[data-tour="inventory-ryos"]',
      title: 'Ryos — dinheiro inicial',
      description:
        'O campo já vem com o valor inicial do seu posto shinobi (RAW do livro): Genin 100, Chuunin 1.000, Jounin 13.000 e por aí. Ajuste se combinou outra quantia com o mestre — dá pra editar o saldo depois na ficha.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '#equip-search',
      title: 'Inventário (opcional)',
      description:
        'Equipar itens é opcional — você pode criar o personagem sem nada e adicionar depois na ficha. Busque armas, armaduras e consumíveis do catálogo.',
      side: 'bottom',
      align: 'start',
    },
    {
      element: '[data-tour="inventory-picker"]',
      title: 'Adicionar itens',
      description:
        'Clique num item para adicioná-lo e use o contador para ajustar a quantidade. O que está equipado você define depois, na ficha.',
      side: 'top',
      align: 'center',
    },
  ],
  summary: [
    {
      element: '[data-tour="summary-review"]',
      title: 'Revisão final',
      description:
        'Confira tudo: atributos, perícias, aptidões, poderes, efeitos e inventário consolidados. Algo errado? Volte pelo passo correspondente na barra de progresso.',
      side: 'top',
      align: 'center',
    },
    {
      element: '[data-tour="nav"]',
      title: 'Criar personagem',
      description:
        'Quando estiver satisfeito, clique em "Criar personagem". Você será levado direto para a ficha — e poderá ajustar qualquer coisa por lá.',
      side: 'top',
      align: 'end',
    },
  ],
};
