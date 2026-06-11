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
  const base = process.env.R2_PUBLIC_URL;
  return base ? base.replace(/\/+$/, '') : null;
}

/** True se `url` é um upload nosso dentro da pasta lógica `folder` (ex.: "portraits"). */
export function isUploadedUrlUnder(url: string, folder: string): boolean {
  if (url.startsWith(`/uploads/${folder}/`)) return true;
  const base = r2PublicBase();
  return base ? url.startsWith(`${base}/${folder}/`) : false;
}
