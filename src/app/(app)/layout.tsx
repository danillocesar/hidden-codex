import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { UserMenu } from '@/components/auth/UserMenu';
import { ToastProvider } from '@/components/ui/toast';

/**
 * Layout do shell autenticado. O middleware (`src/middleware.ts`) já bloqueia
 * o acesso sem cookie de sessão; aqui fazemos a verificação criptográfica
 * completa via `getCurrentUser()` (Firebase Admin + Postgres lookup). Se algo
 * estiver fora do lugar, redireciona pra `/login`.
 *
 * Render: header global (logo + UserMenu) seguido pelo `children`.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const { user, isAdmin } = session;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg-deep text-ink">
        <header className="relative z-20 border-b border-border bg-bg-paper/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/dashboard" className="flex items-center opacity-90 transition-opacity hover:opacity-100">
              <Image
                src="/brand/hidden-codex-wordmark-transparent-no-brush.svg"
                alt="Hidden Codex"
                width={200}
                height={48}
                className="h-8 w-auto"
                priority
                unoptimized
              />
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="rounded px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-bg-card-2 hover:text-ink"
              >
                Personagens
              </Link>
              <Link
                href="/worlds"
                className="rounded px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-bg-card-2 hover:text-ink"
              >
                Mundos
              </Link>
            </nav>
            <UserMenu
              email={user.email}
              displayName={user.displayName}
              avatarUrl={user.avatarUrl}
              isAdmin={isAdmin}
            />
          </div>
        </header>
        {children}
      </div>
    </ToastProvider>
  );
}
