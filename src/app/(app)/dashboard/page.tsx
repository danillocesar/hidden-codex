import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { loadUserCharacters } from '@/server/queries/userCharacters';
import { DashboardCharacters } from '@/components/dashboard/DashboardCharacters';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';

/**
 * Dashboard — lista os personagens do usuário (F2). Server Component: faz auth
 * + fetch e delega a grade/filtros/delete pro client `DashboardCharacters`.
 */
export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;
  const { user, isAdmin } = session;
  const greeting = user.displayName?.split(' ')[0] ?? user.email.split('@')[0] ?? 'shinobi';

  const characters = await loadUserCharacters(user.id);

  return (
    <main className="mx-auto max-w-[1340px] px-6 py-12 md:px-12">
      <Stack gap="md" as="header">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone="deep" size="sm" className="tracking-[0.4em]">
              Dashboard
            </Eyebrow>
            <Heading level={1} className="mt-1 text-4xl md:text-5xl">
              Olá, <span className="italic text-ice-bright">{greeting}</span>
              {isAdmin ? (
                <Eyebrow tone="accent" size="sm" className="ml-3 align-middle tracking-[0.4em]">
                  (admin)
                </Eyebrow>
              ) : null}
            </Heading>
          </div>
          {characters.length > 0 ? (
            <Button asChild>
              <Link href="/characters/new">Criar personagem</Link>
            </Button>
          ) : null}
        </div>
        <Text variant="muted" size="base" className="font-body">
          {characters.length > 0
            ? `${characters.length} ${characters.length === 1 ? 'personagem' : 'personagens'} na sua coleção.`
            : 'Seus personagens aparecerão aqui.'}
        </Text>
      </Stack>

      {characters.length > 0 ? (
        <DashboardCharacters characters={characters} />
      ) : (
        <EmptyState
          className="mt-16"
          title="Nenhum personagem ainda"
          description="Comece criando o seu primeiro shinobi."
          action={
            <Button asChild>
              <Link href="/characters/new">Criar personagem</Link>
            </Button>
          }
        />
      )}
    </main>
  );
}
