import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PUBLIC_PREFIX = '/uploads/characters';

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
    processed = await sharp(bytes)
      .rotate()
      .resize(1600, 700, { fit: 'cover', position: 'attention' })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Arquivo nao parece uma imagem valida.' }, { status: 400 });
  }

  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
  const targetDir = path.join(process.cwd(), 'public', 'uploads', 'characters', character.id);
  await mkdir(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, filename);
  await writeFile(targetPath, processed);

  const metadata = await sharp(processed).metadata();
  const url = `${PUBLIC_PREFIX}/${character.id}/${filename}`;
  const image = await prisma.characterImage.create({
    data: {
      characterId: character.id,
      url,
      storagePath: targetPath,
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
