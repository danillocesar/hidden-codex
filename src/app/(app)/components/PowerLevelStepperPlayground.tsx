'use client';

import { useState } from 'react';
import { PowerLevelStepper } from '@/components/character/wizard/PowerLevelStepper';
import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';

const POWER_LIMIT = 3;
const FREE = 1;

export function PowerLevelStepperPlayground() {
  const [value, setValue] = useState(2);
  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          Estilo AttributeCard (− valor 36px +)
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        Mesmo padrao da fase 2 (atributos). Aplicado no Step 4 via{' '}
        <code className="font-mono text-ice">&lt;PowerLevelStepper&gt;</code>.
      </Text>
      <div className="rounded border border-border bg-bg-deep p-6">
        <div className="flex items-start justify-between gap-3 rounded border border-ice-deep bg-bg-card p-3">
          <span
            aria-hidden
            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-ice bg-ice/20 text-ice-bright"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              className="h-3 w-3"
            >
              <path
                d="M3 8.5l3 3 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <Text size="base">Hyouton</Text>
              <Text variant="accent" size="xs" as="span" className="italic">
                Elemento Gelo
              </Text>
              <Eyebrow tone="deep" size="xs">
                KEKKEI GENKAI · gelo
              </Eyebrow>
              <Eyebrow tone="success" size="xs">
                gratis
              </Eyebrow>
            </div>
            <Text variant="muted" className="mt-1">
              Combina Vento e Agua pra criar gelo de dureza superior, area de neve.
            </Text>
          </div>
          <PowerLevelStepper
            ariaLabel="Hyouton nivel"
            value={value}
            min={FREE}
            max={POWER_LIMIT}
            onChange={setValue}
          />
        </div>
      </div>
    </Section>
  );
}
