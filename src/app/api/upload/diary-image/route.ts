import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth/session';
import { saveImage } from '@/lib/storage';

/**
 * POST /api/upload/diary-image
 *
 * Imagens inline do editor de diário (BlockNote). Recebe multipart com `file`,
 * valida (tipo + tamanho), reencoda pra WebP PRESERVANDO o aspecto (sem crop —
 * o usuário posiciona/redimensiona a imagem no editor) com largura máxima de
 * 1600px, e salva em `public/uploads/diary/<random>.webp`. Retorna `{ url }`.
 *
 * Requer sessão (owner-only no sentido amplo: só logado sobe). Mesmo padrão do
 * upload de retrato — arquivos órfãos ficam no FS, limpeza fica pra quando virar
 * problema (MVP local).
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB (validado client + server)
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Content-Type deve ser multipart/form-data.' },
      { status: 400 },
    );
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" ausente.' }, { status: 400 });
  }

  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json(
      { error: 'Formato inválido. Use JPG, PNG, WebP ou GIF.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande (máx ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Endireita EXIF nos pixels, depois reencoda WebP preservando aspecto (sem
  // crop — diferente do retrato). `withoutEnlargement` não amplia imagens menores.
  let processed: Buffer;
  try {
    const normalized = await sharp(bytes)
      .rotate()
      .withMetadata({ orientation: 1 })
      .toBuffer();

    processed = await sharp(normalized)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Arquivo não parece uma imagem válida.' }, { status: 400 });
  }

  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
  const saved = await saveImage({
    key: `diary/${filename}`,
    buffer: processed,
    contentType: 'image/webp',
  });

  return NextResponse.json({ url: saved.url });
}

export const runtime = 'nodejs';
