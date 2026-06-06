import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { isR2Configured, putR2Object, r2PublicUrl } from './r2';

/**
 * Fachada única de storage de imagens. As rotas de upload (`src/app/api/upload/*`)
 * só conhecem `saveImage` — a escolha entre Cloudflare R2 (produção) e filesystem
 * local (dev) acontece aqui, por presença das vars R2_*.
 *
 *   - Produção (Vercel): R2_* setadas → grava no bucket R2 e devolve a URL pública.
 *   - Dev local: sem R2_* → grava em `public/uploads/<key>`, servido pelo Next.
 *
 * `key` é o caminho lógico do objeto (ex.: "characters/<id>/<arquivo>.webp").
 */

export type SaveImageInput = {
  key: string;
  buffer: Buffer;
  contentType: string;
};

export type SavedImage = {
  /** URL pública pra exibir a imagem (absoluta no R2, relativa no local). */
  url: string;
  /** Caminho lógico do objeto — persistido em `storage_path` pra referência. */
  key: string;
};

export async function saveImage({ key, buffer, contentType }: SaveImageInput): Promise<SavedImage> {
  const normalizedKey = key.replace(/^\/+/, '');

  if (isR2Configured()) {
    await putR2Object(normalizedKey, buffer, contentType);
    return { url: r2PublicUrl(normalizedKey), key: normalizedKey };
  }

  const absolutePath = join(process.cwd(), 'public', 'uploads', normalizedKey);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { url: `/uploads/${normalizedKey}`, key: normalizedKey };
}
