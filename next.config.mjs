/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Avatares do Google (Firebase Auth retorna URLs lh3.googleusercontent.com).
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Future: cloud storage para imagens de personagem. Local filesystem em
      // public/uploads é servido pelo Next direto, sem config extra.
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
