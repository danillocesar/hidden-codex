'use client';

import { useRef, useState, useTransition, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { setCharacterFichaBackground } from '@/server/actions/characters/sectionCovers';
import type { SectionCoverImage } from '@/lib/character/sectionCovers';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Modal (controlado) pra definir o fundo da ficha: envia imagem nova, escolhe
 * uma ja enviada, ou remove. Persiste via `setCharacterFichaBackground`.
 */
export function FichaBackgroundDialog({
  open,
  onClose,
  characterId,
  current,
  images,
}: {
  open: boolean;
  onClose: () => void;
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
      if (result.ok) {
        router.refresh();
        onClose();
      }
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
    <Modal
      open={open}
      onClose={onClose}
      title="Fundo da ficha"
      description="Imagem de fundo (P&B + overlay)"
      size="sm"
    >
      <Stack gap="md">
        <Text variant="muted">
          Defina uma imagem de fundo pra ficha inteira. Envie uma nova ou reaproveite uma já
          enviada.
        </Text>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {uploading ? 'Enviando…' : 'Enviar imagem'}
          </Button>
          {current ? (
            <Button variant="ghost" size="sm" onClick={() => apply(null)} disabled={busy}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Remover fundo
            </Button>
          ) : null}
        </div>

        {images.length > 0 ? (
          <Stack gap="sm">
            <Text variant="help">Imagens já enviadas</Text>
            <div className="flex flex-col gap-1">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => apply(image.url)}
                  disabled={busy}
                  className="flex items-center justify-between rounded border border-border px-3 py-2 text-left text-sm text-ink transition-colors hover:border-ice hover:text-ice disabled:opacity-50"
                >
                  <span className="truncate">{image.label ?? shortLabel(image.url)}</span>
                  {current === image.url ? (
                    <span className="font-display text-[9px] uppercase tracking-[0.3em] text-ice-deep">
                      atual
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </Stack>
        ) : null}
      </Stack>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFile}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
    </Modal>
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
