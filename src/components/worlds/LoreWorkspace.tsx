'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import type {
  LoreFolderItem,
  LoreEntryCard,
  LoreVisibility,
} from '@/server/actions/worlds/lore';
import { FolderTree } from '@/components/ui/FolderTree';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/section';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Field, Input } from '@/components/ui/field';
import {
  createLoreFolder,
  renameLoreFolder,
  deleteLoreFolder,
  createLoreEntry,
  updateLoreEntry,
  deleteLoreEntry,
  setLoreEntryVisibility,
} from '@/server/actions/worlds/lore';

const LoreEditor = dynamic(() => import('./LoreEditor').then((m) => m.LoreEditor), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded bg-bg-card-2" />,
});

interface LoreWorkspaceProps {
  worldId: string;
  folders: LoreFolderItem[];
  entries: LoreEntryCard[];
  isGm: boolean;
}

type EditorState =
  | { mode: 'closed' }
  | { mode: 'create'; folderId: string | null }
  | { mode: 'edit'; entry: LoreEntryCard };

type FolderModalState =
  | { open: false }
  | { open: true; mode: 'root' }
  | { open: true; mode: 'child'; parentId: string }
  | { open: true; mode: 'rename'; folderId: string; currentName: string };

type DeleteModalState =
  | { open: false }
  | { open: true; kind: 'folder'; id: string; name: string }
  | { open: true; kind: 'entry'; id: string; title: string };

export function LoreWorkspace({ worldId, folders, entries, isGm }: LoreWorkspaceProps) {
  const router = useRouter();
  const [activeFolderId, setActiveFolderId] = React.useState<string | null>(null);
  const [editor, setEditor] = React.useState<EditorState>({ mode: 'closed' });
  const [folderModal, setFolderModal] = React.useState<FolderModalState>({ open: false });
  const [deleteModal, setDeleteModal] = React.useState<DeleteModalState>({ open: false });
  const [folderName, setFolderName] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const visibleEntries = entries.filter((e) => e.folderId === activeFolderId);

  // ── Folders ──────────────────────────────────────────────────────────────

  function openFolderModal(state: FolderModalState) {
    if (!state.open) return;
    setFolderName(state.mode === 'rename' ? state.currentName : '');
    setFolderModal(state);
  }

  async function handleFolderSubmit() {
    if (!folderName.trim() || !folderModal.open) return;
    setSaving(true);
    try {
      if (folderModal.mode === 'root') {
        await createLoreFolder(worldId, folderName.trim());
      } else if (folderModal.mode === 'child') {
        await createLoreFolder(worldId, folderName.trim(), folderModal.parentId);
      } else if (folderModal.mode === 'rename') {
        await renameLoreFolder(worldId, folderModal.folderId, folderName.trim());
      }
      router.refresh();
    } finally {
      setSaving(false);
      setFolderModal({ open: false });
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteModal.open) return;
    setSaving(true);
    try {
      if (deleteModal.kind === 'folder') {
        await deleteLoreFolder(worldId, deleteModal.id);
        if (activeFolderId === deleteModal.id) setActiveFolderId(null);
      } else {
        await deleteLoreEntry(worldId, deleteModal.id);
      }
      router.refresh();
    } finally {
      setSaving(false);
      setDeleteModal({ open: false });
    }
  }

  // ── Entries ──────────────────────────────────────────────────────────────

  async function handleSave(title: string, body: string, visibility: LoreVisibility) {
    if (editor.mode === 'create') {
      await createLoreEntry(worldId, {
        title,
        body,
        folderId: editor.folderId ?? undefined,
        visibility,
      });
      router.refresh();
    } else if (editor.mode === 'edit') {
      await updateLoreEntry(worldId, editor.entry.id, { title, body, visibility });
      router.refresh();
    }
    setEditor({ mode: 'closed' });
  }

  async function handleToggleVisibility(entry: LoreEntryCard) {
    const next: LoreVisibility = entry.visibility === 'PLAYERS' ? 'GM_ONLY' : 'PLAYERS';
    await setLoreEntryVisibility(worldId, entry.id, next);
    router.refresh();
  }

  const folderModalTitle =
    folderModal.open
      ? folderModal.mode === 'rename'
        ? 'Renomear pasta'
        : 'Nova pasta'
      : '';

  return (
    <div className="flex h-full gap-0">
      {/* Sidebar de pastas */}
      <aside className="flex w-52 shrink-0 flex-col gap-3 border-r border-border p-4">
        <Text variant="muted" size="sm" className="font-display uppercase tracking-[0.15em]">
          Pastas
        </Text>
        <FolderTree
          folders={folders}
          selectedId={activeFolderId}
          onSelect={setActiveFolderId}
          onRename={
            isGm
              ? (id, currentName) =>
                  openFolderModal({ open: true, mode: 'rename', folderId: id, currentName })
              : undefined
          }
          onDelete={
            isGm
              ? (id) => {
                  const name = findFolderName(folders, id) ?? 'esta pasta';
                  setDeleteModal({ open: true, kind: 'folder', id, name });
                }
              : undefined
          }
          onAddChild={
            isGm
              ? (parentId) => openFolderModal({ open: true, mode: 'child', parentId })
              : undefined
          }
          onAddRoot={isGm ? () => openFolderModal({ open: true, mode: 'root' }) : undefined}
        />
      </aside>

      {/* Área principal */}
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <Heading level={3}>
            {activeFolderId ? (findFolderName(folders, activeFolderId) ?? 'Pasta') : 'Raiz'}
          </Heading>
          {isGm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditor({ mode: 'create', folderId: activeFolderId })}
            >
              + Entrada
            </Button>
          )}
        </div>

        {visibleEntries.length === 0 ? (
          <EmptyState
            title="Sem entradas"
            description={isGm ? 'Crie a primeira entrada de lore.' : 'Nada por aqui ainda.'}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleEntries.map((entry) => (
              <Surface
                key={entry.id}
                tone="default"
                bordered
                padding="md"
                className="flex cursor-pointer flex-col gap-2 hover:border-ice/40"
                onClick={() => setEditor({ mode: 'edit', entry })}
              >
                <div className="flex items-start justify-between gap-2">
                  <Heading level={4} italic accent className="line-clamp-1">
                    {entry.title}
                  </Heading>
                  {isGm && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ open: true, kind: 'entry', id: entry.id, title: entry.title });
                      }}
                      className="shrink-0 text-xs text-ink-muted/60 hover:text-danger"
                    >
                      ×
                    </button>
                  )}
                </div>
                {entry.bodyExcerpt && (
                  <Text variant="muted" size="sm" className="line-clamp-3">
                    {entry.bodyExcerpt}
                  </Text>
                )}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <Text variant="muted" size="sm">
                    {entry.updatedAt}
                  </Text>
                  {isGm ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(entry);
                      }}
                      title={
                        entry.visibility === 'PLAYERS'
                          ? 'Visível para os jogadores — clique para ocultar'
                          : 'Só o Mestre vê — clique para liberar aos jogadores'
                      }
                    >
                      <Badge
                        tone={entry.visibility === 'PLAYERS' ? 'success' : 'neutral'}
                        variant={entry.visibility === 'PLAYERS' ? 'soft' : 'outline'}
                        size="xs"
                      >
                        {entry.visibility === 'PLAYERS' ? '👁 Visível' : '🔒 Só Mestre'}
                      </Badge>
                    </button>
                  ) : null}
                </div>
              </Surface>
            ))}
          </div>
        )}
      </main>

      {/* Modal de pasta (criar / renomear) */}
      <Modal
        open={folderModal.open}
        onClose={() => setFolderModal({ open: false })}
        title={folderModalTitle}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFolderModal({ open: false })} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleFolderSubmit} disabled={saving || !folderName.trim()}>
              {saving ? 'Salvando…' : folderModal.open && folderModal.mode === 'rename' ? 'Renomear' : 'Criar'}
            </Button>
          </>
        }
      >
        <Field label="Nome da pasta" htmlFor="folder-name" required>
          <Input
            id="folder-name"
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            maxLength={80}
            placeholder="Ex.: Locais, Personagens, História…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFolderSubmit();
            }}
          />
        </Field>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        title={deleteModal.open && deleteModal.kind === 'folder' ? 'Excluir pasta' : 'Excluir entrada'}
        description={
          deleteModal.open
            ? deleteModal.kind === 'folder'
              ? 'As entradas desta pasta ficarão na raiz.'
              : 'Esta ação não pode ser desfeita.'
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false })} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="seal" onClick={handleDeleteConfirm} disabled={saving}>
              {saving ? 'Excluindo…' : 'Excluir'}
            </Button>
          </>
        }
      >
        <Text>
          Excluir{' '}
          <strong>
            {deleteModal.open
              ? deleteModal.kind === 'folder'
                ? deleteModal.name
                : deleteModal.title
              : ''}
          </strong>
          ?
        </Text>
      </Modal>

      {/* Editor overlay */}
      {editor.mode !== 'closed' && (
        <LoreEditorOverlay
          mode={editor.mode}
          entry={editor.mode === 'edit' ? editor.entry : undefined}
          isGm={isGm}
          onSave={handleSave}
          onClose={() => setEditor({ mode: 'closed' })}
          LoreEditorComponent={LoreEditor}
        />
      )}
    </div>
  );
}

function findFolderName(folders: LoreFolderItem[], id: string): string | null {
  for (const f of folders) {
    if (f.id === id) return f.name;
    const found = findFolderName(f.children, id);
    if (found) return found;
  }
  return null;
}

function LoreEditorOverlay({
  mode,
  entry,
  isGm,
  onSave,
  onClose,
  LoreEditorComponent,
}: {
  mode: 'create' | 'edit';
  entry?: LoreEntryCard;
  isGm: boolean;
  onSave: (title: string, body: string, visibility: LoreVisibility) => Promise<void>;
  onClose: () => void;
  LoreEditorComponent: React.ComponentType<{
    initialContent?: string;
    onChange: (blocks: unknown[]) => void;
  }>;
}) {
  const [title, setTitle] = React.useState(entry?.title ?? '');
  const [blocks, setBlocks] = React.useState<unknown[]>([]);
  const [visibility, setVisibility] = React.useState<LoreVisibility>(
    entry?.visibility ?? 'GM_ONLY',
  );
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(title.trim(), JSON.stringify(blocks), visibility);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-deep">
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
        <button onClick={onClose} className="text-ink-muted hover:text-ink">✕</button>
        <span className="text-sm text-ink-muted">
          {mode === 'create' ? 'Nova entrada' : 'Editar entrada'}
        </span>
        {isGm ? (
          <div className="flex items-center gap-3">
            {/* Toggle de visibilidade */}
            <button
              type="button"
              onClick={() =>
                setVisibility((v) => (v === 'PLAYERS' ? 'GM_ONLY' : 'PLAYERS'))
              }
              className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-xs transition-colors hover:border-ice/40"
              title="Alternar visibilidade para os jogadores"
            >
              {visibility === 'PLAYERS' ? (
                <span className="text-success">👁 Visível aos jogadores</span>
              ) : (
                <span className="text-ink-muted">🔒 Só o Mestre</span>
              )}
            </button>
            <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        ) : (
          <button onClick={onClose} className="text-sm text-ice hover:text-ice-bright">
            Fechar
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isGm ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da entrada"
            className="mb-4 w-full bg-transparent text-3xl font-serif text-ink placeholder:text-ink-muted/40 focus:outline-none"
          />
        ) : (
          <h1 className="mb-4 font-serif text-3xl text-ink">{title}</h1>
        )}
        <LoreEditorComponent initialContent={entry?.body} onChange={setBlocks} />
      </div>
    </div>
  );
}
