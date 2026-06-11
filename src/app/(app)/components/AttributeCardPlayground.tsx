'use client';

import { useState } from 'react';
import { ATTRIBUTES } from '@/domain/catalog/attributes';
import { type AttributeKey, type Attributes } from '@/domain/types';
import { AttributeCard } from '@/components/character/wizard/AttributeCard';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';

const ATTR_MIN = 1;
const ATTR_MAX = 6;

const SATSUKI_NC6: Attributes = {
  for: 1,
  des: 6,
  agi: 6,
  per: 2,
  int: 1,
  vig: 5,
  esp: 3,
};

export function AttributeCardPlayground() {
  const [attrs, setAttrs] = useState<Attributes>(SATSUKI_NC6);
  const set = (key: AttributeKey, value: number) =>
    setAttrs((prev) => ({ ...prev, [key]: value }));

  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          Card vertical cinematografico
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        Label CINZEL no topo · valor GIGANTE (Cormorant 48px) · kanji embaixo.
        Aplicado em Step 2 (atributos + bases) via{' '}
        <code className="font-mono text-ice">&lt;AttributeCard&gt;</code>.
      </Text>
      <div className="rounded border border-border bg-bg-deep p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {ATTRIBUTES.map((attr) => (
            <AttributeCard
              key={attr.code}
              label={attr.abbreviation}
              name={attr.name}
              kanji={attr.kanji}
              value={attrs[attr.code]}
              min={ATTR_MIN}
              max={ATTR_MAX}
              ariaLabel={attr.name}
              onChange={(v) => set(attr.code, v)}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
