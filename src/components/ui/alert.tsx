import { cn } from '@/lib/utils/cn';

/**
 * Alerta reutilizavel com 4 tons semanticos. Receita aprovada em /components
 * (variante "F2 + cor F4"): fundo saturado 35% da cor + texto e icone na cor
 * do tom. Sem borda dura.
 *
 * Uso:
 *
 *   <Alert tone="danger">Soma das bases deve ser 12 (atual: 11).</Alert>
 *
 * Use `tone="info"` pra dicas/hints, `success` pra confirmacoes, `warning`
 * pra avisos nao-bloqueantes.
 */

export type AlertTone = 'danger' | 'warning' | 'info' | 'success';

const TONE_CLASS: Record<AlertTone, string> = {
  danger: 'bg-danger/35 text-danger',
  warning: 'bg-warning/35 text-warning',
  info: 'bg-ice/30 text-ice',
  success: 'bg-success/30 text-success',
};

export function Alert({
  tone,
  children,
  className,
}: {
  tone: AlertTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded px-3 py-2.5 text-sm',
        TONE_CLASS[tone],
        className,
      )}
    >
      <AlertIcon tone={tone} />
      <span className="flex-1">{children}</span>
    </div>
  );
}

function AlertIcon({ tone }: { tone: AlertTone }) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    'aria-hidden': true,
    className: 'h-4 w-4 shrink-0',
  } as const;

  switch (tone) {
    case 'danger':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" />
          <path strokeLinecap="round" d="M8 5v4M8 11h.01" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common}>
          <path strokeLinejoin="round" d="M8 2.5l6 11H2L8 2.5z" />
          <path strokeLinecap="round" d="M8 7v3M8 11.5h.01" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" />
          <path strokeLinecap="round" d="M8 11V7M8 5h.01" />
        </svg>
      );
    case 'success':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l2 2 4-4" />
        </svg>
      );
  }
}
