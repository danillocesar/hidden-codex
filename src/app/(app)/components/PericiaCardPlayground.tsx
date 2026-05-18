'use client';

import { useState } from 'react';
import {
  PericiaTable,
  type PericiaTableItem,
} from '@/components/character/wizard/PericiaTable';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import type { Attributes } from '@/domain/types';

const ATTRS: Attributes = { for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 };
const MAX_POINTS = 3;

const SAMPLE: ReadonlyArray<PericiaTableItem> = [
  {
    code: 'acrobacia',
    name: 'Acrobacia',
    attribute: 'agi',
    trained: false,
    doubleTrained: false,
    shortDescription: 'Cair sem se machucar, andar na corda bamba, cambalhotas.',
    description:
      'Acrobacia mede sua capacidade de andar na corda bamba, cair sem se machucar de grandes alturas, fazer cambalhotas e equilibrar-se em superficies estreitas ou inclinadas. Sofre penalidade quando usado com armadura pesada.',
  },
  {
    code: 'atletismo',
    name: 'Atletismo',
    attribute: 'for',
    trained: false,
    doubleTrained: false,
    shortDescription: 'Correr, escalar, nadar, saltar.',
    description:
      'Atletismo cobre facanhas fisicas brutas dependentes de Forca: correr longas distancias, escalar paredes, nadar contra a correnteza, saltar fossos. Penalidade com armadura pesada.',
  },
  {
    code: 'furtividade',
    name: 'Furtividade',
    attribute: 'agi',
    trained: false,
    doubleTrained: false,
    shortDescription: 'Esconder-se, mover sem barulho, sumir na multidao.',
    description:
      'Furtividade permite mover-se sem ser percebido, esconder-se em sombras, sumir em multidoes, abafar passos. Resistida por testes de Prontidao, Procurar ou Rastrear do oponente.',
  },
  {
    code: 'prestidigitacao',
    name: 'Prestidigitacao',
    attribute: 'des',
    trained: false,
    doubleTrained: false,
    shortDescription: 'Truques de mao, surrupiar objetos, abrir fechaduras.',
    description:
      'Prestidigitacao envolve truques de mao, surrupiar objetos sem ser notado, abrir fechaduras com gazua, desarmar armadilhas mecanicas, prender bombas e tarjas explosivas.',
  },
  {
    code: 'venefico',
    name: 'Venefico',
    attribute: 'int',
    trained: true,
    doubleTrained: true,
    shortDescription: 'Identificar, produzir e aplicar venenos.',
    description:
      'Venefico cobre identificar venenos por cheiro/aparencia, produzir doses a partir de ingredientes brutos, aplicar em armas sem se contaminar, calcular dose letal. RESTRITA: requer aptidao Quimico para ser comprada.',
  },
];

export function PericiaCardPlayground() {
  const [points, setPoints] = useState<Record<string, number>>({
    acrobacia: 3,
    atletismo: 0,
    furtividade: 2,
    prestidigitacao: 3,
    venefico: 0,
  });

  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          Tabela editorial com formula
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        TOTAL = ½ ATTR + PONTOS, alinhado por colunas. Tag do atributo sem numero
        ao lado do nome; i abre drawer com descricao completa. Aplicado no Step 3
        via <code className="font-mono text-ice">&lt;PericiaTable&gt;</code>.
      </Text>
      <div className="rounded border border-border bg-bg-deep px-6 py-6">
        <PericiaTable
          pericias={SAMPLE}
          attributes={ATTRS}
          points={points}
          maxPerPericia={MAX_POINTS}
          remainingBudget={
            16 - Object.values(points).reduce((acc, v) => acc + v, 0)
          }
          onChange={(code, n) => setPoints((p) => ({ ...p, [code]: n }))}
        />
      </div>
    </Section>
  );
}
