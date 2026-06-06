import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Cliente Cloudflare R2 (S3-compatível). Usado em produção para servir os
 * uploads de imagem — o filesystem da Vercel é efêmero, então não dá pra
 * gravar em `public/uploads` lá.
 *
 * Em dev local, se as vars R2_* não estiverem setadas, a fachada em
 * `./index.ts` cai de volta pro filesystem — este módulo nem é tocado.
 */

let cachedClient: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL,
  );
}

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  });
  return cachedClient;
}

export async function putR2Object(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET as string,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Imagens são imutáveis (nome único por upload) — cache agressivo.
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

export function r2PublicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL as string).replace(/\/+$/, '');
  return `${base}/${key.replace(/^\/+/, '')}`;
}
