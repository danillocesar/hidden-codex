'use client';

import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';

/**
 * Galeria do botao primario + secundario aprovados (`<Button variant="default">`
 * e `<Button variant="outline">`).
 */
export function ButtonPlayground() {
  return (
    <Section tone="accent">
      <Stack gap="sm" className="mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level={3} italic accent>
          A5 — Ice escuro (sobrio)
        </Heading>
        <Badge tone="success">aprovado</Badge>
      </Stack>
      <Text variant="muted" className="mb-6">
        Aprovado. Primario: fundo ice-deep/30 + borda ice-deep + texto ice-bright.
        Secundario: ghost com seta.
      </Text>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded border border-border bg-bg-deep px-6 py-8">
        <BackGhost />
        <NextDark />
      </div>
    </Section>
  );
}

const baseDisplay =
  'font-display uppercase tracking-[0.3em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ice disabled:pointer-events-none disabled:opacity-50';

function BackGhost() {
  return (
    <button
      type="button"
      className={cn(
        baseDisplay,
        'inline-flex h-11 items-center gap-2 px-4 text-xs text-ink-muted hover:text-ice',
      )}
    >
      <ArrowLeft />
      Voltar
    </button>
  );
}

function NextDark() {
  return (
    <button
      type="button"
      className={cn(
        baseDisplay,
        'h-11 px-8 py-3 text-xs',
        'border border-ice-deep bg-ice-deep/30 text-ice-bright hover:border-ice hover:bg-ice-deep/45',
      )}
    >
      Proximo
    </button>
  );
}

function ArrowLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4L6 8l4 4" />
    </svg>
  );
}
