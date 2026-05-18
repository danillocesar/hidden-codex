import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { loadCharacterById } from '@/server/queries/characterById';
import { FichaHeader } from '@/components/character/ficha/FichaHeader';
import { HeroSection } from '@/components/character/ficha/HeroSection';
import { Button } from '@/components/ui/button';

/**
 * Ficha read-only — `/characters/[id]`.
 *
 * Server Component. Faz auth + ownership check + fetch + mapeia pra view
 * model. Renderiza progressivamente os componentes da ficha (Header, Hero,
 * Attributes hoje; resto entra nos proximos dias).
 *
 * Personagens publicos (`isPublicOnProfile`) sao acessiveis sem ser dono.
 * 404 quando nao encontrado OU sem permissao (nao vaza existencia).
 */
export default async function CharacterFichaPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCurrentUser();
  const result = await loadCharacterById(params.id, session?.user.id ?? null);

  if (!result.ok) notFound();

  const { core: _core, display, lookup: _lookup } = result.viewModel;
  void _core;
  void _lookup;

  return (
    <article className="relative">
      <FichaHeader
        clanName={display.clanName}
        villageName={display.villageName}
        clanKanji={undefined}
        villageKanji={undefined}
      />

      <HeroSection
        name={display.name}
        subtitle={null}
        overline={
          display.kekkeiGenkaiName
            ? `Kekkei Genkai · ${display.kekkeiGenkaiName}`
            : display.clanName
              ? `Cla · ${display.clanName}`
              : null
        }
        age={display.age}
        rank={display.rank}
        campaignLevel={result.viewModel.core.campaignLevel}
        tendency={display.tendency}
        attributes={result.viewModel.core.attributes}
        imageUrl={null}
        placeholderKanji={display.clanCode === 'yuki' ? '雪' : undefined}
      />

      <section className="mx-auto max-w-5xl px-6 py-12 md:px-12">
        <div className="rounded border border-dashed border-border bg-bg-paper/50 px-6 py-10 text-center text-sm text-ink-muted">
          <p>StatsRow · Aptidoes · Pericias · Jutsus · Combate · Inventario</p>
          <p className="mt-1 text-xs text-ink-faint">
            entram nos Dias 2-4 do P0.3
          </p>
        </div>
      </section>

      {display.isOwner ? (
        <nav className="sticky bottom-4 mx-auto mt-8 flex w-fit gap-3 rounded-full border border-border bg-bg-card/95 px-4 py-2 backdrop-blur">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Voltar</Link>
          </Button>
          <Button asChild size="sm" disabled title="Editor entra em P0.4.">
            <span>Editar (em breve)</span>
          </Button>
        </nav>
      ) : null}
    </article>
  );
}
