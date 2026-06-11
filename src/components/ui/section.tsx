import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Containers de UI — substituem `<section className="rounded-lg border ...">`
 * espalhado pelo app. `Section` e o container maior (ex: card de step do
 * wizard); `Surface` e o tile menor aninhado (ex: card de atributo dentro
 * de uma section).
 *
 * Padroes aprovados em /components. Quando precisar de um container,
 * SEMPRE prefira um destes em vez de digitar classes a mao.
 */

// ── Section ────────────────────────────────────────────────────────────────
const sectionVariants = cva('rounded-lg', {
  variants: {
    tone: {
      /** bg-bg-card + borda padrao. Default. */
      default: 'border border-border bg-bg-card',
      /** Destaque (ex: aprovado/atual). Borda ice-deep. */
      accent: 'border border-ice-deep bg-bg-card',
      /** Surface mais clara (ex: blocos secundarios dentro de outra section). */
      paper: 'border border-border bg-bg-paper',
      /** Sem fundo nem borda — usar quando o container e so semantico. */
      plain: '',
    },
    padded: {
      true: 'p-6',
      false: '',
    },
  },
  defaultVariants: { tone: 'default', padded: true },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: 'section' | 'div' | 'article' | 'aside';
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, tone, padded, as: Comp = 'section', ...props }, ref) => (
    <Comp
      ref={ref as never}
      className={cn(sectionVariants({ tone, padded }), className)}
      {...props}
    />
  ),
);
Section.displayName = 'Section';

// ── Surface (tile menor) ───────────────────────────────────────────────────
const surfaceVariants = cva('rounded transition-colors', {
  variants: {
    tone: {
      /** bg-bg-card-2 — tile padrao aninhado. */
      default: 'bg-bg-card-2',
      /** bg-bg-card — mais escuro, pra layered surfaces. */
      elevated: 'bg-bg-card',
      /** bg-bg-deep — mais escuro ainda (ex: areas de preview/canvas). */
      sunken: 'bg-bg-deep',
    },
    bordered: {
      true: 'border border-border',
      false: '',
    },
    interactive: {
      true: 'cursor-pointer hover:border-border-strong',
      false: '',
    },
    padding: {
      none: '',
      sm: 'px-2 py-1',
      md: 'px-3 py-2',
      lg: 'p-4',
    },
  },
  defaultVariants: {
    tone: 'default',
    bordered: true,
    interactive: false,
    padding: 'md',
  },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, tone, bordered, interactive, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        surfaceVariants({ tone, bordered, interactive, padding }),
        className,
      )}
      {...props}
    />
  ),
);
Surface.displayName = 'Surface';
