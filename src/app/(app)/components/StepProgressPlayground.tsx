'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { StepProgress } from '@/components/character/wizard/StepProgress';

const STEPS = [
  { id: 'identity', label: 'Identidade', kanji: '名' },
  { id: 'attributes', label: 'Atributos', kanji: '性' },
  { id: 'pericias', label: 'Pericias', kanji: '技' },
  { id: 'powers', label: 'Poderes', kanji: '力' },
  { id: 'aptitudes', label: 'Aptidoes', kanji: '才' },
  { id: 'summary', label: 'Revisar', kanji: '検' },
] as const;

export function StepProgressPlayground() {
  const [current, setCurrent] = useState(2);
  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          Barra + kanji semantico por step
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        Aplicado no wizard via{' '}
        <code className="font-mono text-ice">&lt;StepProgress&gt;</code>. Clique
        nos labels embaixo pra navegar entre os steps.
      </Text>
      <div className="rounded border border-border bg-bg-deep px-6 py-6">
        <StepProgress steps={STEPS} currentIndex={current} onStepClick={setCurrent} />
      </div>
    </Section>
  );
}
