'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import { setCharacterPortrait } from '@/server/actions/characters/portrait';
import { cn } from '@/lib/utils/cn';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = 'image/jpeg,image/png,image/webp';

/**
 * Retrato do hero da ficha. Para o dono, a caixa inteira é clicável: abre o
 * file picker, sobe em `/api/upload/character-portrait` e persiste via
 * `setCharacterPortrait`. Visitante vê só a imagem/placeholder.
 */
export function FichaPortrait({
  characterId,
  imageUrl,
  canEdit,
  placeholderKanji,
}: {
  characterId: string;
  imageUrl: string | null;
  canEdit: boolean;
  placeholderKanji?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('Arquivo muito grande (máx 5MB).');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/character-portrait', { method: 'POST', body: fd });
      const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !body?.url) {
        setError(body?.error ?? 'Falha no upload.');
        return;
      }
      const result = await setCharacterPortrait(characterId, body.url);
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

  const inner = imageUrl ? (
    <ImageWithSkeleton
      src={imageUrl}
      alt="Retrato do personagem"
      className="h-full w-full object-cover object-[center_20%]"
      style={{ filter: 'contrast(1.05) brightness(0.92) saturate(0.85)' }}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-card-2 via-bg-paper to-bg-deep">
      <span className="font-jp text-[120px] font-bold text-ice-deep/40" aria-hidden>
        {placeholderKanji ?? '影'}
      </span>
    </div>
  );

  if (!canEdit) {
    return <div className="relative h-full w-full">{inner}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group/portrait relative block h-full w-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice"
        aria-label={imageUrl ? 'Trocar retrato' : 'Enviar retrato'}
      >
        {inner}
        <span
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center bg-bg-deep/70 opacity-0 transition-opacity group-hover/portrait:opacity-100',
            uploading && 'opacity-100',
          )}
        >
          <Eyebrow tone="strong" size="md" className="tracking-[0.4em]">
            {uploading ? 'Enviando…' : 'Trocar'}
          </Eyebrow>
        </span>
      </button>
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
        <span className="absolute inset-x-0 bottom-0 z-20 bg-danger/80 px-2 py-1 text-center font-body text-[11px] text-ink">
          {error}
        </span>
      ) : null}
    </>
  );
}
