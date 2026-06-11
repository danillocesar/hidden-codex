import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';
import { getWorldById, getWorldMembers } from '@/server/queries/worlds';
import { getCampaignsByWorld } from '@/server/queries/campaigns';
import { getWorldNpcs, addNpcToWorld, removeNpcFromWorld } from '@/server/actions/worlds/npcs';
import { loadUserCharacters } from '@/server/queries/userCharacters';
import { InviteLinkPanel } from '@/components/worlds/InviteLinkPanel';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Cluster } from '@/components/ui/stack';
import { Heading } from '@/components/ui/heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function WorldDashboardPage({
  params,
}: {
  params: { worldId: string };
}) {
  const session = await getCurrentUser();
  if (!session) return null;

  const [world, campaigns, members, npcs, gmCharacters] = await Promise.all([
    getWorldById(params.worldId, session.user.id),
    getCampaignsByWorld(params.worldId),
    getWorldMembers(params.worldId, session.user.id),
    getWorldNpcs(params.worldId, session.user.id),
    loadUserCharacters(session.user.id),
  ]);

  if (!world) notFound();

  const isGm = world.gmId === session.user.id;

  return (
    <main className="mx-auto max-w-[1340px] px-6 py-12 md:px-12">
      <Stack gap="xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow tone="deep" size="sm" className="tracking-[0.4em]">
              {isGm ? 'Mestre' : 'Jogador'} · Mundo
            </Eyebrow>
            <Heading level={1} className="mt-1 text-4xl md:text-5xl">
              <span className="italic text-ice-bright">{world.name}</span>
            </Heading>
            {world.description && (
              <Text variant="muted" className="mt-2">
                {world.description}
              </Text>
            )}
          </div>
          <Cluster gap="sm">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/worlds/${world.id}/lore`}>Lore</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/worlds/${world.id}/members`}>Membros</Link>
            </Button>
          </Cluster>
        </div>

        {/* Link de convite (GM only) */}
        {isGm && (
          <InviteLinkPanel
            worldId={world.id}
            inviteToken={world.inviteToken}
            isGm={isGm}
          />
        )}

        {/* Campanhas */}
        <Section tone="default" padded>
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <Eyebrow tone="accent">Campanhas</Eyebrow>
              {isGm && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/worlds/${world.id}/campaigns/new`}>+ Nova Campanha</Link>
                </Button>
              )}
            </div>

            {campaigns.length === 0 ? (
              <Text variant="muted">
                {isGm
                  ? 'Crie a primeira campanha para organizar os jogadores.'
                  : 'O Mestre ainda não criou nenhuma campanha.'}
              </Text>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={`/worlds/${world.id}/campaigns/${c.id}`}
                    className="rounded-lg border border-border bg-bg-card-2 p-4 transition-colors hover:border-ice/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Heading level={4}>{c.name}</Heading>
                      {c.activeCombatCount > 0 && (
                        <Badge tone="danger" variant="soft" size="xs">
                          ⚔ {c.activeCombatCount}
                        </Badge>
                      )}
                    </div>
                    {c.description && (
                      <Text variant="muted" size="sm" className="mt-1 line-clamp-2">
                        {c.description}
                      </Text>
                    )}
                    <Text variant="muted" size="sm" className="mt-2">
                      {c.memberCount} membro{c.memberCount !== 1 ? 's' : ''}
                    </Text>
                  </Link>
                ))}
              </div>
            )}
          </Stack>
        </Section>

        {/* Membros */}
        <Section tone="default" padded>
          <Stack gap="md">
            <Eyebrow tone="faint">Jogadores</Eyebrow>
            {members.length === 0 ? (
              <Text variant="muted">Nenhum jogador ainda. Compartilhe o link de convite.</Text>
            ) : (
              <div className="flex flex-wrap gap-4">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-bg-card-2 px-3 py-2"
                  >
                    {m.userAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.userAvatarUrl}
                        alt={m.userName ?? ''}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card text-ink-muted">
                        👤
                      </div>
                    )}
                    <div>
                      <Text size="sm">{m.userName ?? 'Jogador'}</Text>
                      {m.characterName && (
                        <Text variant="muted" size="sm">
                          {m.characterName}
                        </Text>
                      )}
                    </div>
                    {isGm && m.characterId && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/characters/${m.characterId}`}>Ver ficha</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Stack>
        </Section>

        {/* NPCs do GM */}
        {isGm && (
          <Section tone="default" padded>
            <Stack gap="md">
              <Eyebrow tone="faint">Fichas do Mestre neste Mundo</Eyebrow>

              {/* NPCs já adicionados */}
              {npcs.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {npcs.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-bg-card-2 px-3 py-2"
                    >
                      <Text size="sm">{n.characterName}</Text>
                      {n.label && (
                        <Badge tone="neutral" variant="outline" size="xs">
                          {n.label}
                        </Badge>
                      )}
                      <Text variant="muted" size="sm">
                        NC {n.characterCampaignLevel}
                      </Text>
                      <form
                        action={async () => {
                          'use server';
                          await removeNpcFromWorld(params.worldId, n.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="ml-1 text-xs text-ink-muted/60 hover:text-danger"
                          title="Remover do Mundo"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {/* Personagens do GM disponíveis para adicionar */}
              {(() => {
                const npcCharacterIds = new Set(npcs.map((n) => n.characterId));
                const available = gmCharacters.filter((c) => !npcCharacterIds.has(c.id));
                if (available.length === 0) {
                  return npcs.length === 0 ? (
                    <Text variant="muted">
                      Você não tem personagens para adicionar. Crie um personagem primeiro.
                    </Text>
                  ) : null;
                }
                return (
                  <div className="border-t border-border pt-3">
                    <Text variant="muted" size="sm" className="mb-2">
                      Adicionar personagem ao Mundo:
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {available.map((c) => (
                        <form
                          key={c.id}
                          action={async () => {
                            'use server';
                            await addNpcToWorld(params.worldId, c.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-full border border-border px-3 py-1 text-sm text-ink-muted transition-colors hover:border-ice/40 hover:text-ink"
                          >
                            + {c.name}{' '}
                            <span className="text-xs opacity-60">NC {c.campaignLevel}</span>
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Stack>
          </Section>
        )}
      </Stack>
    </main>
  );
}
