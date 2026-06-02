import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { UserMenu } from '@/components/auth/UserMenu';

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
    <div className="min-h-screen bg-bg-deep text-ink">
      <header className="relative z-20 border-b border-border bg-bg-paper/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="font-serif text-2xl font-light text-ink transition-colors hover:text-ice-bright"
          >
            Arcana <span className="italic text-ice-bright">Forge</span>
          </Link>
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
  );
}
