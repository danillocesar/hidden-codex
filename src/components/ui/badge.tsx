import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Chip pequeno pra metadados informativos: "GRATIS", "TREINADA", "ORIGEM",
 * "RESTRITA", contadores ("12 itens"), etc.
 *
 * Diferenca pra `<Eyebrow>`: Badge tem CONTAINER visivel (background/borda),
 * Eyebrow e so texto formatado. Use Badge quando quiser destacar como "chip"
 * visualmente isolado.
 *
 *   <Badge tone="success">grátis</Badge>
 *   <Badge tone="warning">treinada</Badge>
 *   <Badge tone="info" variant="solid">novo</Badge>
 *   <Badge tone="neutral" variant="outline">12 itens</Badge>
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-display uppercase tracking-[0.3em] leading-none whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: '',
        info: '',
        success: '',
        warning: '',
        danger: '',
        accent: '',
      },
      variant: {
        /** Soft — fundo tone/15 + texto na cor. Padrao. */
        soft: '',
        /** Solid — fundo tone-bright + texto escuro. Mais peso. */
        solid: '',
        /** Outline — so borda + texto. Sem fundo. */
        outline: 'border',
        /** Plain — so texto colorido (sem fundo nem borda). */
        plain: '',
      },
      size: {
        xs: 'rounded px-1.5 py-0.5 text-[9px]',
        sm: 'rounded px-2 py-0.5 text-[10px]',
        md: 'rounded px-2.5 py-1 text-[11px]',
      },
    },
    compoundVariants: [
      // soft (default)
      { variant: 'soft', tone: 'neutral', class: 'bg-bg-card-2 text-ink' },
      { variant: 'soft', tone: 'info', class: 'bg-ice/15 text-ice' },
      { variant: 'soft', tone: 'success', class: 'bg-success/15 text-success' },
      { variant: 'soft', tone: 'warning', class: 'bg-warning/15 text-warning' },
      { variant: 'soft', tone: 'danger', class: 'bg-danger/15 text-danger' },
      { variant: 'soft', tone: 'accent', class: 'bg-ice/15 text-ice-bright' },
      // solid
      { variant: 'solid', tone: 'neutral', class: 'bg-ink text-bg-deep' },
      { variant: 'solid', tone: 'info', class: 'bg-ice text-bg-deep' },
      { variant: 'solid', tone: 'success', class: 'bg-success text-bg-deep' },
      { variant: 'solid', tone: 'warning', class: 'bg-warning text-bg-deep' },
      { variant: 'solid', tone: 'danger', class: 'bg-danger text-ink' },
      { variant: 'solid', tone: 'accent', class: 'bg-ice-bright text-bg-deep' },
      // outline
      { variant: 'outline', tone: 'neutral', class: 'border-border text-ink-muted' },
      { variant: 'outline', tone: 'info', class: 'border-ice/60 text-ice' },
      { variant: 'outline', tone: 'success', class: 'border-success/60 text-success' },
      { variant: 'outline', tone: 'warning', class: 'border-warning/60 text-warning' },
      { variant: 'outline', tone: 'danger', class: 'border-danger/60 text-danger' },
      { variant: 'outline', tone: 'accent', class: 'border-ice/60 text-ice-bright' },
      // plain
      { variant: 'plain', tone: 'neutral', class: 'text-ink-muted' },
      { variant: 'plain', tone: 'info', class: 'text-ice' },
      { variant: 'plain', tone: 'success', class: 'text-success' },
      { variant: 'plain', tone: 'warning', class: 'text-warning' },
      { variant: 'plain', tone: 'danger', class: 'text-danger' },
      { variant: 'plain', tone: 'accent', class: 'text-ice-bright' },
    ],
    defaultVariants: { tone: 'neutral', variant: 'soft', size: 'sm' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ tone, variant, size, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ tone, variant, size }), className)}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
