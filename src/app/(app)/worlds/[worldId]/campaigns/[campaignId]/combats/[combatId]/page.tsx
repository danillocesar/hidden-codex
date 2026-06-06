import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';
import { getWorldById } from '@/server/queries/worlds';
import { getCombatById } from '@/server/queries/combats';
import { getCampaignById } from '@/server/queries/campaigns';
import { CombatTracker } from '@/components/worlds/CombatTracker';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { addPlayerParticipant, addGenericEnemy, addNpcParticipant } from '@/server/actions/worlds/combat';
import { getWorldNpcs } from '@/server/actions/worlds/npcs';
import type { CampaignMemberView } from '@/server/queries/campaigns';

export default async function CombatPage({
  params,
}: {
  params: { worldId: string; campaignId: string; combatId: string };
}) {
  const session = await getCurrentUser();
  if (!session) return null;

  const [world, combat, campaign, worldNpcs] = await Promise.all([
    getWorldById(params.worldId, session.user.id),
    getCombatById(params.combatId, params.campaignId),
    getCampaignById(params.campaignId, params.worldId),
    getWorldNpcs(params.worldId, session.user.id),
  ]);

  if (!world || !combat || !campaign) notFound();

  const isGm = world.gmId === session.user.id;

  // Jogadores da campanha que ainda não estão no combate
  const participantCharacterIds = new Set(
    combat.participants.filter((p) => p.characterId).map((p) => p.characterId!),
  );
  const availableMembers = campaign.members.filter(
    (m) => m.characterId && !participantCharacterIds.has(m.characterId),
  );

  return (
    <main className="mx-auto max-w-[1340px] px-6 py-12 md:px-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-ink-muted">
        <Link href={`/worlds/${params.worldId}`} className="hover:text-ink">
          {world.name}
        </Link>
        {' · '}
        <Link
          href={`/worlds/${params.worldId}/campaigns/${params.campaignId}`}
          className="hover:text-ink"
        >
          {campaign.name}
        </Link>
        {' · '}
        <span className="text-ink">{combat.name}</span>
      </nav>

      {/* Tracker */}
      <CombatTracker worldId={params.worldId} combat={combat} isGm={isGm} />

      {/* Controles de setup (GM only, apenas em SETUP) */}
      {isGm && combat.status === 'SETUP' && (
        <div className="mt-8 flex flex-col gap-6">
          <Eyebrow tone="faint">Adicionar Participantes</Eyebrow>

          {/* Adicionar jogadores da campanha */}
          {availableMembers.length > 0 && (
            <div>
              <p className="mb-2 text-sm text-ink-muted">Jogadores da campanha:</p>
              <div className="flex flex-wrap gap-2">
                {availableMembers.map((m: CampaignMemberView) => (
                  <form
                    key={m.worldMemberId}
                    action={async () => {
                      'use server';
                      await addPlayerParticipant(
                        params.worldId,
                        params.combatId,
                        m.worldMemberId,
                      );
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-border px-3 py-1 text-sm text-ink-muted transition-colors hover:border-ice/40 hover:text-ink"
                    >
                      + {m.characterName ?? m.userName ?? 'Jogador'}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar fichas do Mestre (NPCs do Mundo) */}
          {(() => {
            const availableNpcs = worldNpcs.filter(
              (n) => !participantCharacterIds.has(n.characterId),
            );
            if (availableNpcs.length === 0) return null;
            return (
              <div>
                <p className="mb-2 text-sm text-ink-muted">Fichas do Mestre:</p>
                <div className="flex flex-wrap gap-2">
                  {availableNpcs.map((n) => (
                    <form
                      key={n.id}
                      action={async () => {
                        'use server';
                        await addNpcParticipant(params.worldId, params.combatId, n.characterId);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-border px-3 py-1 text-sm text-ink-muted transition-colors hover:border-ice/40 hover:text-ink"
                      >
                        + {n.characterName}{' '}
                        <span className="text-xs opacity-60">NC {n.characterCampaignLevel}</span>
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Adicionar inimigo genérico */}
          <div>
            <p className="mb-2 text-sm text-ink-muted">Inimigo genérico:</p>
            <form
              action={async (fd: FormData) => {
                'use server';
                const name = fd.get('name') as string;
                const hp = parseInt(fd.get('hp') as string, 10);
                if (!name || !hp || hp <= 0) return;
                await addGenericEnemy(params.worldId, params.combatId, name, hp);
              }}
              className="flex items-center gap-2"
            >
              <input
                name="name"
                placeholder="Nome do inimigo"
                required
                className="rounded border border-border bg-bg-card-2 px-3 py-1.5 text-sm text-ink focus:border-ice/50 focus:outline-none"
              />
              <input
                name="hp"
                type="number"
                min={1}
                placeholder="HP"
                required
                className="w-24 rounded border border-border bg-bg-card-2 px-3 py-1.5 text-sm text-ink focus:border-ice/50 focus:outline-none"
              />
              <Button type="submit" size="sm">
                + Inimigo
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
