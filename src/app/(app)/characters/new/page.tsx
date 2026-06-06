import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { getCurrentUser } from '@/lib/auth/session';
import { loadWizardCatalogs } from '@/server/queries/wizardCatalogs';
import { countUserCharacters } from '@/server/queries/userCharacters';
import { WizardClient } from './WizardClient';

/**
 * Wizard de criacao de personagem — server component.
 *
 * Carrega todos os catalogos consumidos pelo wizard em paralelo
 * (clans/villages/KGs/powers/aptitudes) e passa pra um client component que
 * orquestra os 4 steps. Auth e garantido pelo layout pai
 * (`src/app/(app)/layout.tsx`).
 *
 * Spec: BACKLOG.md P0.2 / arcana-forge-spec/06-MVP-ROADMAP.md F2.4.
 */
export default async function NewCharacterPage() {
  const session = await getCurrentUser();
  const [catalogs, characterCount] = await Promise.all([
    loadWizardCatalogs(),
    session ? countUserCharacters(session.user.id) : Promise.resolve(1),
  ]);
  const isFirstCharacter = characterCount === 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <Heading level={1}>
          Criar <span className="italic text-ice-bright">novo personagem</span>
        </Heading>
        <Text variant="muted" className="mt-2">
          6 passos rápidos. Você sempre poderá ajustar depois no editor da ficha.
        </Text>
      </header>

      <WizardClient catalogs={catalogs} isFirstCharacter={isFirstCharacter} />
    </main>
  );
}
