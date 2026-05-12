import Link from 'next/link';

/**
 * Placeholder estilizado de login. O fluxo OAuth com Firebase entra em F1:
 *   - Server Action `signInWithGoogle` (cliente abre popup, troca ID token)
 *   - Route handler `POST /api/auth/session` cria session cookie e upsert do User
 *   - Middleware protege `(app)/*` checando o cookie
 *
 * Por enquanto a página existe para que o link no home não quebre e para
 * confirmar que a estética dark+ice está aplicada nos layouts internos.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-20">
      <section className="relative z-10 w-full max-w-md border border-border bg-bg-card p-10 text-center shadow-hero">
        <span className="font-display text-[10px] uppercase tracking-[0.4em] text-ice-deep">
          Acesso
        </span>
        <h1 className="mt-2 font-serif text-4xl font-light text-ink">
          Entre na <span className="italic text-ice-bright">Forja</span>
        </h1>
        <p className="mt-6 font-body text-sm leading-relaxed text-ink-muted">
          O login com Google será habilitado na Fase F1.
          <br />
          Até lá a Forja segue em preparação.
        </p>

        <button
          type="button"
          disabled
          className="mt-8 w-full cursor-not-allowed border border-border bg-bg-card-2 px-6 py-3 font-display text-xs uppercase tracking-[0.3em] text-ink-faint"
        >
          Entrar com Google
        </button>

        <Link
          href="/"
          className="mt-6 inline-block font-display text-[10px] uppercase tracking-[0.4em] text-ink-muted transition-colors hover:text-ice"
        >
          ← Voltar
        </Link>
      </section>
    </main>
  );
}
