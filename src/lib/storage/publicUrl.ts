/**
 * Reconhecimento de URLs de imagem produzidas pelos nossos uploads — vale tanto
 * pro filesystem local (dev, prefixo `/uploads/<pasta>/`) quanto pro Cloudflare
 * R2 (prod, `<R2_PUBLIC_URL>/<pasta>/`).
 *
 * Módulo SEM dependências de node (ao contrário de `./index.ts`, que usa fs) —
 * pode ser importado por libs compartilhadas e validadores que rodam no server.
 * No client, `R2_PUBLIC_URL` não está disponível e a checagem de R2 retorna
 * false; tudo bem, pois a validação acontece no server.
 */

function r2PublicBase(): string | null {
  // `NEXT_PUBLIC_*` é inlinado no bundle do client (schemas Zod compartilhados
  // validam no browser). `R2_PUBLIC_URL` é o fallback server-only. Os dois têm
  // o mesmo valor — a base pública do bucket não é segredo.
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;
  return base ? base.replace(/\/+$/, '') : null;
}

/** True se `url` é um upload nosso dentro da pasta lógica `folder` (ex.: "portraits"). */
export function isUploadedUrlUnder(url: string, folder: string): boolean {
  if (url.startsWith(`/uploads/${folder}/`)) return true;
  const base = r2PublicBase();
  return base ? url.startsWith(`${base}/${folder}/`) : false;
}

/** True se `url` é um upload nosso em qualquer pasta (local `/uploads/` ou R2). */
export function isUploadedImageUrl(url: string): boolean {
  if (url.startsWith('/uploads/')) return true;
  const base = r2PublicBase();
  return base ? url.startsWith(`${base}/`) : false;
}
