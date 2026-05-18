'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';

/**
 * Drawer lateral pra mostrar descricao completa de um item do catalogo
 * (pericia, aptidao, poder). Renderizado via portal no body, com backdrop
 * clicavel e fechamento por ESC.
 *
 * Usado por `InfoButton`.
 */
export function InfoDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-drawer-title"
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto',
          'border-l border-border bg-bg-paper shadow-hero',
          'animate-fade-up',
        )}
      >
        <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-bg-paper/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0 flex-1">
            <h3
              id="info-drawer-title"
              className="font-serif text-2xl font-light leading-tight text-ink"
            >
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 font-display text-[10px] uppercase tracking-[0.3em] text-ice-deep">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar drawer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-ink-muted transition-colors hover:border-ice hover:text-ice"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6 6 18"
              />
            </svg>
          </button>
        </header>
        <div className="px-6 py-5 text-sm leading-relaxed text-ink">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
