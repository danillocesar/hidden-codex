'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';

export type ToastTone = 'info' | 'success' | 'danger' | 'warning';

type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  /** Enfileira um toast. Auto-some depois de alguns segundos. */
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** Cor do acento (borda esquerda) por tom. */
const ACCENT_CLASS: Record<ToastTone, string> = {
  info: 'border-l-ice',
  success: 'border-l-success',
  danger: 'border-l-danger',
  warning: 'border-l-warning',
};

/** Cor do badge do ícone por tom. */
const ICON_CLASS: Record<ToastTone, string> = {
  info: 'bg-ice/15 text-ice',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
};

const DURATION_MS = 3500;

// Contador de ids fora do render (Date.now/Math.random não são necessários).
let nextId = 0;

/**
 * Provider de toasts — monte uma vez no shell (layout autenticado). Expõe
 * `useToast().toast(message, tone)` pra qualquer client component abaixo.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    nextId += 1;
    setItems((xs) => [...xs, { id: nextId, message, tone }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa de um <ToastProvider> ancestral.');
  return ctx;
}

function Toaster({
  items,
  onDismiss,
}: {
  items: ReadonlyArray<ToastItem>;
  onDismiss: (id: number) => void;
}) {
  // Portais não existem no HTML do servidor: só montamos depois da hidratação
  // pra não dar mismatch (o body do server não tem o container do toast).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {items.map((item) => (
        <ToastView key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), DURATION_MS);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        'animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-border-strong border-l-[3px] bg-bg-card-2 py-3 pl-3 pr-3.5 shadow-hero ring-1 ring-black/40',
        ACCENT_CLASS[item.tone],
      )}
    >
      <span
        className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full', ICON_CLASS[item.tone])}
      >
        <ToastIcon tone={item.tone} />
      </span>
      <span className="flex-1 font-body text-sm leading-snug text-ink">{item.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Fechar"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-bg-card hover:text-ink"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
          className="h-3.5 w-3.5"
        >
          <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    'aria-hidden': true,
    className: 'h-4 w-4',
  } as const;

  switch (tone) {
    case 'success':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l2 2 4-4" />
        </svg>
      );
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
  }
}
