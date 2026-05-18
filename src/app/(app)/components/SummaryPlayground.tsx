import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import {
  CharacterSummary,
  type SummaryAptitude,
  type SummaryPericia,
  type SummaryPower,
} from '@/components/character/ficha/CharacterSummary';

/**
 * Showcase do Summary (Step 6 do wizard). Mostra o componente compartilhavel
 * `CharacterSummary` com a fixture canonica da Satsuki (NC 6, Hyouton).
 */

const APTITUDES: ReadonlyArray<SummaryAptitude> = [
  {
    name: 'Acuidade',
    category: 'habilidade',
    description: 'Usa Destreza no lugar de Forca em CC com armas leves.',
    isFree: true,
  },
  {
    name: 'Especialista (Katana)',
    category: 'combate',
    description: '+1 precisao em CC ao empunhar katana. Daisho aplica em wakizashi.',
    isFree: true,
  },
  {
    name: 'Velocista',
    category: 'habilidade',
    description: 'Dobra Agilidade pra fins de deslocamento.',
    isFree: true,
  },
  {
    name: 'Ataque Poderoso',
    category: 'manobra',
    description: '-1 precisao, +1 dano em CC. Declarado antes do ataque.',
    isFree: false,
  },
  {
    name: 'Lutar às Cegas',
    category: 'combate',
    description: 'Ignora penalidades de visao reduzida em CC adjacente.',
    isFree: false,
  },
];

// Fixture Satsuki NC 6 (For 1, Des 6, Agi 6, Per 2, Int 1, Vig 5, Esp 3).
// Level = roundUp(attr/2) + pontos, EXCETO pericias `trained=true` sem pontos
// (retornam 0 = "sem treino" — UI renderiza apagadas).
const PERICIAS: ReadonlyArray<SummaryPericia> = [
  { name: 'Acrobacia', points: 3, level: 6 }, // agi 6 → 3 + 3
  { name: 'Arte', points: 0, level: 1 }, // int 1 → 1
  { name: 'Atletismo', points: 2, level: 3 }, // for 1 → 1 + 2
  { name: 'Ciencias Naturais', points: 0, level: 1 },
  { name: 'Concentracao', points: 0, level: 1 },
  { name: 'Cultura', points: 0, level: 1 },
  { name: 'Disfarce', points: 0, level: 1 },
  { name: 'Escapar', points: 0, level: 3 }, // des 6 → 3
  { name: 'Furtividade', points: 3, level: 6 }, // agi 6 → 3 + 3
  { name: 'Intuir Intencoes', points: 0, level: 1 }, // per 2 → 1
  { name: 'Lidar com Animais', points: 0, level: 0 }, // trained, sem pontos
  { name: 'Mecanismos', points: 0, level: 0 }, // trained, sem pontos
  { name: 'Medicina', points: 0, level: 0 }, // trained, sem pontos
  { name: 'Obter Informacao', points: 0, level: 0 }, // social (car), sem atributo
  { name: 'Ocultismo', points: 0, level: 0 }, // trained, sem pontos
  { name: 'Prestidigitacao', points: 3, level: 6 }, // des 6 → 3 + 3
  { name: 'Procurar', points: 2, level: 3 }, // per 2 → 1 + 2
  { name: 'Prontidao', points: 3, level: 4 }, // per 2 → 1 + 3
  { name: 'Rastrear', points: 0, level: 1 }, // per 2 → 1
  { name: 'Venefico', points: 0, level: 0 }, // doubleTrained, sem aptidao Quimico
];

const POWERS: ReadonlyArray<SummaryPower> = [
  {
    name: 'Hyouton',
    translation: 'Gelo',
    level: 3,
    freeLevel: 0,
    description:
      'Combina Vento e Agua pra criar gelo de dureza superior. Area de neve passiva.',
  },
  {
    name: 'Fuuton',
    translation: 'Vento',
    level: 1,
    freeLevel: 1,
    description: 'Manipulacao de vento. Cortes, sopros, redirecionamento de projeteis.',
  },
  {
    name: 'Suiton',
    translation: 'Agua',
    level: 2,
    freeLevel: 1,
    description: 'Manipulacao de agua. Canhao, neblina, prisao liquida.',
  },
];

export function SummaryPlayground() {
  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          R1 — Reference fiel
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        Aplicado no Step 6 (Summary) do wizard. Subtitle e Sociais omitidos por
        falta de campo na ficha.
      </Text>
      <CharacterSummary
        clanName="Yuki"
        villageName="Kiri"
        name="Satsuki Yuki"
        portraitUrl={null}
        kekkeiGenkaiName="Hyouton"
        age={14}
        gender={null}
        campaignLevel={6}
        attributes={{ for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 }}
        derived={{ cc: 12, cd: 9, esq: 9, lm: 3, vit: 55, chakra: 19 }}
        quote="Não confunda silêncio com perdão."
        aptitudes={APTITUDES}
        pericias={PERICIAS}
        powers={POWERS}
      />
    </Section>
  );
}
