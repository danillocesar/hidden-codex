'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';

import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { updateCharacterNotes } from '@/server/actions/characters/notes';
import { parseDiaryDoc } from './diaryDoc';
import type { DiaryBlock } from './diarySchema';

// BlockNote depende do DOM (ProseMirror) — nunca renderiza no servidor.
const DiaryEditor = dynamic(() => import('./DiaryEditor').then((m) => m.DiaryEditor), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <Text variant="muted">Carregando editor…</Text>
    </div>
  ),
});

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY_MS = 1200;

/**
 * Drawer de Anotações (à esquerda) — bloco de rascunho livre da sessão, com as
 * mesmas ferramentas do diário (BlockNote estilo Notion: títulos, listas,
 * imagens, colunas). Autosave debounced + flush ao fechar. Privado do dono.
 */
export function NotesDrawer({
  open,
  onClose,
  characterId,
  initialNotes,
}: {
  open: boolean;
  onClose: () => void;
  characterId: string;
  initialNotes: string;
}) {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const initialContent = useMemo(() => parseDiaryDoc(initialNotes), [initialNotes]);
  const docRef = useRef<DiaryBlock[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const save = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (docRef.current === null) return; // nada editado ainda
    setStatus('saving');
    const body = JSON.stringify(docRef.current);
    const res = await updateCharacterNotes({ characterId, notes: body });
    if (res.ok) {
      setStatus('saved');
    } else {
      setStatus('error');
      toast(`Falha ao salvar anotações: ${res.error}`, 'danger');
    }
  }, [characterId, toast]);

  // Trava o scroll do body e fecha no ESC enquanto o drawer está aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Garante flush ao desmontar (ex.: navegar pra fora com edição pendente).
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        void save();
      }
    },
    [save],
  );

  function handleChange(blocks: DiaryBlock[]) {
    docRef.current = blocks;
    setStatus('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save();
    }, AUTOSAVE_DELAY_MS);
  }

  function handleClose() {
    void save();
    onClose();
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Painel à esquerda */}
      <div className="flex h-full w-full max-w-xl flex-col border-r border-border bg-bg-paper shadow-hero animate-fade-up">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <button
            type="button"
            aria-label="Fechar anotações"
            onClick={handleClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-ink-muted transition-colors hover:border-ice hover:text-ice"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted">
            Anotações
          </span>
          <span className="ml-auto font-display text-[10px] uppercase tracking-[0.25em] text-ink-faint">
            {SAVE_LABEL[status]}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-5 sm:px-6">
            <p className="mb-4 text-xs text-ink-faint">
              Rascunho livre da sessão — acontecimentos, NPCs, ganchos, lembretes. Digite{' '}
              <strong className="text-ink-muted">/</strong> para comandos. Salva sozinho.
            </p>
            <DiaryEditor initialContent={initialContent} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Backdrop (clica pra fechar) */}
      <button
        type="button"
        aria-label="Fechar anotações"
        onClick={handleClose}
        className="h-full flex-1 cursor-default bg-black/60 backdrop-blur-sm"
      />
    </div>,
    document.body,
  );
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: '',
  unsaved: 'Não salvo',
  saving: 'Salvando…',
  saved: 'Salvo',
  error: 'Erro ao salvar',
};
