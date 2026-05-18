'use client';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';

export function AlertPlayground() {
  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          Alerta padrao
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        bg-tone/35 + texto e icone na cor do tom. Aplicado em todo alerta do app
        via <code className="font-mono text-ice">&lt;Alert tone=&quot;…&quot;&gt;</code>.
      </Text>
      <Stack gap="md" className="rounded border border-border bg-bg-deep p-6">
        <Alert tone="danger">Soma das bases de combate deve ser 12 (atual: 11).</Alert>
        <Alert tone="warning">
          Atributo For abaixo do minimo recomendado pra ataque corporal.
        </Alert>
        <Alert tone="info">Hyouton concede +1 nivel gratis em Fuuton e Suiton.</Alert>
        <Alert tone="success">Personagem criado com sucesso.</Alert>
      </Stack>
    </Section>
  );
}
