'use client';

import { useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from 'react';
import { setCharacterSectionCoverPosition } from '@/server/actions/characters/sectionCovers';
import type { SectionCoverKey } from '@/lib/character/sectionCovers';

const FILTER = 'saturate(0.62) contrast(1.12) brightness(0.55)';

type Drag = { startX: number; startY: number; x: number; y: number; w: number; h: number };

function parsePosition(position: string): { x: number; y: number } {
  const match = /(\d{1,3})% (\d{1,3})%/.exec(position);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 50, y: 50 };
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Imagem de capa do separador. Para o dono, arrastar reposiciona a foto dentro
 * do card (object-position) e salva ao soltar — assim ela "encaixa" como quiser.
 * Visitante vê a imagem estática.
 */
export function SectionCover({
  imageUrl,
  position,
  canEdit,
  characterId,
  coverKey,
}: {
  imageUrl: string;
  position: string;
  canEdit: boolean;
  characterId: string;
  coverKey: SectionCoverKey;
}) {
  const [pos, setPos] = useState(position);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);
  const [, startTransition] = useTransition();

  const onPointerDown = (e: ReactPointerEvent<HTMLImageElement>) => {
    if (!canEdit) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = parsePosition(pos);
    drag.current = { startX: e.clientX, startY: e.clientY, x, y, w: rect.width, h: rect.height };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLImageElement>) => {
    const d = drag.current;
    if (!d) return;
    const nx = clamp(d.x - ((e.clientX - d.startX) / d.w) * 100);
    const ny = clamp(d.y - ((e.clientY - d.startY) / d.h) * 100);
    setPos(`${nx}% ${ny}%`);
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    startTransition(() => {
      void setCharacterSectionCoverPosition(characterId, coverKey, pos);
    });
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt=""
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute inset-0 h-full w-full select-none object-cover ${
        canEdit ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
      style={{ objectPosition: pos, filter: FILTER }}
    />
  );
}
