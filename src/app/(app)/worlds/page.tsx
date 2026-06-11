import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth/session';
import { getWorldsByUser } from '@/server/queries/worlds';
import { WorldCard } from '@/components/worlds/WorldCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';

export default async function WorldsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const worlds = await getWorldsByUser(session.user.id);
  const gmWorlds = worlds.filter((w) => w.role === 'gm');
  const memberWorlds = worlds.filter((w) => w.role === 'member');

  return (
    <main className="mx-auto max-w-[1340px] px-6 py-12 md:px-12">
      <Stack gap="md" as="header">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone="deep" size="sm" className="tracking-[0.4em]">
              Mundos
            </Eyebrow>
            <Heading level={1} className="mt-1 text-4xl md:text-5xl">
              Suas <span className="italic text-ice-bright">Campanhas</span>
            </Heading>
          </div>
          <Button asChild>
            <Link href="/worlds/new">Criar Mundo</Link>
          </Button>
        </div>
        <Text variant="muted">
          {worlds.length > 0
            ? `${worlds.length} mundo${worlds.length !== 1 ? 's' : ''} encontrado${worlds.length !== 1 ? 's' : ''}.`
            : 'Crie um Mundo ou entre em um usando um link de convite.'}
        </Text>
      </Stack>

      {worlds.length === 0 ? (
        <EmptyState
          className="mt-16"
          title="Nenhum mundo ainda"
          description="Crie o primeiro Mundo como Mestre, ou peça um link de convite a um Mestre."
          action={
            <Button asChild>
              <Link href="/worlds/new">Criar Mundo</Link>
            </Button>
          }
        />
      ) : (
        <Stack gap="xl" className="mt-10">
          {gmWorlds.length > 0 && (
            <section>
              <Eyebrow tone="accent" size="sm" className="mb-4">
                Como Mestre
              </Eyebrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gmWorlds.map((w) => (
                  <WorldCard key={w.id} world={w} />
                ))}
              </div>
            </section>
          )}

          {memberWorlds.length > 0 && (
            <section>
              <Eyebrow tone="faint" size="sm" className="mb-4">
                Como Jogador
              </Eyebrow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {memberWorlds.map((w) => (
                  <WorldCard key={w.id} world={w} />
                ))}
              </div>
            </section>
          )}
        </Stack>
      )}
    </main>
  );
}
