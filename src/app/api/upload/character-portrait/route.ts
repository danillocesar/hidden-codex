import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * POST /api/upload/character-portrait
 *
 * Recebe multipart com `file`. Valida (tipo + tamanho), processa via sharp
 * (resize 600×900 max + reencode pra webp) e salva em
 * `public/uploads/portraits/<random>.webp`. Retorna `{ url }` com path
 * relativo servido estaticamente pelo Next.
 *
 * Requer sessao. NAO vincula a um characterId — o wizard sobe a foto antes
 * de criar o personagem; o URL viaja no submit pra entrar no `portraitUrl`
 * do Character. Arquivos orfaos (upload + cancel) ficam no FS — limpeza
 * eventual entra quando virar problema (probably never no MVP local).
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB (validado client + server)
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TARGET_DIR = path.join(process.cwd(), 'public', 'uploads', 'portraits');
const PUBLIC_PREFIX = '/uploads/portraits';

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
    return NextResponse.json(
      { error: 'Formato invalido. Use JPG, PNG ou WebP.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Pipeline em DUAS etapas pra evitar bug de EXIF + smart-crop:
  //   1. Aplica EXIF orientation FISICAMENTE nos pixels e tira o tag
  //      (`withMetadata({ orientation: 1 })`). Sem isso, fotos de celular
  //      com Orientation=6/8 saem rotacionadas porque webp perde EXIF e o
  //      browser nao tem como rebalancear.
  //   2. Re-le o buffer ja "endireitado" e faz resize 600×900 com fit:
  //      'cover' + position: 'top' (rostos ficam no terço superior — mesmo
  //      crop do `<img object-[center_20%]>` da ficha). Sem `attention`:
  //      cropping deterministico, sem surpresas.
  let processed: Buffer;
  try {
    const normalized = await sharp(bytes)
      .rotate()
      .withMetadata({ orientation: 1 })
      .toBuffer();

    processed = await sharp(normalized)
      .resize(600, 900, { fit: 'cover', position: 'top', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: 'Arquivo nao parece uma imagem valida.' },
      { status: 400 },
    );
  }

  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
  const targetPath = path.join(TARGET_DIR, filename);
  await writeFile(targetPath, processed);

  return NextResponse.json({ url: `${PUBLIC_PREFIX}/${filename}` });
}

export const runtime = 'nodejs';
