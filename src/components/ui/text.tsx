import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Texto corrido (parágrafos, hints, descricoes). Substitui o
 * `text-sm text-ink-muted` e variacoes que aparecem 30+ vezes no app.
 *
 *   <Text>Lorem ipsum.</Text>                       // body padrao
 *   <Text variant="muted">Texto auxiliar.</Text>
 *   <Text variant="help" size="sm">Dica curta</Text>
 *   <Text variant="mono">5 / 24 pontos</Text>
 *   <Text variant="accent">Texto em ice-bright</Text>
 */

const textVariants = cva('', {
  variants: {
    variant: {
      /** Texto principal (ink). */
      body: 'text-ink',
      /** Texto secundario (ink-muted) — descricoes, hints, help. */
      muted: 'text-ink-muted',
      /** Texto auxiliar bem apagado (ink-faint) — info quase decorativa. */
      help: 'text-ink-faint',
      /** Mono — pra numeros, codigos, formulas. */
      mono: 'font-mono text-ink tabular-nums',
      /** Destacado em ice. */
      accent: 'text-ice',
      /** Mais destacado (ice-bright). */
      strong: 'text-ice-bright',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: { variant: 'body', size: 'sm' },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div';
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant, size, as: Comp = 'p', className, ...props }, ref) => (
    <Comp
      ref={ref as never}
      className={cn(textVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Text.displayName = 'Text';
