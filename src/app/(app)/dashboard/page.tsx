import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';

/**
 * Dashboard — lista de personagens do usuário (F2 implementa o conteúdo).
 *
 * Por hora: saudação + estado vazio com CTA. O middleware + layout `(app)`
 * garantem que só usuários autenticados chegam aqui.
 */
export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;
  const { user, isAdmin } = session;
  const greeting =
    user.displayName?.split(' ')[0] ?? user.email.split('@')[0] ?? 'shinobi';

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Stack gap="md" as="header">
        <Eyebrow tone="deep" size="sm" className="tracking-[0.4em]">
          Dashboard
        </Eyebrow>
        <Heading level={1} className="text-4xl md:text-5xl">
          Olá, <span className="italic text-ice-bright">{greeting}</span>
          {isAdmin ? (
            <Eyebrow tone="accent" size="sm" className="ml-3 align-middle tracking-[0.4em]">
              (admin)
            </Eyebrow>
          ) : null}
        </Heading>
        <Text variant="muted" size="base" className="font-body">
          Seus personagens aparecerão aqui assim que a criação for liberada.
        </Text>
      </Stack>

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
    </main>
  );
}
