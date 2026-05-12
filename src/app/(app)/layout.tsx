import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Layout das rotas autenticadas. Em F0 a sessão real não existe ainda — então
 * qualquer acesso a `(app)/*` é redirecionado pra `/login`. Quando F1 implementar
 * o cookie e o middleware, este layout passa a renderizar a navbar + children.
 *
 * Mantemos o file aqui para que a estrutura de rotas já espelhe a arquitetura
 * documentada em `02-ARCHITECTURE.md`.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <div className="min-h-screen bg-bg-deep text-ink">{children}</div>;
}
