import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Heading } from './heading';
import { Text } from './text';

/**
 * Estado vazio pra listas/secoes sem dados. Substitui o `<div className=
 * "rounded border border-dashed border-border bg-bg-paper/50 px-6 py-10
 * text-center">` que comecou a aparecer no app.
 *
 *   <EmptyState
 *     title="Nenhum personagem ainda"
 *     description="Comece criando o seu primeiro shinobi."
 *     action={<Button>Criar personagem</Button>}
 *   />
 *
 *   <EmptyState
 *     icon={<MyIcon />}
 *     title="Sem jutsus"
 *     description="Adicione jutsus no editor da ficha."
 *   />
 */

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icone opcional acima do titulo (renderizado em ink-faint). */
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** Call-to-action (botao, link). Renderizado abaixo da descricao. */
  action?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center gap-3 rounded border border-dashed border-border bg-bg-paper/50 px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="text-ink-faint" aria-hidden>
          {icon}
        </div>
      ) : null}
      <Heading level={3} italic accent className="text-lg">
        {title}
      </Heading>
      {description ? (
        <Text variant="muted" size="sm" className="max-w-md">
          {description}
        </Text>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  ),
);
EmptyState.displayName = 'EmptyState';
