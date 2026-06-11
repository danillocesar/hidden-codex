import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Heading editorial — Cormorant Garamond (`font-serif`) com hierarquia
 * tipografica padronizada. Use em vez de `<h1 className="font-serif text-3xl
 * font-light text-ink">`.
 *
 *   <Heading level={1}>Criar personagem</Heading>
 *   <Heading level={2} italic>Atributos</Heading>
 *   <Heading level={3} italic accent>B1 — Aprovado</Heading>
 *
 * `level` controla a tag semantica (h1-h4) E o tamanho default. `as` permite
 * override (ex: usar tamanho h2 mas renderizar como h3 pra ordem semantica).
 */

type Level = 1 | 2 | 3 | 4;

const LEVEL_CLASSES: Record<Level, string> = {
  1: 'font-serif text-3xl font-light leading-tight md:text-4xl',
  2: 'font-serif text-2xl font-light leading-tight',
  3: 'font-serif text-xl font-light leading-tight',
  4: 'font-serif text-base font-medium leading-snug',
};

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: Level;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'span';
  /** Aplica italico em todo o heading (Cormorant italic). */
  italic?: boolean;
  /** Cor de destaque (ice-bright). Sem ela usa `text-ink`. */
  accent?: boolean;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level, as, italic, accent, className, ...props }, ref) => {
    const Tag = (as ?? (`h${level}` as const)) as React.ElementType;
    return (
      <Tag
        ref={ref}
        className={cn(
          LEVEL_CLASSES[level],
          italic && 'italic',
          accent ? 'text-ice-bright' : 'text-ink',
          className,
        )}
        {...props}
      />
    );
  },
);
Heading.displayName = 'Heading';
