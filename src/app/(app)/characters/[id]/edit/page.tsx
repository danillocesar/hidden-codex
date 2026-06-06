import { notFound } from 'next/navigation';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { getCurrentUser } from '@/lib/auth/session';
import { loadCharacterById } from '@/server/queries/characterById';
import { loadWizardCatalogs } from '@/server/queries/wizardCatalogs';
import { mapViewModelToWizardState } from '@/lib/character/mapViewModelToWizardState';
import { WizardClient } from '../../new/WizardClient';

/**
 * Edicao de personagem — `/characters/[id]/edit`.
 *
 * Server Component. Reaproveita o wizard de criacao pre-preenchido com o estado
 * atual da ficha. So o DONO edita (fichas publicas de terceiros caem em 404,
 * sem vazar existencia). Inventario fica fora do wizard em edicao — e gerido ao
 * vivo na ficha.
 */
export default async function EditCharacterPage({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  const [result, catalogs] = await Promise.all([
    loadCharacterById(params.id, session?.user.id ?? null),
    loadWizardCatalogs(),
  ]);

  if (!result.ok || !result.viewModel.display.isOwner) {
    notFound();
  }

  const wizardState = { ...mapViewModelToWizardState(result.viewModel), step: 0 };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <Heading level={1}>
          Editar <span className="italic text-ice-bright">{result.viewModel.display.name}</span>
        </Heading>
        <Text variant="muted" className="mt-2">
          Ajuste qualquer etapa do build. O inventário continua sendo gerenciado na ficha.
        </Text>
      </header>

      <WizardClient
        catalogs={catalogs}
        mode="edit"
        characterId={params.id}
        initialState={wizardState}
      />
    </main>
  );
}
