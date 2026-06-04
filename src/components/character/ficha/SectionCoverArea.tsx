'use client';

import {
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Check, Move, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import { setCharacterSectionCoverPosition } from '@/server/actions/characters/sectionCovers';
import {
  DEFAULT_SECTION_COVERS,
  MAX_COVER_ZOOM,
  type SectionCoverImage,
  type SectionCoverKey,
} from '@/lib/character/sectionCovers';
import { cn } from '@/lib/utils/cn';
import { SectionCoverPicker } from './SectionCoverPicker';

const FILTER = 'saturate(0.62) contrast(1.12) brightness(0.55)';
const ZOOM_STEP = 0.25;

type Drag = { startX: number; startY: number; x: number; y: number; w: number; h: number };

function parsePosition(position: string): { x: number; y: number } {
  const match = /(\d{1,3})% (\d{1,3})%/.exec(position);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 50, y: 50 };
}

const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const clampZoom = (v: number) => Math.max(1, Math.min(MAX_COVER_ZOOM, Math.round(v * 100) / 100));

/**
 * Área da capa do separador: imagem (com pan + zoom salvos) + controles
 * owner-only. Os botões só aparecem no hover; "Ajustar" liga/desliga o modo de
 * edição (arrastar pra reposicionar + zoom in/out), pra não mover sem querer.
 * Os overlays/título vêm como `children`, sobre a imagem.
 */
export function SectionCoverArea({
  imageUrl,
  position,
  zoom,
  canEdit,
  characterId,
  coverKey,
  images,
  children,
}: {
  imageUrl: string;
  position: string;
  zoom: number;
  canEdit: boolean;
  characterId: string;
  coverKey: SectionCoverKey;
  images: ReadonlyArray<SectionCoverImage>;
  children: ReactNode;
}) {
  const [adjusting, setAdjusting] = useState(false);
  const [pos, setPos] = useState(position);
  const [z, setZ] = useState(zoom);
  const drag = useRef<Drag | null>(null);
  const [, startTransition] = useTransition();

  const save = (nextPos: string, nextZoom: number) => {
    startTransition(() => {
      void setCharacterSectionCoverPosition(characterId, coverKey, nextPos, nextZoom);
    });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLImageElement>) => {
    if (!adjusting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = parsePosition(pos);
    drag.current = { startX: e.clientX, startY: e.clientY, x, y, w: rect.width, h: rect.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLImageElement>) => {
    const d = drag.current;
    if (!d) return;
    const nx = clampPct(d.x - ((e.clientX - d.startX) / d.w) * 100);
    const ny = clampPct(d.y - ((e.clientY - d.startY) / d.h) * 100);
    setPos(`${nx}% ${ny}%`);
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    save(pos, z);
  };

  const changeZoom = (delta: number) => {
    const nz = clampZoom(z + delta);
    if (nz === z) return;
    setZ(nz);
    save(pos, nz);
  };

  return (
    <>
      <div className="relative h-[180px] overflow-hidden md:h-[140px]">
        <ImageWithSkeleton
          src={imageUrl}
          alt=""
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            'absolute inset-0 h-full w-full select-none object-cover',
            adjusting && 'cursor-grab active:cursor-grabbing',
          )}
          style={{
            objectPosition: pos,
            transform: `scale(${z})`,
            transformOrigin: pos,
            filter: FILTER,
          }}
        />
        {children}
        {adjusting ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 text-center font-display text-[9px] uppercase tracking-[0.3em] text-ice-bright/80 drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
            arraste pra posicionar · use +/− pra zoom
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <div
          className={cn(
            'absolute right-4 top-4 z-30 flex items-center gap-2 transition-opacity',
            adjusting
              ? 'opacity-100'
              : 'opacity-0 focus-within:opacity-100 group-hover/cover:opacity-100',
          )}
        >
          {adjusting ? (
            <>
              <Tooltip content="Menos zoom">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="border-ice-deep/50 bg-bg-deep/70 text-ice-bright backdrop-blur hover:border-ice"
                  onClick={() => changeZoom(-ZOOM_STEP)}
                  disabled={z <= 1}
                  aria-label="Menos zoom"
                >
                  <ZoomOut className="h-4 w-4" aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content="Mais zoom">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="border-ice-deep/50 bg-bg-deep/70 text-ice-bright backdrop-blur hover:border-ice"
                  onClick={() => changeZoom(ZOOM_STEP)}
                  disabled={z >= MAX_COVER_ZOOM}
                  aria-label="Mais zoom"
                >
                  <ZoomIn className="h-4 w-4" aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content="Concluir ajuste">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="border-ice/60 bg-ice/15 text-ice-bright backdrop-blur hover:border-ice"
                  onClick={() => setAdjusting(false)}
                  aria-label="Concluir ajuste"
                >
                  <Check className="h-4 w-4" aria-hidden />
                </Button>
              </Tooltip>
            </>
          ) : (
            <>
              <SectionCoverPicker
                characterId={characterId}
                coverKey={coverKey}
                defaultUrl={DEFAULT_SECTION_COVERS[coverKey]}
                images={images}
              />
              <Tooltip content="Ajustar enquadramento">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="border-ice-deep/50 bg-bg-deep/70 text-ice-bright backdrop-blur hover:border-ice"
                  onClick={() => setAdjusting(true)}
                  aria-label="Ajustar enquadramento"
                >
                  <Move className="h-4 w-4" aria-hidden />
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
