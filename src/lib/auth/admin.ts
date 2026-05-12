/**
 * Helpers de admin check.
 *
 * Admin é **identidade**, não permissão de conta: um único e-mail listado em
 * `process.env.ADMIN_EMAIL` é tratado como admin. Player vs GM são capabilities
 * situacionais de mesa de campanha (modelo Campaign futuro) — não vivem aqui.
 *
 * Mantenha simples: comparação case-insensitive por igualdade.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin) return false;
  return email.trim().toLowerCase() === admin;
}

/**
 * `ALLOWED_EMAILS` vazio = login aberto. Quando preenchido (CSV), apenas e-mails
 * listados podem completar `loginWithGoogle`. Útil para travar acesso em
 * ambientes públicos sem ter que mudar código.
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ALLOWED_EMAILS?.trim();
  if (!raw) return true; // sem lista = aberto
  const allowed = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.includes(email.trim().toLowerCase());
}
