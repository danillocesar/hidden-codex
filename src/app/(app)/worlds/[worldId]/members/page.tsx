import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';
import { getWorldById, getWorldMembers } from '@/server/queries/worlds';
import { leaveWorld } from '@/server/actions/worlds/join';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Heading } from '@/components/ui/heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export default async function WorldMembersPage({
  params,
}: {
  params: { worldId: string };
}) {
  const session = await getCurrentUser();
  if (!session) return null;

  const world = await getWorldById(params.worldId, session.user.id);
  if (!world) notFound();

  const members = await getWorldMembers(params.worldId, world.gmId);
  const isGm = world.gmId === session.user.id;

  return (
    <main className="mx-auto max-w-[1340px] px-6 py-12 md:px-12">
      <Stack gap="xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-ink-muted">
          <Link href={`/worlds/${params.worldId}`} className="hover:text-ink">
            {world.name}
          </Link>
          {' · '}
          <span className="text-ink">Jogadores</span>
        </nav>

        <div>
          <Eyebrow tone="deep" size="sm">
            Mundo
          </Eyebrow>
          <Heading level={1} className="mt-1">
            Jogadores de{' '}
            <span className="italic text-ice-bright">{world.name}</span>
          </Heading>
        </div>

        <Section tone="default" padded>
          <Stack gap="md">
            {members.length === 0 ? (
              <Text variant="muted">
                Nenhum jogador ainda. Compartilhe o link de convite para convidar pessoas.
              </Text>
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-bg-card-2 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {m.userAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.userAvatarUrl}
                          alt={m.userName ?? ''}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-card text-ink-muted">
                          👤
                        </div>
                      )}
                      <div>
                        <Text>{m.userName ?? 'Jogador'}</Text>
                        {m.characterName ? (
                          <Text variant="muted" size="sm">
                            {m.characterName}
                          </Text>
                        ) : (
                          <Text variant="muted" size="sm">
                            Sem personagem selecionado
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isGm && m.characterId && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/characters/${m.characterId}`}>Ver ficha</Link>
                        </Button>
                      )}
                      {isGm && (
                        <form
                          action={async () => {
                            'use server';
                            await leaveWorld(params.worldId, m.userId);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded px-2 py-1 text-xs text-ink-muted/60 transition-colors hover:text-danger"
                            title="Remover do Mundo"
                          >
                            Remover
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Stack>
        </Section>
      </Stack>
    </main>
  );
}
