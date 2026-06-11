import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Primitives de layout. Substituem o `<div className="flex flex-col gap-N">`
 * e `<div className="flex flex-wrap items-X gap-N">` repetidos pelo app.
 *
 *   <Stack gap="md">                  // coluna vertical
 *   <Cluster gap="sm" wrap>           // linha horizontal, quebra
 *   <Inline gap="xs">                 // linha sem quebrar, baseline aligned
 */

const GAP = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
  '2xl': 'gap-8',
} as const;

// ── Stack: flex column ────────────────────────────────────────────────────
const stackVariants = cva('flex flex-col', {
  variants: {
    gap: GAP,
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
  },
  defaultVariants: { gap: 'md', align: 'stretch' },
});

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main';
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap, align, as: Comp = 'div', className, ...props }, ref) => (
    <Comp
      ref={ref as never}
      className={cn(stackVariants({ gap, align }), className)}
      {...props}
    />
  ),
);
Stack.displayName = 'Stack';

// ── Cluster: flex row com quebra ──────────────────────────────────────────
const clusterVariants = cva('flex flex-row', {
  variants: {
    gap: GAP,
    align: {
      baseline: 'items-baseline',
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      between: 'justify-between',
      end: 'justify-end',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
  },
  defaultVariants: { gap: 'sm', align: 'center', wrap: true },
});

export interface ClusterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof clusterVariants> {
  as?: 'div' | 'span' | 'nav' | 'header';
}

export const Cluster = React.forwardRef<HTMLDivElement, ClusterProps>(
  ({ gap, align, justify, wrap, as: Comp = 'div', className, ...props }, ref) => (
    <Comp
      ref={ref as never}
      className={cn(clusterVariants({ gap, align, justify, wrap }), className)}
      {...props}
    />
  ),
);
Cluster.displayName = 'Cluster';

// ── Inline: linha sem quebra, baseline (default) ──────────────────────────
const inlineVariants = cva('inline-flex', {
  variants: {
    gap: GAP,
    align: {
      baseline: 'items-baseline',
      center: 'items-center',
      end: 'items-end',
    },
  },
  defaultVariants: { gap: 'xs', align: 'baseline' },
});

export interface InlineProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof inlineVariants> {
  as?: 'span' | 'div';
}

export const Inline = React.forwardRef<HTMLSpanElement, InlineProps>(
  ({ gap, align, as: Comp = 'span', className, ...props }, ref) => (
    <Comp
      ref={ref as never}
      className={cn(inlineVariants({ gap, align }), className)}
      {...props}
    />
  ),
);
Inline.displayName = 'Inline';
