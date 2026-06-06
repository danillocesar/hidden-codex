'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export type FolderTreeNode = {
  id: string;
  name: string;
  children: FolderTreeNode[];
  entryCount?: number;
};

export interface FolderTreeProps {
  folders: FolderTreeNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /**
   * Chamado quando o usuário quer renomear uma pasta.
   * Recebe `(id, currentName)` — o pai é responsável por abrir um modal/input.
   */
  onRename?: (id: string, currentName: string) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  onAddRoot?: () => void;
  className?: string;
}

/**
 * Árvore de pastas colapsável para a Lore do Mundo.
 * Seleção, adição, rename (sinaliza ao pai) e delete.
 */
export function FolderTree({
  folders,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onAddChild,
  onAddRoot,
  className,
}: FolderTreeProps) {
  return (
    <nav className={cn('flex flex-col gap-0.5', className)}>
      {/* Raiz (sem pasta) */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
          selectedId === null
            ? 'bg-ice-deep/30 text-ice-bright'
            : 'text-ink-muted hover:bg-bg-card-2 hover:text-ink',
        )}
      >
        <span className="text-xs">📄</span>
        <span className="flex-1 truncate font-display text-[11px] uppercase tracking-[0.15em]">
          Raiz
        </span>
      </button>

      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          node={folder}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}

      {onAddRoot && (
        <button
          onClick={onAddRoot}
          className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-ink-muted transition-colors hover:text-ice"
        >
          <span>+</span>
          <span>Nova pasta</span>
        </button>
      )}
    </nav>
  );
}

function FolderNode({
  node,
  depth,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onAddChild,
}: {
  node: FolderTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRename?: (id: string, currentName: string) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <div className="group flex items-center gap-1">
        {/* Toggle collapse */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-5 w-4 shrink-0 items-center justify-center text-[10px] text-ink-muted/60 hover:text-ink-muted"
        >
          {hasChildren ? (open ? '▾' : '▸') : null}
        </button>

        {/* Folder button — double-click abre rename no pai */}
        <button
          onClick={() => onSelect(node.id)}
          onDoubleClick={() => onRename?.(node.id, node.name)}
          title={onRename ? 'Duplo clique para renomear' : undefined}
          className={cn(
            'flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm transition-colors',
            isSelected
              ? 'bg-ice-deep/30 text-ice-bright'
              : 'text-ink-muted hover:bg-bg-card-2 hover:text-ink',
          )}
        >
          <span className="text-xs">📁</span>
          <span className="flex-1 truncate text-xs">{node.name}</span>
          {node.entryCount !== undefined && node.entryCount > 0 && (
            <span className="text-[10px] text-ink-muted/60">{node.entryCount}</span>
          )}
        </button>

        {/* Menu ⋯ — aparece no hover da pasta */}
        {(onAddChild || onRename || onDelete) && (
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-muted/60 opacity-0 transition-opacity hover:bg-bg-card-2 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                  title="Opções"
                >
                  ⋯
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" sideOffset={4} className="min-w-[8rem]">
                {onAddChild && (
                  <DropdownMenuItem onClick={() => onAddChild(node.id)}>
                    + Sub-pasta
                  </DropdownMenuItem>
                )}
                {onRename && (
                  <DropdownMenuItem onClick={() => onRename(node.id, node.name)}>
                    Renomear
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    {(onAddChild || onRename) && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => onDelete(node.id)}
                      className="text-danger data-[highlighted]:text-danger"
                    >
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {open && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
