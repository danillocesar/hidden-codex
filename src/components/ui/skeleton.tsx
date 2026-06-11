import { cn } from '@/lib/utils/cn';

/**
 * Placeholder pulsante pra conteúdo carregando (imagens, listas). Use
 * `absolute inset-0` pra cobrir um container `relative` enquanto a mídia carrega.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse bg-gradient-to-br from-bg-card-2 to-bg-card', className)}
    />
  );
}
