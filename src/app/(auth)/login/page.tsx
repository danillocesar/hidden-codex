import Link from 'next/link';
import { Suspense } from 'react';
import { LoginButton } from '@/components/auth/LoginButton';

/**
 * Tela de login. O middleware redireciona direto pra `/dashboard` quando já há
 * cookie de sessão, então essa tela só é renderizada para visitantes anônimos.
 *
 * `LoginButton` é client component — usa Firebase Client SDK pra abrir o popup
 * do Google e Server Action `loginWithGoogle` pra criar a sessão.
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
          Use sua conta Google. A sessão dura 7 dias.
        </p>

        <div className="mt-8">
          <Suspense fallback={null}>
            <LoginButton />
          </Suspense>
        </div>

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
