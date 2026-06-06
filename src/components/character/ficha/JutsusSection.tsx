'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { createAllJutsus, deleteJutsu } from '@/server/actions/characters/jutsus';
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
  const [editTarget, setEditTarget] = useState<FichaJutsu | null>(null);
  const [pending, setPending] = useState<FichaJutsu | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startTransition] = useTransition();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkInfo, setBulkInfo] = useState<string | null>(null);
  const [isBulking, startBulk] = useTransition();

  const canCreate = canEdit && powers.length > 0;
  const totalPossiveis = powers.reduce((sum, p) => sum + p.effects.length, 0);

  const confirmBulk = () => {
    setBulkError(null);
    startBulk(async () => {
      const result = await createAllJutsus(characterId);
      if (result.ok) {
        setBulkOpen(false);
        setBulkInfo(`${result.created} criado(s), ${result.skipped} já existia(m).`);
        router.refresh();
      } else {
        setBulkError(result.error);
      }
    });
  };

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
      {canCreate ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBulkInfo(null);
              setBulkError(null);
              setBulkOpen(true);
            }}
          >
            Criar todos os jutsus
          </Button>
          {bulkInfo ? <Text variant="muted">{bulkInfo}</Text> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {jutsus.map((jutsu) => (
          <JutsuCard
            key={jutsu.id}
            jutsu={jutsu}
            characterId={characterId}
            acertoValues={acertoValues}
            canEdit={canEdit}
            onRequestEdit={(j) => {
              setEditTarget(j);
              setEditorOpen(true);
            }}
            onRequestDelete={setPending}
          />
        ))}

        {canCreate ? (
          <button
            type="button"
            onClick={() => {
              setEditTarget(null);
              setEditorOpen(true);
            }}
            className="flex min-h-[360px] flex-col items-center justify-center gap-2 rounded border border-dashed border-border text-ink-muted transition hover:border-ice-deep hover:text-ice"
          >
            <span className="font-jp text-4xl text-ice-deep/60">術</span>
            <span className="font-display text-[10px] uppercase tracking-[0.3em]">Criar jutsu</span>
          </button>
        ) : null}
      </div>

      {canCreate ? (
        <JutsuEditor
          key={editTarget?.id ?? 'new'}
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          characterId={characterId}
          powers={powers}
          images={images}
          jutsu={editTarget}
        />
      ) : null}

      <Modal
        open={bulkOpen}
        onClose={() => {
          if (!isBulking) setBulkOpen(false);
        }}
        title="Criar todos os jutsus?"
        description="Gera um jutsu por efeito aprendido — sem customização."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulkOpen(false)} disabled={isBulking}>
              Cancelar
            </Button>
            <Button onClick={confirmBulk} disabled={isBulking}>
              {isBulking ? 'Gerando…' : 'Gerar'}
            </Button>
          </>
        }
      >
        <Text>
          Cria um jutsu para cada um dos seus{' '}
          <span className="font-serif text-ice-bright">{totalPossiveis}</span> efeito(s)
          aprendido(s), com todos os níveis conjuráveis e sem imagem. Efeitos que já têm jutsu são
          ignorados.
        </Text>
        {bulkError ? (
          <Alert tone="danger" className="mt-3">
            {bulkError}
          </Alert>
        ) : null}
      </Modal>

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
