import { cookies } from 'next/headers';
import { verifySessionCookie } from '../firebase/admin';
import { prisma } from '../prisma';
import { isAdminEmail } from './admin';

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME?.trim() || 'arcana_session';

function readMaxAgeDays(): number {
  const raw = process.env.SESSION_MAX_AGE_DAYS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
}

export const SESSION_MAX_AGE_DAYS = readMaxAgeDays();
export const SESSION_MAX_AGE_S = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_S * 1000;

export type SessionUser = {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type Session = {
  user: SessionUser;
  isAdmin: boolean;
};

/**
 * Lê o cookie de sessão, valida com Firebase Admin e devolve o `User` do banco
 * mais um flag `isAdmin` (compara `email` com `process.env.ADMIN_EMAIL`).
 *
 * Retorna `null` se cookie ausente, inválido ou usuário não encontrado.
 *
 * Nota: chamado várias vezes no mesmo request (layout + page) faz cookie verify
 * + query no Postgres redundantes. Quando isso virar gargalo, dá pra wrapear
 * em `React.cache` — não fizemos isso ainda porque react@18.3 trata `cache`
 * como experimental e o import quebra em vitest puro Node.
 */
export async function getCurrentUser(): Promise<Session | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  const decoded = await verifySessionCookie(sessionCookie);
  if (!decoded) return null;

  const user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
    select: {
      id: true,
      firebaseUid: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  });
  if (!user) return null;

  return {
    user,
    isAdmin: isAdminEmail(user.email),
  };
}
