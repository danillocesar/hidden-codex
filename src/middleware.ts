import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth gate leve.
 *
 * Rodando no Edge runtime, **não podemos usar `firebase-admin`** (depende de
 * Node APIs). A verificação criptográfica completa do cookie acontece em
 * Server Components (via `getCurrentUser()`) — aqui só checamos presença e
 * formato razoável do cookie para fazer o redirect cedo.
 *
 * Isto é seguro porque ninguém acessa dados sensíveis sem passar por um
 * Server Component que invoca `getCurrentUser()` (que faz `verifySessionCookie`
 * real). O middleware é puro UX (evita pull desnecessário até o redirect do
 * layout `(app)`).
 *
 * Comportamento:
 *   - Rotas autenticadas sem cookie → `/login?from=<path>`
 *   - `/login` com cookie presente → `/dashboard` (UX, não invalida nada)
 *   - Demais rotas passam direto.
 */

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME?.trim() || 'arcana_session';

// Heurística de "cookie razoável": Firebase session cookies são JWTs com >= 100
// chars normalmente. Não validamos assinatura — só descartamos lixo óbvio.
function hasSessionCookie(req: NextRequest): boolean {
  const value = req.cookies.get(COOKIE_NAME)?.value;
  return typeof value === 'string' && value.length >= 50;
}

const PUBLIC_PREFIXES = ['/login', '/api/auth', '/_next', '/share'];
const PUBLIC_PATHS: ReadonlySet<string> = new Set(['/', '/favicon.ico']);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;
  const isAuthed = hasSessionCookie(req);

  // Já logado e tentando ver /login → vai pro dashboard.
  if (pathname === '/login' && isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Rotas públicas passam.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Privadas sem cookie → /login com retorno.
  if (!isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?from=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Bate em tudo exceto assets estáticos comuns. A lógica interna trata o resto.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.[\\w]+$).*)'],
};
