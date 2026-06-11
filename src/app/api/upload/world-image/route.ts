import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth/session';
import { saveImage } from '@/lib/storage';

/**
 * POST /api/upload/world-image
 *
 * Recebe multipart com `file`. Valida (tipo + tamanho), processa via sharp
 * (resize 800×1000 cover + reencode pra webp) e salva em
 * `public/uploads/worlds/<random>.webp`. Retorna `{ url }`.
 *
 * Formato 4:5 pra casar com o card de Mundo no dashboard (mesmo layout do
 * card de personagem). Requer sessao. NAO vincula a um worldId — o form sobe
 * a imagem antes de criar o Mundo; a URL viaja no submit.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
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
    return NextResponse.json({ error: 'Formato invalido. Use JPG, PNG ou WebP.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let processed: Buffer;
  try {
    const normalized = await sharp(bytes).rotate().withMetadata({ orientation: 1 }).toBuffer();
    processed = await sharp(normalized)
      .resize(800, 1000, { fit: 'cover', position: 'attention', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Arquivo nao parece uma imagem valida.' }, { status: 400 });
  }

  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
  const saved = await saveImage({
    key: `worlds/${filename}`,
    buffer: processed,
    contentType: 'image/webp',
  });

  return NextResponse.json({ url: saved.url });
}

export const runtime = 'nodejs';
