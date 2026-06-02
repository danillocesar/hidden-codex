'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { deleteJutsu } from '@/server/actions/characters/jutsus';
import type { FichaJutsu } from '@/lib/character/mapPrismaToCore';
import { JutsuCard, type AcertoValues } from './JutsuCard';
import { JutsuEditor, type JutsuImage, type JutsuPowerOption } from './JutsuEditor';

/**
 * Seção Técnicas da ficha: grade de jutsus + criação (owner) via JutsuEditor e
 * exclusão com confirmação. Lista vem por prop; após mutar, `router.refresh()`
 * recarrega o server component.
 */
export function JutsusSection({
  characterId,
  jutsus,
  powers,
  images,
  acertoValues,
  canEdit,
}: {
  characterId: string;
  jutsus: ReadonlyArray<FichaJutsu>;
  powers: ReadonlyArray<JutsuPowerOption>;
  images: ReadonlyArray<JutsuImage>;
  acertoValues: AcertoValues;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [pending, setPending] = useState<FichaJutsu | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startTransition] = useTransition();

  const canCreate = canEdit && powers.length > 0;

  const confirmDelete = () => {
    if (!pending) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteJutsu(pending.id);
      if (result.ok) {
        setPending(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  if (jutsus.length === 0 && !canCreate) {
    return (
      <Text variant="muted" className="block">
        Nenhum jutsu cadastrado.
      </Text>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {jutsus.map((jutsu) => (
          <JutsuCard
            key={jutsu.id}
            jutsu={jutsu}
            characterId={characterId}
            acertoValues={acertoValues}
            canEdit={canEdit}
            onRequestDelete={setPending}
          />
        ))}

        {canCreate ? (
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="flex min-h-[360px] flex-col items-center justify-center gap-2 rounded border border-dashed border-border text-ink-muted transition hover:border-ice-deep hover:text-ice"
          >
            <span className="font-jp text-4xl text-ice-deep/60">術</span>
            <span className="font-display text-[10px] uppercase tracking-[0.3em]">Criar jutsu</span>
          </button>
        ) : null}
      </div>

      {canCreate ? (
        <JutsuEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          characterId={characterId}
          powers={powers}
          images={images}
        />
      ) : null}

      <Modal
        open={pending !== null}
        onClose={() => {
          if (!isDeleting) setPending(null);
        }}
        title="Apagar jutsu?"
        description="Esta ação não pode ser desfeita pela interface."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="seal" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Apagando…' : 'Apagar'}
            </Button>
          </>
        }
      >
        <Text>
          Apagar <span className="font-serif text-ice-bright">{pending?.name}</span>?
        </Text>
        {error ? (
          <Alert tone="danger" className="mt-3">
            {error}
          </Alert>
        ) : null}
      </Modal>
    </div>
  );
}
