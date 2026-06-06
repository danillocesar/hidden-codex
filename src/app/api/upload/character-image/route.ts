import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { saveImage } from '@/lib/storage';

const MAX_BYTES = 8 * 1024 * 1024;
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
  const characterId = form.get('characterId');
  const file = form.get('file');
  const label = form.get('label');

  if (typeof characterId !== 'string' || characterId.length === 0) {
    return NextResponse.json({ error: 'Campo "characterId" ausente.' }, { status: 400 });
  }

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

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });

  if (!character) {
    return NextResponse.json({ error: 'Ficha nao encontrada.' }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let processed: Buffer;
  try {
    // Preserva o aspecto original (só reduz pra um teto de 1600px). NÃO cropar
    // aqui: a mesma imagem serve capas (largas), cards de jutsu (retrato) e
    // fundo — cada contexto recorta via CSS (object-fit/position). Cropar pra
    // um banner fixo deixava artes verticais "tortas" nos cards.
    processed = await sharp(bytes)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Arquivo nao parece uma imagem valida.' }, { status: 400 });
  }

  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
  const saved = await saveImage({
    key: `characters/${character.id}/${filename}`,
    buffer: processed,
    contentType: 'image/webp',
  });

  const metadata = await sharp(processed).metadata();
  const image = await prisma.characterImage.create({
    data: {
      characterId: character.id,
      url: saved.url,
      storagePath: saved.key,
      fileName: file.name || filename,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      fileSizeBytes: processed.length,
      label: typeof label === 'string' && label.trim() ? label.trim().slice(0, 80) : null,
    },
    select: { id: true, url: true, label: true },
  });

  return NextResponse.json({ image });
}

export const runtime = 'nodejs';
