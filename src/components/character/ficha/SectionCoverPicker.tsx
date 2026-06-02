'use client';

import { useRef, useState, useTransition, type ChangeEvent } from 'react';
import { ImageIcon, RotateCcw, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { setCharacterSectionCover } from '@/server/actions/characters/sectionCovers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip } from '@/components/ui/tooltip';
import type { SectionCoverImage, SectionCoverKey } from '@/lib/character/sectionCovers';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

export function SectionCoverPicker({
  characterId,
  coverKey,
  defaultUrl,
  images,
}: {
  characterId: string;
  coverKey: SectionCoverKey;
  defaultUrl: string;
  images: ReadonlyArray<SectionCoverImage>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = uploading || isPending;

  const selectCover = (url: string | null) => {
    setError(null);
    startTransition(async () => {
      const result = await setCharacterSectionCover(characterId, coverKey, url);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError('Arquivo muito grande.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('characterId', characterId);
      data.append('file', file);
      data.append('label', readableFileName(file.name));

      const res = await fetch('/api/upload/character-image', {
        method: 'POST',
        body: data,
      });
      const body = (await res.json().catch(() => null)) as {
        image?: SectionCoverImage;
        error?: string;
      } | null;

      if (!res.ok || !body?.image) {
        setError(body?.error ?? 'Falha no upload.');
        return;
      }

      const result = await setCharacterSectionCover(characterId, coverKey, body.image.url);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError('Erro de rede.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
      <Tooltip content="Enviar capa">
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={busy}
          className="border-ice-deep/50 bg-bg-deep/70 text-ice-bright backdrop-blur hover:border-ice"
          onClick={() => inputRef.current?.click()}
          aria-label="Enviar capa"
        >
          <Upload className="h-4 w-4" aria-hidden />
        </Button>
      </Tooltip>

      <DropdownMenu>
        <Tooltip content="Escolher capa">
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={busy}
              className="border-ice-deep/50 bg-bg-deep/70 text-ice-bright backdrop-blur hover:border-ice"
              aria-label="Escolher capa"
            >
              <ImageIcon className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
          <DropdownMenuLabel>Capas</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => selectCover(defaultUrl)}>
            Padrao do separador
          </DropdownMenuItem>
          {images.length > 0 ? <DropdownMenuSeparator /> : null}
          {images.map((image) => (
            <DropdownMenuItem key={image.id} onSelect={() => selectCover(image.url)}>
              {image.label ?? shortUrlLabel(image.url)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip content="Voltar ao padrao">
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={busy}
          className="border-ice-deep/50 bg-bg-deep/70 text-ice-bright backdrop-blur hover:border-ice"
          onClick={() => selectCover(null)}
          aria-label="Voltar ao padrao"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </Button>
      </Tooltip>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFile}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />

      {error ? (
        <div className="absolute right-0 top-12 w-56 border border-danger/50 bg-bg-paper px-3 py-2 font-body text-xs text-danger shadow-hero">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function readableFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').trim();
  return base ? base.slice(0, 80) : 'Capa';
}

function shortUrlLabel(url: string): string {
  return (
    url
      .split('/')
      .pop()
      ?.replace(/\.webp$/i, '') ?? 'Imagem'
  );
}
