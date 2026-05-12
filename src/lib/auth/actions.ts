'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth, verifySessionCookie } from '../firebase/admin';
import { prisma } from '../prisma';
import { isEmailAllowed } from './admin';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS, SESSION_MAX_AGE_S } from './session';

export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

const idTokenSchema = z.string().min(20).max(8192);

/**
 * Server Action — recebe o `idToken` que o Firebase Client obteve via
 * `signInWithPopup(GoogleAuthProvider)`, valida server-side, upserta o User
 * no Postgres e cria o session cookie httpOnly.
 *
 * Mensagens de erro são intencionalmente genéricas pra não vazar detalhes
 * (ex.: token expirado vs. assinatura inválida vs. lista de allow).
 */
export async function loginWithGoogle(idToken: unknown): Promise<LoginResult> {
  const parsed = idTokenSchema.safeParse(idToken);
  if (!parsed.success) {
    return { ok: false, error: 'Token inválido.' };
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await getAdminAuth().verifyIdToken(parsed.data);
  } catch {
    return { ok: false, error: 'Token inválido.' };
  }

  const email = decoded.email ?? null;
  if (!email) {
    return { ok: false, error: 'A conta Google não expôs e-mail.' };
  }

  if (!isEmailAllowed(email)) {
    return { ok: false, error: 'Acesso não autorizado.' };
  }

  // Upsert do User — mantém dados em sync com o Google a cada login.
  await prisma.user.upsert({
    where: { firebaseUid: decoded.uid },
    create: {
      firebaseUid: decoded.uid,
      email,
      displayName: decoded.name ?? null,
      avatarUrl: decoded.picture ?? null,
    },
    update: {
      email,
      displayName: decoded.name ?? null,
      avatarUrl: decoded.picture ?? null,
    },
  });

  // Session cookie de longa duração — Firebase recomenda criar via
  // createSessionCookie ao invés de armazenar o idToken cru (que vive 1h).
  let sessionCookie: string;
  try {
    sessionCookie = await getAdminAuth().createSessionCookie(parsed.data, {
      expiresIn: SESSION_MAX_AGE_MS,
    });
  } catch {
    return { ok: false, error: 'Não foi possível iniciar a sessão.' };
  }

  cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
  });

  return { ok: true, redirectTo: '/dashboard' };
}

export type LogoutResult = { redirectTo: string };

/**
 * Server Action — revoga os refresh tokens do usuário no Firebase (invalida
 * o cookie de sessão imediatamente em todas as tabs/devices) e limpa o
 * cookie local.
 *
 * Continua bem-sucedido mesmo se a verificação falhar — o objetivo é que o
 * client fique deslogado ao final.
 */
export async function logout(): Promise<LogoutResult> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    const decoded = await verifySessionCookie(sessionCookie);
    if (decoded) {
      try {
        await getAdminAuth().revokeRefreshTokens(decoded.uid);
      } catch {
        // ignora — limpar cookie local é o que importa
      }
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return { redirectTo: '/login' };
}
