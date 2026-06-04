'use client';

import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from './skeleton';

/**
 * `<img>` que mostra um `Skeleton` por cima enquanto a imagem carrega (e some
 * com fade quando termina). Na troca de imagem (retrato, capa, jutsu) o skeleton
 * reaparece até a nova carregar.
 *
 * Detalhes que importam:
 * - `loaded` é derivado de "ESTE `src` terminou" (`loadedSrc === src`), não de
 *   um booleano que pode ficar preso no valor antigo.
 * - `key={src}` força um `<img>` novo por URL — senão, ao trocar o `src`, o
 *   elemento reusado ainda reporta `complete=true` da imagem velha por um
 *   instante e o skeleton não apareceria.
 * - Imagem em cache: se a `<img>` nova já está `complete` quando o efeito roda,
 *   revela na hora (o `onLoad` poderia não disparar pra imagem cacheada).
 *
 * Deve viver dentro de um container `relative` (o skeleton é `absolute inset-0`).
 * Repassa todas as props nativas de `<img>` (handlers de pointer, style, etc.).
 */
export function ImageWithSkeleton({
  src,
  alt = '',
  className,
  skeletonClassName,
  ...rest
}: { src: string; skeletonClassName?: string } & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
>) {
  const ref = useRef<HTMLImageElement>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;

  // Elemento novo por src (key): se já vier do cache (complete), revela na hora.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setLoadedSrc(src);
  }, [src]);

  return (
    <>
      {!loaded ? <Skeleton className={cn('absolute inset-0 z-[1]', skeletonClassName)} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        ref={ref}
        src={src}
        alt={alt}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setLoadedSrc(src)}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        {...rest}
      />
    </>
  );
}
