'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { BookOpen, ImageIcon, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { DiaryBlock } from './diarySchema';

import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils/cn';
import { diaryExcerpt } from '@/lib/character/diaryExcerpt';
import { parseDiaryDoc } from './diaryDoc';
import type { DiaryEntryView } from '@/server/queries/diaryEntries';
import {
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/server/actions/characters/diary';

// BlockNote depende do DOM (ProseMirror) — nunca renderiza no servidor.
const DiaryEditor = dynamic(() => import('./DiaryEditor').then((m) => m.DiaryEditor), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <Text variant="muted">Carregando editor…</Text>
    </div>
  ),
});

/** `yyyy-mm-dd` -> "5 jun 2026" (pt-BR). */
function formatEntryDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    d,
  );
}

type OpenState = { mode: 'new' } | { mode: 'edit'; entry: DiaryEntryView } | null;

export function DiaryWorkspace({
  characterId,
  entries,
}: {
  characterId: string;
  entries: DiaryEntryView[];
}) {
  const [open, setOpen] = useState<OpenState>(null);
  const [deleting, setDeleting] = useState<DiaryEntryView | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const tags = useMemo(
    () => Array.from(new Set(entries.map((e) => e.tag).filter((t): t is string => !!t))).sort(),
    [entries],
  );
  const visible = filterTag ? entries.filter((e) => e.tag === filterTag) : entries;

  function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const res = await deleteDiaryEntry(target.id);
      if (res.ok) {
        toast('Entrada removida.', 'success');
        setDeleting(null);
        router.refresh();
      } else {
        toast(res.error, 'danger');
      }
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
        <Button size="sm" onClick={() => setOpen({ mode: 'new' })}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nova entrada
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" aria-hidden />}
          title={filterTag ? 'Nenhuma entrada com essa tag' : 'O diário está vazio'}
          description={
            filterTag
              ? 'Troque o filtro ou crie uma nova entrada.'
              : 'Registre sessões, anotações e momentos da campanha. Aceita formatação e imagens.'
          }
          action={
            <Button size="sm" onClick={() => setOpen({ mode: 'new' })}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Nova entrada
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((entry) => (
            <DiaryCard
              key={entry.id}
              entry={entry}
              onOpen={() => setOpen({ mode: 'edit', entry })}
              onDelete={() => setDeleting(entry)}
            />
          ))}
        </div>
      )}

      {open ? (
        <DiaryEditorOverlay
          key={open.mode === 'edit' ? open.entry.id : 'new'}
          characterId={characterId}
          entry={open.mode === 'edit' ? open.entry : undefined}
          onClose={() => setOpen(null)}
          onSaved={() => {
            setOpen(null);
            router.refresh();
          }}
        />
      ) : null}

      <Modal
        open={deleting !== null}
        onClose={() => (isPending ? undefined : setDeleting(null))}
        title="Apagar entrada?"
        description={deleting?.title}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="seal" size="sm" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Apagando…' : 'Apagar'}
            </Button>
          </>
        }
      >
        <Text>Esta ação não pode ser desfeita.</Text>
      </Modal>
    </>
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

function DiaryCard({
  entry,
  onOpen,
  onDelete,
}: {
  entry: DiaryEntryView;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const date = formatEntryDate(entry.entryDate);
  const excerpt = diaryExcerpt(entry.body);

  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col gap-2 rounded border border-border bg-bg-card p-4 transition-colors hover:border-ice-deep"
    >
      <div className="flex items-start justify-between gap-2">
        <Heading level={3} italic accent className="text-base">
          {entry.title}
        </Heading>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="Editar entrada"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="rounded p-1 text-ink-muted hover:text-ice"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Apagar entrada"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1 text-ink-muted hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {date ? <Text variant="muted" size="sm">{date}</Text> : null}
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

function DiaryEditorOverlay({
  characterId,
  entry,
  onClose,
  onSaved,
}: {
  characterId: string;
  entry?: DiaryEntryView;
  onClose: () => void;
  onSaved: () => void;
}) {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const initialContent = useMemo(() => (entry ? parseDiaryDoc(entry.body) : undefined), [entry]);

  const [title, setTitle] = useState(entry?.title ?? '');
  const [entryDate, setEntryDate] = useState(entry?.entryDate ?? todayIso);
  const [tag, setTag] = useState(entry?.tag ?? '');
  const [isPending, startTransition] = useTransition();
  const docRef = useRef<DiaryBlock[] | null>(null);
  const { toast } = useToast();

  // Trava o scroll do body enquanto o editor full-screen está aberto.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      toast('Dê um título à entrada.', 'warning');
      return;
    }
    const body = JSON.stringify(docRef.current ?? initialContent ?? []);
    const payload = {
      title: trimmed,
      body,
      entryDate: entryDate || null,
      tag: tag.trim() || null,
    };

    startTransition(async () => {
      const res = entry
        ? await updateDiaryEntry({ entryId: entry.id, ...payload })
        : await createDiaryEntry({ characterId, ...payload });
      if (res.ok) {
        toast(entry ? 'Entrada atualizada.' : 'Entrada criada.', 'success');
        onSaved();
      } else {
        toast(res.error, 'danger');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-deep">
      <header className="flex items-center gap-3 border-b border-border bg-bg-paper/80 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          aria-label="Fechar editor"
          onClick={onClose}
          disabled={isPending}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-ink-muted transition-colors hover:border-ice hover:text-ice"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          {entry ? 'Editar entrada' : 'Nova entrada'}
        </span>
        <div className="ml-auto">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da entrada"
            aria-label="Título da entrada"
            className="w-full bg-transparent font-serif text-3xl font-light text-ink placeholder:text-ink-faint focus:outline-none"
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Data" htmlFor="diary-date">
              <Input
                id="diary-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </Field>
            <Field label="Tag" htmlFor="diary-tag" help="Opcional — agrupa entradas (ex.: arco, sessão).">
              <Input
                id="diary-tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="ex.: Arco do Exame Chuunin"
                maxLength={40}
              />
            </Field>
          </div>

          <p className="mt-6 text-xs text-ink-faint">
            Dica: digite <strong className="text-ink-muted">/</strong> para comandos (título, lista,
            imagem…). Para colocar texto <strong className="text-ink-muted">ao lado</strong> de uma
            imagem, arraste um bloco pela alça <strong className="text-ink-muted">⠿</strong> até a
            borda lateral de outro — vira coluna, e a divisória ajusta a largura.
          </p>

          <div className="mt-4 border-t border-border pt-6">
            <DiaryEditor
              initialContent={initialContent}
              onChange={(blocks) => {
                docRef.current = blocks;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
