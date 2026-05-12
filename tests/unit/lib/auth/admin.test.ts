import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isAdminEmail, isEmailAllowed } from '@/lib/auth/admin';

describe('admin — isAdminEmail', () => {
  const original = process.env.ADMIN_EMAIL;
  afterEach(() => {
    process.env.ADMIN_EMAIL = original;
  });

  it('false quando ADMIN_EMAIL não está definido', () => {
    delete process.env.ADMIN_EMAIL;
    expect(isAdminEmail('a@b.com')).toBe(false);
  });

  it('false quando ADMIN_EMAIL está vazio', () => {
    process.env.ADMIN_EMAIL = '';
    expect(isAdminEmail('a@b.com')).toBe(false);
  });

  it('compara case-insensitive', () => {
    process.env.ADMIN_EMAIL = 'Owner@Site.COM';
    expect(isAdminEmail('owner@site.com')).toBe(true);
    expect(isAdminEmail('OWNER@SITE.COM')).toBe(true);
  });

  it('false para outros emails', () => {
    process.env.ADMIN_EMAIL = 'owner@site.com';
    expect(isAdminEmail('other@site.com')).toBe(false);
  });

  it('false para email vazio/null/undefined', () => {
    process.env.ADMIN_EMAIL = 'owner@site.com';
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail('')).toBe(false);
  });
});

describe('admin — isEmailAllowed', () => {
  const original = process.env.ALLOWED_EMAILS;
  afterEach(() => {
    process.env.ALLOWED_EMAILS = original;
  });

  it('lista vazia = aberto (qualquer email passa)', () => {
    delete process.env.ALLOWED_EMAILS;
    expect(isEmailAllowed('a@b.com')).toBe(true);
    process.env.ALLOWED_EMAILS = '';
    expect(isEmailAllowed('a@b.com')).toBe(true);
  });

  it('CSV simples', () => {
    process.env.ALLOWED_EMAILS = 'a@b.com,c@d.com';
    expect(isEmailAllowed('a@b.com')).toBe(true);
    expect(isEmailAllowed('c@d.com')).toBe(true);
    expect(isEmailAllowed('x@y.com')).toBe(false);
  });

  it('ignora espaços e case', () => {
    process.env.ALLOWED_EMAILS = '  A@B.com , c@D.com ';
    expect(isEmailAllowed('a@b.com')).toBe(true);
    expect(isEmailAllowed('C@D.COM')).toBe(true);
  });

  it('email vazio sempre nega (mesmo lista aberta)', () => {
    delete process.env.ALLOWED_EMAILS;
    expect(isEmailAllowed('')).toBe(false);
    expect(isEmailAllowed(null)).toBe(false);
  });
});
