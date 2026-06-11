// Hostname público do bucket R2 (produção). Em dev local as imagens são
// servidas de /uploads pelo próprio Next, sem precisar de remotePattern.
const r2Host = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Avatares do Google (Firebase Auth retorna URLs lh3.googleusercontent.com).
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Cloud storage (Cloudflare R2) para imagens de personagem/diário.
      ...(r2Host ? [{ protocol: 'https', hostname: r2Host }] : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
