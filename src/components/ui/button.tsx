import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Botão shadcn-style adaptado pra paleta dark+ice do Arcana Forge.
 * Variantes minimalistas — ainda sem `destructive` / `secondary` porque
 * nenhuma surface visual usa essas ainda.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-display text-xs uppercase tracking-[0.3em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ice disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-ice-deep/60 bg-bg-card text-ink hover:border-ice hover:bg-bg-card-2',
        ghost: 'text-ink-muted hover:text-ice',
        outline:
          'border border-border text-ink hover:border-border-strong hover:bg-bg-card-2',
        seal: 'border border-seal/80 bg-seal/15 text-ink hover:bg-seal/25',
      },
      size: {
        default: 'h-11 px-8 py-3',
        sm: 'h-9 px-4 text-[10px]',
        lg: 'h-12 px-10 text-sm',
        icon: 'h-9 w-9 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
