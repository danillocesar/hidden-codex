import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Label CINZEL pequeno em uppercase com letter-spacing alto. Usado pra:
 *   - Labels de campos ("NOME *")
 *   - Pretitulos / kickers de secao ("PASSO 2 DE 6", "APROVADO")
 *   - Chips informativos de baixo destaque ("HIJUTSU · gelo")
 *
 * Em vez de digitar `font-display text-[10px] uppercase tracking-[0.3em]
 * text-ink-muted` (que aparece >50 vezes no app), use `<Eyebrow>`.
 *
 *   <Eyebrow>Passo 1 de 6</Eyebrow>
 *   <Eyebrow tone="accent">Aprovado</Eyebrow>
 *   <Eyebrow tone="success">grátis (origem)</Eyebrow>
 */

const eyebrowVariants = cva(
  'font-display uppercase tracking-[0.3em] leading-none',
  {
    variants: {
      tone: {
        /** Texto cinza padrao (ink-muted). */
        default: 'text-ink-muted',
        /** Mais apagado (ink-faint) — pra info muito secundaria. */
        faint: 'text-ink-faint',
        /** Destaque ice (ex: label "atual"). */
        accent: 'text-ice',
        /** Mais destacado (ice-bright). */
        strong: 'text-ice-bright',
        /** Azul-escuro — usado em labels de campo / "eyebrows" canonicos. */
        deep: 'text-ice-deep',
        /** Semantic green (chip "gratis", "aprovado"). */
        success: 'text-success',
        /** Semantic amarelo (chip "treinada"). */
        warning: 'text-warning',
        /** Semantic vermelho (chip "restrita", "obrigatorio"). */
        danger: 'text-danger',
      },
      size: {
        /** 9px — bem pequeno, pra chips/badges densos. */
        xs: 'text-[9px]',
        /** 10px — padrao geral. */
        sm: 'text-[10px]',
        /** 11px — pra titulos curtos / tabs. */
        md: 'text-[11px]',
      },
    },
    defaultVariants: { tone: 'default', size: 'sm' },
  },
);

export interface EyebrowProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof eyebrowVariants> {
  as?: 'span' | 'p' | 'div';
}

export const Eyebrow = React.forwardRef<HTMLSpanElement, EyebrowProps>(
  ({ tone, size, as: Comp = 'span', className, ...props }, ref) => (
    <Comp
      ref={ref as never}
      className={cn(eyebrowVariants({ tone, size }), className)}
      {...props}
    />
  ),
);
Eyebrow.displayName = 'Eyebrow';
