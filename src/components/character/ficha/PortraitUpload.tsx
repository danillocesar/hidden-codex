'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Text } from '@/components/ui/text';
import { Eyebrow } from '@/components/ui/eyebrow';
import { cn } from '@/lib/utils/cn';

/**
 * Caixa 2:3 (mesmo formato do hero da ficha) que permite upload da foto do
 * personagem. Clique abre file picker, faz POST em
 * `/api/upload/character-portrait` e devolve a URL pro caller via
 * `onChange`. O caller persiste a URL no state — o upload e por arquivo,
 * imediato.
 *
 * Tres estados:
 *   - vazio: gradient + kanji 印 placeholder + dica "Clique pra enviar"
 *   - uploading: overlay com spinner
 *   - preenchido: <img> com hover discreto (botao "trocar")
 *
 * Limite client de 5MB casa com o limite server (route.ts) — defesa em
 * profundidade.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = 'image/jpeg,image/png,image/webp';

export function PortraitUpload({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerPicker = () => {
    if (disabled || uploading) return;
    setError(null);
    inputRef.current?.click();
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reabrir o mesmo arquivo
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError('Arquivo muito grande (max 5MB).');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/character-portrait', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Falha no upload.');
        return;
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
    } catch {
      setError('Erro de rede. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || uploading) return;
    onChange(null);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <button
        type="button"
        onClick={triggerPicker}
        disabled={disabled || uploading}
        className={cn(
          'group relative aspect-[2/3] w-full overflow-hidden shadow-hero transition',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice',
          value
            ? 'cursor-pointer'
            : 'cursor-pointer border border-dashed border-ice-deep/50 hover:border-ice',
          (disabled || uploading) && 'cursor-not-allowed opacity-60',
        )}
        aria-label={value ? 'Trocar retrato' : 'Enviar retrato'}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Retrato do personagem"
              className="h-full w-full object-cover object-[center_20%]"
              style={{ filter: 'contrast(1.05) brightness(0.92) saturate(0.85)' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/70 opacity-0 transition-opacity group-hover:opacity-100">
              <Eyebrow tone="strong" size="md" className="tracking-[0.4em]">
                Trocar
              </Eyebrow>
              <span
                onClick={handleRemove}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    handleRemove(ev as unknown as React.MouseEvent);
                  }
                }}
                className="mt-3 text-[11px] uppercase tracking-[0.3em] text-danger underline-offset-4 hover:underline"
              >
                Remover
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-bg-card via-bg-paper to-bg-deep">
            <span
              aria-hidden
              className="font-jp text-[70px] font-bold leading-none text-ice-deep/30"
            >
              忍者
            </span>
            <Eyebrow tone="accent" size="sm" className="tracking-[0.4em]">
              {uploading ? 'Enviando…' : 'Seu Avatar'}
            </Eyebrow>
            <Text variant="help" size="xs" className="px-4 text-center">
              JPG, PNG ou WebP · max 5MB
            </Text>
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-0 grid place-items-center bg-bg-deep/60">
            <svg
              className="h-8 w-8 animate-spin text-ice"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
              />
            </svg>
          </div>
        ) : null}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />

      {error ? (
        <Text variant="muted" size="xs" className="text-danger">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
