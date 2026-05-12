import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────
// Cookies — captura set/delete chamadas; get devolve valor controlado.
const cookieState: { value: string | null } = { value: null };
const cookieSet = vi.fn<(name: string, value: string, options?: unknown) => void>();
const cookieDelete = vi.fn<(name: string) => void>();
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) =>
      cookieState.value && name ? { name, value: cookieState.value } : undefined,
    set: cookieSet,
    delete: cookieDelete,
  }),
}));

// Firebase Admin — mock retornando uma "auth" controlável.
const verifyIdToken = vi.fn();
const createSessionCookie = vi.fn();
const revokeRefreshTokens = vi.fn();
const verifySessionCookie = vi.fn();
vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: () => ({
    verifyIdToken,
    createSessionCookie,
    revokeRefreshTokens,
  }),
  verifySessionCookie: (cookie: string) => verifySessionCookie(cookie),
  verifyIdToken: (token: string) => verifyIdToken(token),
}));

// Prisma — só `user.upsert` e `user.findUnique` são tocados.
const upsert = vi.fn();
const findUnique = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: (args: unknown) => upsert(args),
      findUnique: (args: unknown) => findUnique(args),
    },
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────
const VALID_TOKEN = 'x'.repeat(120); // passa o schema Zod (min 20)

async function importActions() {
  return await import('@/lib/auth/actions');
}

// ── Setup ─────────────────────────────────────────────────────────────
beforeEach(() => {
  cookieState.value = null;
  cookieSet.mockReset();
  cookieDelete.mockReset();
  verifyIdToken.mockReset();
  createSessionCookie.mockReset();
  revokeRefreshTokens.mockReset();
  verifySessionCookie.mockReset();
  upsert.mockReset();
  findUnique.mockReset();
});

afterEach(() => {
  delete process.env.ALLOWED_EMAILS;
});

// ── Tests ─────────────────────────────────────────────────────────────

describe('loginWithGoogle', () => {
  it('cria User novo, faz upsert e seta cookie', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'uid-1',
      email: 'novo@example.com',
      name: 'Novo Shinobi',
      picture: 'https://x/photo.png',
    });
    createSessionCookie.mockResolvedValue('cookie-value-123');
    upsert.mockResolvedValue({ id: 'db-id', firebaseUid: 'uid-1' });

    const { loginWithGoogle } = await importActions();
    const result = await loginWithGoogle(VALID_TOKEN);

    expect(result).toEqual({ ok: true, redirectTo: '/dashboard' });
    expect(verifyIdToken).toHaveBeenCalledWith(VALID_TOKEN);
    expect(upsert).toHaveBeenCalledTimes(1);
    const upsertArg = upsert.mock.calls[0]![0] as {
      where: { firebaseUid: string };
      create: { email: string; displayName: string | null; avatarUrl: string | null };
      update: { email: string; displayName: string | null; avatarUrl: string | null };
    };
    expect(upsertArg.where.firebaseUid).toBe('uid-1');
    expect(upsertArg.create.email).toBe('novo@example.com');
    expect(upsertArg.create.displayName).toBe('Novo Shinobi');
    expect(upsertArg.create.avatarUrl).toBe('https://x/photo.png');
    expect(upsertArg.update.email).toBe('novo@example.com');

    expect(createSessionCookie).toHaveBeenCalledWith(
      VALID_TOKEN,
      expect.objectContaining({ expiresIn: expect.any(Number) }),
    );
    expect(cookieSet).toHaveBeenCalledWith(
      'arcana_session',
      'cookie-value-123',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });

  it('atualiza User existente (mesmo upsert)', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'uid-1',
      email: 'mesmo@example.com',
      name: 'Nome Atualizado',
      picture: 'https://x/nova-foto.png',
    });
    createSessionCookie.mockResolvedValue('cookie-value-x');
    upsert.mockResolvedValue({ id: 'db-id' });

    const { loginWithGoogle } = await importActions();
    const result = await loginWithGoogle(VALID_TOKEN);

    expect(result.ok).toBe(true);
    const upsertArg = upsert.mock.calls[0]![0] as {
      update: { email: string; displayName: string | null; avatarUrl: string | null };
    };
    expect(upsertArg.update.email).toBe('mesmo@example.com');
    expect(upsertArg.update.displayName).toBe('Nome Atualizado');
    expect(upsertArg.update.avatarUrl).toBe('https://x/nova-foto.png');
  });

  it('rejeita email fora de ALLOWED_EMAILS', async () => {
    process.env.ALLOWED_EMAILS = 'allowed@x.com,other@x.com';
    verifyIdToken.mockResolvedValue({
      uid: 'uid-9',
      email: 'intruder@x.com',
      name: 'Intruder',
    });

    const { loginWithGoogle } = await importActions();
    const result = await loginWithGoogle(VALID_TOKEN);

    expect(result).toEqual({ ok: false, error: 'Acesso não autorizado.' });
    expect(upsert).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('aceita email dentro de ALLOWED_EMAILS', async () => {
    process.env.ALLOWED_EMAILS = 'allowed@x.com';
    verifyIdToken.mockResolvedValue({
      uid: 'uid-9',
      email: 'allowed@x.com',
      name: 'OK',
    });
    createSessionCookie.mockResolvedValue('cookie-ok');
    upsert.mockResolvedValue({ id: 'db' });

    const { loginWithGoogle } = await importActions();
    const result = await loginWithGoogle(VALID_TOKEN);

    expect(result.ok).toBe(true);
    expect(upsert).toHaveBeenCalled();
  });

  it('rejeita idToken inválido pelo schema (muito curto)', async () => {
    const { loginWithGoogle } = await importActions();
    const result = await loginWithGoogle('curto');

    expect(result).toEqual({ ok: false, error: 'Token inválido.' });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejeita quando verifyIdToken throws', async () => {
    verifyIdToken.mockRejectedValue(new Error('jwt expired'));

    const { loginWithGoogle } = await importActions();
    const result = await loginWithGoogle(VALID_TOKEN);

    expect(result).toEqual({ ok: false, error: 'Token inválido.' });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejeita quando o token não tem email', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'no-email-uid' });

    const { loginWithGoogle } = await importActions();
    const result = await loginWithGoogle(VALID_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/e-mail/i);
  });

  it('falha graciosamente se createSessionCookie throw', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u', email: 'a@b.com', name: 'A' });
    createSessionCookie.mockRejectedValue(new Error('firebase down'));
    upsert.mockResolvedValue({ id: 'x' });

    const { loginWithGoogle } = await importActions();
    const result = await loginWithGoogle(VALID_TOKEN);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sessão/i);
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('revoga refresh tokens e deleta cookie quando sessão é válida', async () => {
    cookieState.value = 'session-cookie-abc';
    verifySessionCookie.mockResolvedValue({ uid: 'uid-1' });
    revokeRefreshTokens.mockResolvedValue(undefined);

    const { logout } = await importActions();
    const result = await logout();

    expect(result).toEqual({ redirectTo: '/login' });
    expect(revokeRefreshTokens).toHaveBeenCalledWith('uid-1');
    expect(cookieDelete).toHaveBeenCalledWith('arcana_session');
  });

  it('deleta cookie mesmo sem sessão válida', async () => {
    cookieState.value = null;

    const { logout } = await importActions();
    const result = await logout();

    expect(result).toEqual({ redirectTo: '/login' });
    expect(verifySessionCookie).not.toHaveBeenCalled();
    expect(revokeRefreshTokens).not.toHaveBeenCalled();
    expect(cookieDelete).toHaveBeenCalledWith('arcana_session');
  });

  it('continua bem-sucedido se revokeRefreshTokens throw', async () => {
    cookieState.value = 'session-cookie-abc';
    verifySessionCookie.mockResolvedValue({ uid: 'uid-1' });
    revokeRefreshTokens.mockRejectedValue(new Error('firebase down'));

    const { logout } = await importActions();
    const result = await logout();

    expect(result).toEqual({ redirectTo: '/login' });
    expect(cookieDelete).toHaveBeenCalledWith('arcana_session');
  });
});
