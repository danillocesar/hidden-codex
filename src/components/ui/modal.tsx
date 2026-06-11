'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';
import { Heading } from './heading';
import { Eyebrow } from './eyebrow';

/**
 * Modal centralizado renderizado via portal. Substitui qualquer "abre uma
 * caixa em cima da pagina" — confirmacao, jutsu modal, level up, etc.
 *
 * Comportamento padrao: backdrop blur + ESC + click fora fecham. Scroll do
 * body bloqueado enquanto aberto.
 *
 *   <Modal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title="Apagar personagem?"
 *     description="Esta acao nao pode ser desfeita."
 *     size="sm"
 *     footer={<><Button variant="ghost">Cancelar</Button><Button>Apagar</Button></>}
 *   >
 *     <Text>Tem certeza que deseja apagar Satsuki Yuki?</Text>
 *   </Modal>
 */

const SIZE = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const;

export type ModalSize = keyof typeof SIZE;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  /** Se false, click no backdrop nao fecha (usuario tem que usar ESC ou X). */
  dismissOnBackdrop = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  dismissOnBackdrop?: boolean;
  className?: string;
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

  if (typeof document === 'undefined' || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={dismissOnBackdrop ? onClose : undefined}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'animate-fade-up relative flex w-full flex-col overflow-hidden rounded-lg border border-border bg-bg-paper shadow-hero',
          SIZE[size],
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div className="min-w-0 flex-1">
            <Heading id="modal-title" level={3} italic accent>
              {title}
            </Heading>
            {description ? (
              <Eyebrow tone="deep" className="mt-1 inline-block">
                {description}
              </Eyebrow>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
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

        {children ? (
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink">
            {children}
          </div>
        ) : null}

        {footer ? (
          <footer className="flex items-center justify-end gap-3 border-t border-border bg-bg-paper px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
