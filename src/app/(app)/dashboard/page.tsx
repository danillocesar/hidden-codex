import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { loadUserCharacters } from '@/server/queries/userCharacters';
import { getWorldsByUser } from '@/server/queries/worlds';
import { DashboardCharacters } from '@/components/dashboard/DashboardCharacters';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';

/**
 * Dashboard — lista os personagens do usuário (F2). Server Component: faz auth
 * + fetch e delega a grade/filtros/delete pro client `DashboardCharacters`.
 */
export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;
  const { user, isAdmin } = session;
  const greeting = user.displayName?.split(' ')[0] ?? user.email.split('@')[0] ?? 'shinobi';

  const [characters, worlds] = await Promise.all([
    loadUserCharacters(user.id),
    getWorldsByUser(user.id),
  ]);

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

      {/* Mundos */}
      {worlds.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <Eyebrow tone="accent" size="sm">
              Mundos
            </Eyebrow>
            <Link
              href="/worlds"
              className="text-sm text-ink-muted transition-colors hover:text-ice"
            >
              Ver todos
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {worlds.slice(0, 4).map((w) => (
              <Link
                key={w.id}
                href={`/worlds/${w.id}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-sm transition-colors hover:border-ice/40"
              >
                <span className="text-ink">{w.name}</span>
                <Badge
                  tone={w.role === 'gm' ? 'accent' : 'neutral'}
                  variant="soft"
                  size="xs"
                >
                  {w.role === 'gm' ? 'Mestre' : 'Jogador'}
                </Badge>
              </Link>
            ))}
            {worlds.length > 4 && (
              <Link
                href="/worlds"
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-ink-muted transition-colors hover:text-ice"
              >
                +{worlds.length - 4} mais
              </Link>
            )}
          </div>
        </section>
      )}

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
