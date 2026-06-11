'use client';

import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { InfoButton } from '@/components/character/wizard/InfoButton';

export function InfoButtonPlayground() {
  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          i filled translucido
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        Circulo bg-ice/15 + i ice-bright. Sempre visivel sem ser intrusivo.
        Aplicado em todo botao de info do app via{' '}
        <code className="font-mono text-ice">&lt;InfoButton&gt;</code>.
      </Text>
      <Stack gap="md" className="rounded border border-border bg-bg-deep p-6">
        <div className="flex flex-wrap items-baseline gap-2">
          <Text>Medicina</Text>
          <Eyebrow tone="deep" size="xs">
            INT
          </Eyebrow>
          <Eyebrow tone="warning" size="xs">
            treinada
          </Eyebrow>
          <InfoButton ariaLabel="ver descricao de Medicina" onClick={() => {}} />
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <Text size="base">Iryou Ninjutsu</Text>
          <Text variant="accent" size="xs" as="span" className="italic">
            Ninjutsu Medico
          </Text>
          <Eyebrow tone="deep" size="xs">
            COMUM
          </Eyebrow>
          <InfoButton ariaLabel="ver descricao de Iryou Ninjutsu" onClick={() => {}} />
        </div>
      </Stack>
    </Section>
  );
}
