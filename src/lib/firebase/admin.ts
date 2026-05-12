import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK — server-only. Usado para:
 *   - verificar ID tokens enviados pelo client (validar identidade)
 *   - criar session cookies de longa duração
 *
 * Credenciais vêm de `.env.local` (server-side, sem prefixo `NEXT_PUBLIC_`).
 * A `FIREBASE_PRIVATE_KEY` chega como string com `\n` escapado — substituímos
 * por quebras reais antes de passar para o SDK.
 */

let cachedAdminApp: App | undefined;

function buildAdminApp(): App {
  if (getApps().length > 0) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Firebase Admin: variáveis FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY ausentes.',
    );
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminApp(): App {
  if (cachedAdminApp) return cachedAdminApp;
  cachedAdminApp = buildAdminApp();
  return cachedAdminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/** Verifica um ID token Firebase. Retorna o payload ou `null` se inválido. */
export async function verifyIdToken(idToken: string) {
  try {
    return await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}

/** Verifica um session cookie (criado via `createSessionCookie`). */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
