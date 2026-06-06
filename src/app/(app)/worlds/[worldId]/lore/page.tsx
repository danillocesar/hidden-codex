import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';
import { getWorldById } from '@/server/queries/worlds';
import { getLoreData } from '@/server/actions/worlds/lore';
import { LoreWorkspace } from '@/components/worlds/LoreWorkspace';

export default async function WorldLorePage({ params }: { params: { worldId: string } }) {
  const session = await getCurrentUser();
  if (!session) return null;

  const world = await getWorldById(params.worldId, session.user.id);
  if (!world) notFound();

  const lore = await getLoreData(params.worldId, session.user.id);
  if (!lore) notFound();

  const isGm = world.gmId === session.user.id;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="font-display text-sm uppercase tracking-[0.3em] text-ink-muted">
          {world.name} · Lore
        </h1>
      </header>
      <div className="flex-1 overflow-hidden">
        <LoreWorkspace
          worldId={params.worldId}
          folders={lore.folders}
          entries={lore.entries}
          isGm={isGm}
        />
      </div>
    </div>
  );
}
