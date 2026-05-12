import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

/**
 * Storage helper para a fase local (F0/F1). Salva arquivos no filesystem em
 * `public/uploads/<userId>/<characterId>/...` e retorna a URL pública servida
 * pelo Next (`/uploads/...`).
 *
 * Quando subir para cloud (Supabase Storage, Vercel Blob, S3, etc.), trocar
 * apenas a implementação por trás dessa fachada — `saveLocalFile` e
 * `buildPublicUrl` são as únicas APIs consumidas pelo resto do app.
 */

const UPLOADS_ROOT = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB — espelha o limite do client
const ACCEPTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export type SavedFile = {
  storagePath: string;
  publicUrl: string;
  fileName: string;
  size: number;
};

export type SaveFileInput = {
  userId: string;
  characterId: string;
  /** Sub-pasta opcional (ex: "hero", "banner"). */
  slot?: string;
  fileName: string;
  buffer: Buffer | Uint8Array;
};

export async function saveLocalFile(input: SaveFileInput): Promise<SavedFile> {
  const ext = extname(input.fileName).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.has(ext)) {
    throw new Error(`Extensão não suportada: ${ext}. Use PNG, JPG ou WebP.`);
  }

  const size = input.buffer.byteLength;
  if (size > MAX_FILE_BYTES) {
    throw new Error(`Arquivo excede o limite de ${MAX_FILE_BYTES / (1024 * 1024)} MB.`);
  }

  const slotPart = input.slot ? `${input.slot}-` : '';
  const uniqueName = `${slotPart}${randomUUID()}${ext}`;
  const relativePath = join(input.userId, input.characterId, uniqueName).replace(/\\/g, '/');
  const absolutePath = join(UPLOADS_ROOT, relativePath);

  await mkdir(join(UPLOADS_ROOT, input.userId, input.characterId), { recursive: true });
  await writeFile(absolutePath, input.buffer);

  return {
    storagePath: relativePath,
    publicUrl: `/uploads/${relativePath}`,
    fileName: uniqueName,
    size,
  };
}

export function buildPublicUrl(storagePath: string): string {
  return `/uploads/${storagePath.replace(/^\/+/, '')}`;
}

export const STORAGE_CONSTANTS = {
  maxFileBytes: MAX_FILE_BYTES,
  acceptedExtensions: Array.from(ACCEPTED_EXTENSIONS),
} as const;
