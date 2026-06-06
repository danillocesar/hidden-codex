'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronsUp, ImageIcon, MoreHorizontal, Pencil, Share2, Undo2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShareLinkDialog } from './ShareLinkDialog';
import { FichaBackgroundDialog } from './FichaBackgroundDialog';
import type { SectionCoverImage } from '@/lib/character/sectionCovers';
import type { ShareLinkInfo } from '@/server/actions/characters/share';

/**
 * Menu de ações do dono, estilo Notion: um botão "⋯" discreto no topo da ficha
 * que abre uma lista compacta. Navegações são links; Compartilhar e Fundo abrem
 * diálogos. Fica no fluxo (não flutua, não sobrepõe o conteúdo).
 */
export function FichaActionMenu({
  characterId,
  fichaBackground,
  images,
  activeShareLink,
}: {
  characterId: string;
  fichaBackground: string | null;
  images: ReadonlyArray<SectionCoverImage>;
  activeShareLink: ShareLinkInfo | null;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Ações da ficha"
            className="-m-1 rounded p-1 text-ink-muted transition-colors hover:text-ice focus-visible:outline-none focus-visible:text-ice data-[state=open]:text-ice"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações da ficha</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/characters/${characterId}/edit`}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/characters/${characterId}/levelup`}>
              <ChevronsUp className="h-3.5 w-3.5" aria-hidden />
              Level up
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setShareOpen(true)}>
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            Compartilhar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setBgOpen(true)}>
            <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            Fundo da ficha
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <Undo2 className="h-3.5 w-3.5" aria-hidden />
              Voltar ao painel
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareLinkDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        characterId={characterId}
        initialLink={activeShareLink}
      />
      <FichaBackgroundDialog
        open={bgOpen}
        onClose={() => setBgOpen(false)}
        characterId={characterId}
        current={fichaBackground}
        images={images}
      />
    </>
  );
}
