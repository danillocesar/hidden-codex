import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';
import { getWorldById, getWorldMembers } from '@/server/queries/worlds';
import { getCampaignById } from '@/server/queries/campaigns';
import { getCombatsByCampaign } from '@/server/queries/combats';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Heading } from '@/components/ui/heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addToCampaign, removeFromCampaign } from '@/server/actions/worlds/campaigns';
import { createCombat } from '@/server/actions/worlds/combat';

export default async function CampaignPage({
  params,
}: {
  params: { worldId: string; campaignId: string };
}) {
  const session = await getCurrentUser();
  if (!session) return null;

  const [world, campaign, combats, allMembers] = await Promise.all([
    getWorldById(params.worldId, session.user.id),
    getCampaignById(params.campaignId, params.worldId),
    getCombatsByCampaign(params.campaignId),
    getWorldMembers(params.worldId, session.user.id),
  ]);

  if (!world || !campaign) notFound();

  const isGm = world.gmId === session.user.id;
  const campaignMemberIds = new Set(campaign.members.map((m) => m.worldMemberId));

  return (
    <main className="mx-auto max-w-[1340px] px-6 py-12 md:px-12">
      <Stack gap="xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-ink-muted">
          <Link href={`/worlds/${params.worldId}`} className="hover:text-ink">
            {world.name}
          </Link>
          {' · '}
          <span className="text-ink">{campaign.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow tone="deep" size="sm">
              Campanha
            </Eyebrow>
            <Heading level={1} className="mt-1">
              <span className="italic text-ice-bright">{campaign.name}</span>
            </Heading>
            {campaign.description && (
              <Text variant="muted" className="mt-2">
                {campaign.description}
              </Text>
            )}
          </div>

          {isGm && (
            <form
              action={async (fd: FormData) => {
                'use server';
                const name = (fd.get('name') as string) || 'Combate';
                await createCombat(params.worldId, params.campaignId, name);
              }}
              className="flex items-center gap-2"
            >
              <input
                name="name"
                placeholder="Nome do combate"
                className="rounded border border-border bg-bg-card-2 px-3 py-1.5 text-sm text-ink focus:border-ice/50 focus:outline-none"
              />
              <Button type="submit" size="sm">
                + Combate
              </Button>
            </form>
          )}
        </div>

        {/* Combates */}
        {combats.length > 0 && (
          <Section tone="default" padded>
            <Stack gap="md">
              <Eyebrow tone="danger">Combates</Eyebrow>
              <div className="flex flex-col gap-2">
                {combats.map((c) => (
                  <Link
                    key={c.id}
                    href={`/worlds/${params.worldId}/campaigns/${params.campaignId}/combats/${c.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-bg-card-2 px-4 py-3 transition-colors hover:border-ice/40"
                  >
                    <div>
                      <Text size="sm">{c.name}</Text>
                      <Text variant="muted" size="sm">
                        {c.participantCount} participante{c.participantCount !== 1 ? 's' : ''} ·{' '}
                        {c.createdAt}
                      </Text>
                    </div>
                    <Badge
                      tone={
                        c.status === 'ACTIVE'
                          ? 'danger'
                          : c.status === 'SETUP'
                            ? 'warning'
                            : 'neutral'
                      }
                      variant="soft"
                      size="xs"
                    >
                      {c.status === 'ACTIVE'
                        ? 'Em andamento'
                        : c.status === 'SETUP'
                          ? 'Configurando'
                          : 'Encerrado'}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Stack>
          </Section>
        )}

        {/* Membros da Campanha */}
        <Section tone="default" padded>
          <Stack gap="md">
            <Eyebrow tone="accent">Jogadores nesta Campanha</Eyebrow>

            {campaign.members.length === 0 ? (
              <Text variant="muted">
                {isGm
                  ? 'Adicione jogadores do Mundo a esta Campanha.'
                  : 'Nenhum jogador ainda.'}
              </Text>
            ) : (
              <div className="flex flex-wrap gap-3">
                {campaign.members.map((m) => (
                  <div
                    key={m.worldMemberId}
                    className="flex items-center gap-3 rounded-lg border border-border bg-bg-card-2 px-3 py-2"
                  >
                    <div>
                      <Text size="sm">{m.userName ?? 'Jogador'}</Text>
                      {m.characterName && (
                        <Text variant="muted" size="sm">
                          {m.characterName}
                        </Text>
                      )}
                    </div>
                    {isGm && (
                      <form
                        action={async () => {
                          'use server';
                          await removeFromCampaign(
                            params.worldId,
                            params.campaignId,
                            m.worldMemberId,
                          );
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-ink-muted/60 hover:text-danger"
                        >
                          ×
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* GM adiciona membros do Mundo à Campanha */}
            {isGm && allMembers.length > 0 && (
              <div className="border-t border-border pt-3">
                <Text variant="muted" size="sm" className="mb-2">
                  Adicionar jogadores do Mundo:
                </Text>
                <div className="flex flex-wrap gap-2">
                  {allMembers
                    .filter((m) => !campaignMemberIds.has(m.id))
                    .map((m) => (
                      <form
                        key={m.id}
                        action={async () => {
                          'use server';
                          await addToCampaign(params.worldId, params.campaignId, m.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-border px-3 py-1 text-xs text-ink-muted transition-colors hover:border-ice/40 hover:text-ink"
                        >
                          + {m.userName ?? 'Jogador'}
                        </button>
                      </form>
                    ))}
                  {allMembers.filter((m) => !campaignMemberIds.has(m.id)).length === 0 && (
                    <Text variant="muted" size="sm">
                      Todos os jogadores do Mundo já estão nesta Campanha.
                    </Text>
                  )}
                </div>
              </div>
            )}
          </Stack>
        </Section>
      </Stack>
    </main>
  );
}
