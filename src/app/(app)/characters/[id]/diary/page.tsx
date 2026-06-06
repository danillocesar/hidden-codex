import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { getCurrentUser } from '@/lib/auth/session';
import { loadDiaryEntries } from '@/server/queries/diaryEntries';
import { DiaryWorkspace } from '@/components/character/diary/DiaryWorkspace';

/**
 * Diário do personagem — `/characters/[id]/diary`.
 *
 * Server Component, OWNER-ONLY (o diário é privado — não há caminho público). A
 * query devolve `null` quando a ficha não é do usuário → 404 sem vazar
 * existência. O CRUD/edição vive no `DiaryWorkspace` (client) com o editor de
 * blocos em tela cheia.
 */
export default async function DiaryPage({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  const data = await loadDiaryEntries(params.id, session?.user.id ?? null);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <Link
          href={`/characters/${data.characterId}`}
          className="mb-3 inline-flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted transition-colors hover:text-ice"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Voltar à ficha
        </Link>
        <Heading level={1}>
          Diário de <span className="italic text-ice-bright">{data.characterName}</span>
        </Heading>
        <Text variant="muted" className="mt-2">
          Registre a jornada da campanha — anotações, sessões e momentos, com formatação e imagens.
        </Text>
      </header>

      <DiaryWorkspace characterId={data.characterId} entries={data.entries} />
    </main>
  );
}
