'use client';

import { useRef, useState, useTransition, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setCharacterFichaBackground } from '@/server/actions/characters/sectionCovers';
import type { SectionCoverImage } from '@/lib/character/sectionCovers';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Controle (owner) pra definir o fundo da ficha: envia uma imagem nova, escolhe
 * uma já enviada, ou remove. Persiste via `setCharacterFichaBackground`.
 */
export function FichaBackgroundButton({
  characterId,
  current,
  images,
}: {
  characterId: string;
  current: string | null;
  images: ReadonlyArray<SectionCoverImage>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const busy = isPending || uploading;

  const apply = (url: string | null) => {
    startTransition(async () => {
      const result = await setCharacterFichaBackground(characterId, url);
      if (result.ok) router.refresh();
    });
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || file.size > MAX_BYTES) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('characterId', characterId);
      fd.append('file', file);
      fd.append('label', 'Fundo');
      const res = await fetch('/api/upload/character-image', { method: 'POST', body: fd });
      const body = (await res.json().catch(() => null)) as { image?: { url: string } } | null;
      if (res.ok && body?.image) apply(body.image.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={busy}>
            <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            Fundo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="max-h-72 overflow-y-auto">
          <DropdownMenuLabel>Fundo da ficha</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" aria-hidden />
            Enviar imagem
          </DropdownMenuItem>
          {current ? (
            <DropdownMenuItem onSelect={() => apply(null)}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Remover fundo
            </DropdownMenuItem>
          ) : null}
          {images.length > 0 ? <DropdownMenuSeparator /> : null}
          {images.map((image) => (
            <DropdownMenuItem key={image.id} onSelect={() => apply(image.url)}>
              {image.label ?? shortLabel(image.url)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFile}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
    </>
  );
}

function shortLabel(url: string): string {
  return (
    url
      .split('/')
      .pop()
      ?.replace(/\.\w+$/i, '') ?? 'Imagem'
  );
}
