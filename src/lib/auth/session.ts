import { cookies } from 'next/headers';
import { verifySessionCookie } from '../firebase/admin';
import { prisma } from '../prisma';

export const SESSION_COOKIE_NAME = 'arcana_session';
/** 5 dias — Firebase session cookies têm validade máxima de 2 semanas. */
export const SESSION_COOKIE_MAX_AGE_S = 60 * 60 * 24 * 5;

export type SessionUser = {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/**
 * Lê o cookie de sessão, valida com Firebase Admin e devolve o `User` do banco.
 * Retorna `null` se ausente ou inválido — pages devem usar `redirect('/login')`
 * nesse caso.
 *
 * Implementação real de criação de cookie + middleware fica em F1.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
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
  return user;
}
