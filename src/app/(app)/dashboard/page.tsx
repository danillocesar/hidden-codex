import { getCurrentUser } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';

/**
 * Dashboard — lista de personagens do usuário (F2 implementa o conteúdo).
 *
 * Por hora: saudação + estado vazio com CTA desabilitado de criação.
 * O middleware + layout `(app)` garantem que só usuários autenticados chegam
 * aqui; não precisamos repetir o guard.
 */
export default async function DashboardPage() {
  const session = await getCurrentUser();
  // Nunca null aqui (layout já redireciona), mas o TS pede o guard.
  if (!session) return null;
  const { user, isAdmin } = session;
  const greeting = user.displayName?.split(' ')[0] ?? user.email.split('@')[0] ?? 'shinobi';

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="flex flex-col gap-3">
        <span className="font-display text-[10px] uppercase tracking-[0.4em] text-ice-deep">
          Dashboard
        </span>
        <h1 className="font-serif text-4xl font-light text-ink md:text-5xl">
          Olá, <span className="italic text-ice-bright">{greeting}</span>
          {isAdmin ? (
            <span className="ml-3 align-middle font-display text-[10px] uppercase tracking-[0.4em] text-ice">
              (admin)
            </span>
          ) : null}
        </h1>
        <p className="font-body text-base text-ink-muted">
          Seus personagens aparecerão aqui assim que a criação for liberada.
        </p>
      </header>

      <section className="mt-16 border border-dashed border-border bg-bg-paper/50 px-8 py-16 text-center">
        <p className="font-body text-sm text-ink-muted">
          Nenhum personagem ainda.
        </p>
        <div className="mt-6 flex justify-center">
          <Button disabled title="Criação de personagem chega na próxima sessão.">
            Criar personagem
          </Button>
        </div>
        <p className="mt-4 font-display text-[9px] uppercase tracking-[0.4em] text-ink-faint">
          em breve
        </p>
      </section>
    </main>
  );
}
