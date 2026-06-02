'use client';

import { useMemo, useRef, useState, useTransition, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { createJutsu } from '@/server/actions/characters/jutsus';
import { cn } from '@/lib/utils/cn';

export type JutsuPowerOption = {
  code: string;
  name: string;
  level: number;
  effects: ReadonlyArray<{ code: string; name: string }>;
};

export type JutsuImage = { id: string; url: string; label: string | null };

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Modal de criação de jutsu: imagem representativa, nome, poder + efeito
 * aprendido e os níveis em que pode ser conjurado (1..nível do poder, múltiplos).
 */
export function JutsuEditor({
  open,
  onClose,
  characterId,
  powers,
  images,
}: {
  open: boolean;
  onClose: () => void;
  characterId: string;
  powers: ReadonlyArray<JutsuPowerOption>;
  images: ReadonlyArray<JutsuImage>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState('');
  const [powerCode, setPowerCode] = useState(powers[0]?.code ?? '');
  const [effectCode, setEffectCode] = useState('');
  const [levels, setLevels] = useState<number[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const busy = uploading || isPending;
  const power = useMemo(() => powers.find((p) => p.code === powerCode), [powers, powerCode]);
  const levelRange = useMemo(
    () => (power ? Array.from({ length: power.level }, (_, i) => i + 1) : []),
    [power],
  );

  const reset = () => {
    setName('');
    setPowerCode(powers[0]?.code ?? '');
    setEffectCode('');
    setLevels([]);
    setImageUrl(null);
    setDescription('');
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const onPowerChange = (code: string) => {
    setPowerCode(code);
    setEffectCode('');
    setLevels([]);
  };

  const toggleLevel = (lvl: number) => {
    setLevels((prev) => (prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]));
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('Arquivo muito grande (máx 8MB).');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('characterId', characterId);
      data.append('file', file);
      data.append('label', file.name.replace(/\.[^.]+$/, '').slice(0, 80) || 'Jutsu');
      const res = await fetch('/api/upload/character-image', { method: 'POST', body: data });
      const body = (await res.json().catch(() => null)) as {
        image?: { url: string };
        error?: string;
      } | null;
      if (!res.ok || !body?.image) {
        setError(body?.error ?? 'Falha no upload.');
        return;
      }
      setImageUrl(body.image.url);
    } catch {
      setError('Erro de rede no upload.');
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createJutsu({
        characterId,
        name,
        powerCode,
        effectCode,
        levels,
        imageUrl,
        description: description.trim() || null,
      });
      if (result.ok) {
        reset();
        onClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const canSubmit = name.trim().length > 0 && powerCode && effectCode && levels.length > 0 && !busy;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Criar jutsu"
      description="Monte um jutsu a partir de um poder e efeito aprendidos."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {isPending ? 'Criando…' : 'Criar jutsu'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Picker label="Imagem">
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded border border-border bg-bg-deep">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center font-jp text-2xl text-ice-deep/40">
                  術
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? 'Enviando…' : 'Enviar imagem'}
              </Button>
              {imageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => setImageUrl(null)}
                >
                  Remover
                </Button>
              ) : null}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                onChange={handleFile}
                className="hidden"
                aria-hidden
                tabIndex={-1}
              />
            </div>
          </div>
          {images.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={cn(
                    'h-12 w-10 overflow-hidden rounded border transition',
                    imageUrl === img.url ? 'border-ice' : 'border-border hover:border-ice-deep',
                  )}
                  aria-label={`Usar ${img.label ?? 'imagem'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </Picker>

        <Picker label="Nome">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Bola de Gelo"
            maxLength={80}
          />
        </Picker>

        <div className="grid gap-4 sm:grid-cols-2">
          <Picker label="Poder">
            <Select value={powerCode} onChange={(e) => onPowerChange(e.target.value)}>
              {powers.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} (nv {p.level})
                </option>
              ))}
            </Select>
          </Picker>
          <Picker label="Efeito">
            <Select
              value={effectCode}
              onChange={(e) => setEffectCode(e.target.value)}
              disabled={!power || power.effects.length === 0}
            >
              <option value="">Selecione…</option>
              {power?.effects.map((ef) => (
                <option key={ef.code} value={ef.code}>
                  {ef.name}
                </option>
              ))}
            </Select>
          </Picker>
        </div>

        <Picker label="Níveis conjuráveis">
          {levelRange.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {levelRange.map((lvl) => {
                const active = levels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleLevel(lvl)}
                    className={cn(
                      'h-9 w-9 rounded border font-serif text-lg transition',
                      active
                        ? 'border-ice bg-ice/15 text-ice-bright'
                        : 'border-border text-ink-muted hover:border-ice-deep',
                    )}
                    aria-pressed={active}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          ) : (
            <Text variant="muted">Escolha um poder primeiro.</Text>
          )}
        </Picker>

        <Picker label="Descrição (opcional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descrição do jutsu…"
            maxLength={500}
            rows={2}
          />
        </Picker>

        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Eyebrow tone="deep" size="xs" as="p" className="mb-1.5 tracking-[0.3em]">
        {label}
      </Eyebrow>
      {children}
    </div>
  );
}
