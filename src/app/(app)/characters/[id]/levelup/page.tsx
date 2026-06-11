import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/session';
import { loadCharacterById } from '@/server/queries/characterById';
import { loadWizardCatalogs } from '@/server/queries/wizardCatalogs';
import { mapViewModelToWizardState } from '@/lib/character/mapViewModelToWizardState';
import { WizardClient } from '../../new/WizardClient';

// Teto de NC (alinhado ao schema de criacao). Acima disso nao ha mais level-up.
const MAX_NC = 30;

/**
 * Level up — `/characters/[id]/levelup`.
 *
 * Server Component. Reaproveita o wizard num modo focado: sobe o NC em 1 e guia
 * o jogador a gastar os pontos novos (atributos com minimos forcados; pericias/
 * aptidoes/poderes opcionais — pode guardar saldo). So o dono. Persiste via
 * `updateCharacter`, preservando estado de jogo (vitalidade, jutsus, inventario).
 */
export default async function LevelUpPage({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  const [result, catalogs] = await Promise.all([
    loadCharacterById(params.id, session?.user.id ?? null),
    loadWizardCatalogs(),
  ]);

  if (!result.ok || !result.viewModel.display.isOwner) {
    notFound();
  }

  const fromNc = result.viewModel.core.campaignLevel;
  const display = result.viewModel.display;

  if (fromNc >= MAX_NC) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Section tone="accent">
          <Heading level={2} italic accent>
            NC máximo atingido
          </Heading>
          <Text variant="muted" className="mt-2">
            {display.name} já está no NC {fromNc}, o teto suportado. Não há mais níveis para subir.
          </Text>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={`/characters/${display.id}`}>Voltar à ficha</Link>
          </Button>
        </Section>
      </main>
    );
  }

  const base = mapViewModelToWizardState(result.viewModel);
  const wizardState = {
    ...base,
    identity: { ...base.identity, campaignLevel: fromNc + 1 },
    step: 0,
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <Heading level={1}>
          Level up de <span className="italic text-ice-bright">{display.name}</span>
        </Heading>
        <Text variant="muted" className="mt-2">
          Suba para o NC {fromNc + 1} e distribua os novos pontos.
        </Text>
      </header>

      <WizardClient
        catalogs={catalogs}
        mode="levelup"
        characterId={params.id}
        initialState={wizardState}
        levelUpFromNc={fromNc}
      />
    </main>
  );
}
