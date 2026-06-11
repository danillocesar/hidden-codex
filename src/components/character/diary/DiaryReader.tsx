'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen, ImageIcon, X } from 'lucide-react';

import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils/cn';
import { diaryExcerpt } from '@/lib/character/diaryExcerpt';
import type { DiaryEntryView } from '@/server/queries/diaryEntries';

// BlockNote depende do DOM (ProseMirror) — nunca renderiza no servidor. Só é
// carregado quando uma entrada é aberta (uma instância por vez).
const DiaryEntryBody = dynamic(() => import('./DiaryEntryBody').then((m) => m.DiaryEntryBody), {
  ssr: false,
  loading: () => (
    <Text variant="muted" size="sm">
      Carregando…
    </Text>
  ),
});

/** `yyyy-mm-dd` -> "5 jun 2026" (pt-BR). */
function formatEntryDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Diario em modo LEITURA — usado na ficha compartilhada (`/share/[token]/diary`).
 * Espelha a tela do dono (`DiaryWorkspace`): grade de cards com titulo/data/tag/
 * trecho; clicar abre a entrada completa em um overlay read-only. Sem nenhuma
 * acao de edicao. So renderiza o corpo rico (BlockNote) da entrada aberta.
 */
export function DiaryReader({ entries }: { entries: DiaryEntryView[] }) {
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [open, setOpen] = useState<DiaryEntryView | null>(null);

  const tags = useMemo(
    () => Array.from(new Set(entries.map((e) => e.tag).filter((t): t is string => !!t))).sort(),
    [entries],
  );
  const visible = filterTag ? entries.filter((e) => e.tag === filterTag) : entries;

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-6 w-6" aria-hidden />}
        title="O diário está vazio"
        description="Este personagem ainda não registrou entradas no diário."
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone="neutral" variant="outline" size="md">
          {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
        </Badge>
        {tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <TagChip active={filterTag === null} onClick={() => setFilterTag(null)}>
              Todas
            </TagChip>
            {tags.map((t) => (
              <TagChip key={t} active={filterTag === t} onClick={() => setFilterTag(t)}>
                {t}
              </TagChip>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((entry) => (
          <DiaryReadCard key={entry.id} entry={entry} onOpen={() => setOpen(entry)} />
        ))}
      </div>

      {open ? <DiaryReadOverlay entry={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

function DiaryReadCard({ entry, onOpen }: { entry: DiaryEntryView; onOpen: () => void }) {
  const date = formatEntryDate(entry.entryDate);
  const excerpt = diaryExcerpt(entry.body);

  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col gap-2 rounded border border-border bg-bg-card p-4 transition-colors hover:border-ice-deep"
    >
      <Heading level={3} italic accent className="text-base">
        {entry.title}
      </Heading>

      <div className="flex flex-wrap items-center gap-2">
        {date ? (
          <Text variant="muted" size="sm">
            {date}
          </Text>
        ) : null}
        {entry.tag ? (
          <Badge tone="info" size="sm">
            {entry.tag}
          </Badge>
        ) : null}
      </div>

      {excerpt ? (
        <Text variant="muted" size="sm" className="line-clamp-3">
          {excerpt}
        </Text>
      ) : (
        <Text variant="help" size="sm" className="inline-flex items-center gap-1">
          <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          Entrada sem texto
        </Text>
      )}
    </article>
  );
}

function DiaryReadOverlay({ entry, onClose }: { entry: DiaryEntryView; onClose: () => void }) {
  const date = formatEntryDate(entry.entryDate);

  // Trava o scroll do body e fecha no ESC enquanto a leitura está aberta.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-deep">
      <header className="flex items-center gap-3 border-b border-border bg-bg-paper/80 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          aria-label="Fechar leitura"
          onClick={onClose}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-ink-muted transition-colors hover:border-ice hover:text-ice"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          Diário · somente leitura
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
          <Heading level={1} italic accent className="text-3xl font-light">
            {entry.title}
          </Heading>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {date ? (
              <Text variant="muted" size="sm">
                {date}
              </Text>
            ) : null}
            {entry.tag ? (
              <Badge tone="info" size="sm">
                {entry.tag}
              </Badge>
            ) : null}
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <DiaryEntryBody body={entry.body} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TagChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-0.5 font-display text-[10px] uppercase tracking-[0.2em] transition-colors',
        active
          ? 'border-ice-deep bg-ice-deep/30 text-ice-bright'
          : 'border-border text-ink-muted hover:border-ice hover:text-ice',
      )}
    >
      {children}
    </button>
  );
}
