import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Existing config options */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  /* New Server Actions configuration */
  experimental: {
    serverActions: true,
  },
  
  /* Environment variables configuration (optional but recommended) */
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  }
};

export default nextConfig;
