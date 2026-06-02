import {
  DEFAULT_SECTION_COVERS,
  type SectionCoverImage,
  type SectionCoverKey,
} from '@/lib/character/sectionCovers';
import { cn } from '@/lib/utils/cn';
import { SectionCover } from './SectionCover';
import { SectionCoverPicker } from './SectionCoverPicker';

export function SectionDivider({
  number,
  title,
  kanji,
  imageUrl,
  position,
  coverKey,
  characterId,
  canEdit,
  images,
  className,
}: {
  number: string;
  title: string;
  kanji: string;
  imageUrl: string;
  position: string;
  coverKey: SectionCoverKey;
  characterId: string;
  canEdit: boolean;
  images: ReadonlyArray<SectionCoverImage>;
  className?: string;
}) {
  return (
    <section className={cn('relative my-8 border-y border-border bg-bg-deep', className)}>
      <div className="relative h-[180px] overflow-hidden md:h-[140px]">
        <SectionCover
          imageUrl={imageUrl}
          position={position}
          canEdit={canEdit}
          characterId={characterId}
          coverKey={coverKey}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--bg-deep)_0%,transparent_20%,transparent_80%,var(--bg-deep)_100%),linear-gradient(90deg,var(--bg-deep)_0%,transparent_26%,transparent_74%,var(--bg-deep)_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(155,184,209,0.20),transparent_52%)]"
        />

        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <h2 className="font-serif text-3xl font-normal leading-none text-ink drop-shadow-[0_0_28px_rgba(0,0,0,0.65)] md:text-5xl">
            {title}
          </h2>
          <div className="font-jp text-lg leading-none text-ice-bright/70 drop-shadow-[0_0_24px_rgba(155,184,209,0.36)] md:text-2xl">
            {kanji}
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -left-2 bottom-1 font-serif text-[120px] leading-none text-ice/10 md:text-[180px]"
        >
          {number}
        </div>
      </div>

      {canEdit ? (
        <SectionCoverPicker
          characterId={characterId}
          coverKey={coverKey}
          defaultUrl={DEFAULT_SECTION_COVERS[coverKey]}
          images={images}
        />
      ) : null}
    </section>
  );
}
