import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';
import { getWorldByInviteToken } from '@/server/queries/worlds';
import { loadUserCharacters } from '@/server/queries/userCharacters';
import { joinWorld } from '@/server/actions/worlds/join';
import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Heading } from '@/components/ui/heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';

export default async function JoinWorldPage({ params }: { params: { token: string } }) {
  const session = await getCurrentUser();

  // Não autenticado → redireciona para login com next param
  if (!session) {
    redirect(`/login?next=/join/${params.token}`);
  }

  const world = await getWorldByInviteToken(params.token);
  if (!world) {
    return (
      <main className="mx-auto max-w-lg px-6 py-12 text-center">
        <Heading level={2}>Link inválido</Heading>
        <Text variant="muted" className="mt-2">
          Este link de convite não existe ou foi revogado.
        </Text>
      </main>
    );
  }

  const characters = await loadUserCharacters(session.user.id);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Stack gap="lg">
        <div className="text-center">
          <Eyebrow tone="accent" size="sm">
            Convite para o Mundo
          </Eyebrow>
          <Heading level={1} className="mt-2">
            <span className="italic text-ice-bright">{world.name}</span>
          </Heading>
          {world.description && (
            <Text variant="muted" className="mt-2">
              {world.description}
            </Text>
          )}
          {world.gmName && (
            <Text variant="muted" size="sm" className="mt-1">
              Mestre: {world.gmName}
            </Text>
          )}
        </div>

        <Section tone="default" padded>
          <form
            action={async (fd: FormData) => {
              'use server';
              const characterId = fd.get('characterId') as string | null;
              const result = await joinWorld(params.token, characterId || undefined);
              if (result.ok) {
                redirect(`/worlds/${result.data.worldId}`);
              }
            }}
          >
            <Stack gap="md">
              {characters.length > 0 ? (
                <>
                  <Text variant="muted" size="sm">
                    Selecione o personagem que você vai usar neste Mundo:
                  </Text>
                  <Select name="characterId" defaultValue="">
                    <option value="">Entrar sem personagem (escolher depois)</option>
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — NC {c.campaignLevel}
                      </option>
                    ))}
                  </Select>
                </>
              ) : (
                <Text variant="muted" size="sm">
                  Você ainda não tem personagens. Pode criar um depois de entrar.
                </Text>
              )}

              <Button type="submit" className="w-full">
                Entrar no Mundo
              </Button>
            </Stack>
          </form>
        </Section>
      </Stack>
    </main>
  );
}
