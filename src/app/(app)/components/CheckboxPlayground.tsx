'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';

export function CheckboxPlayground() {
  const [onlyMet, setOnlyMet] = useState(true);
  const [onlySelected, setOnlySelected] = useState(false);
  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          Checkbox custom (mix C1 + nativo)
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        Quadrado com borda quando vazio · solido em ice + check escuro quando marcado.
        Aplicado em todos os filtros do app via{' '}
        <code className="font-mono text-ice">&lt;Checkbox&gt;</code>.
      </Text>
      <div className="flex flex-wrap gap-4 rounded border border-border bg-bg-deep p-6">
        <Checkbox
          checked={onlyMet}
          onChange={setOnlyMet}
          label="Apenas com pre-reqs cumpridos"
        />
        <Checkbox
          checked={onlySelected}
          onChange={setOnlySelected}
          label="Apenas selecionadas (3)"
        />
      </div>
    </Section>
  );
}
