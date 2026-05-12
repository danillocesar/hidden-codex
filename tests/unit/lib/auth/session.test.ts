import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cookieState: { value: string | null } = { value: null };
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) =>
      cookieState.value && name ? { name, value: cookieState.value } : undefined,
  }),
}));

const verifySessionCookie = vi.fn();
vi.mock('@/lib/firebase/admin', () => ({
  verifySessionCookie: (cookie: string) => verifySessionCookie(cookie),
}));

const findUnique = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (args: unknown) => findUnique(args),
    },
  },
}));

async function importSessionFresh() {
  // `getCurrentUser` é cacheado com React.cache — reimportar com módulo fresco
  // garante que cada teste tenha um cache vazio.
  vi.resetModules();
  return await import('@/lib/auth/session');
}

beforeEach(() => {
  cookieState.value = null;
  verifySessionCookie.mockReset();
  findUnique.mockReset();
});

afterEach(() => {
  delete process.env.ADMIN_EMAIL;
});

describe('getCurrentUser', () => {
  it('retorna null sem cookie', async () => {
    const { getCurrentUser } = await importSessionFresh();
    expect(await getCurrentUser()).toBeNull();
    expect(verifySessionCookie).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('retorna null quando cookie é inválido (verifySessionCookie devolve null)', async () => {
    cookieState.value = 'cookie-bad';
    verifySessionCookie.mockResolvedValue(null);
    const { getCurrentUser } = await importSessionFresh();
    expect(await getCurrentUser()).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('retorna null quando o usuário não existe no Postgres', async () => {
    cookieState.value = 'cookie-ok';
    verifySessionCookie.mockResolvedValue({ uid: 'uid-ghost' });
    findUnique.mockResolvedValue(null);
    const { getCurrentUser } = await importSessionFresh();
    expect(await getCurrentUser()).toBeNull();
  });

  it('retorna { user, isAdmin: false } para usuário não-admin', async () => {
    cookieState.value = 'cookie-ok';
    verifySessionCookie.mockResolvedValue({ uid: 'uid-1' });
    findUnique.mockResolvedValue({
      id: 'db-1',
      firebaseUid: 'uid-1',
      email: 'user@x.com',
      displayName: 'Player',
      avatarUrl: null,
    });
    process.env.ADMIN_EMAIL = 'owner@x.com';

    const { getCurrentUser } = await importSessionFresh();
    const session = await getCurrentUser();

    expect(session).not.toBeNull();
    expect(session!.user.email).toBe('user@x.com');
    expect(session!.isAdmin).toBe(false);
  });

  it('retorna isAdmin: true quando email === ADMIN_EMAIL (case-insensitive)', async () => {
    cookieState.value = 'cookie-ok';
    verifySessionCookie.mockResolvedValue({ uid: 'uid-admin' });
    findUnique.mockResolvedValue({
      id: 'db-admin',
      firebaseUid: 'uid-admin',
      email: 'Owner@X.com',
      displayName: 'Boss',
      avatarUrl: null,
    });
    process.env.ADMIN_EMAIL = 'owner@x.com';

    const { getCurrentUser } = await importSessionFresh();
    const session = await getCurrentUser();

    expect(session!.isAdmin).toBe(true);
  });
});
