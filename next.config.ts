// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
  typescript: {
    ignoreBuildErrors: false, // Changed to false; resolve errors instead of ignoring them
  },
  eslint: {
    ignoreDuringBuilds: false, // Changed to false; fix ESLint issues during builds
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
  experimental: {
    serverActions: { bodyParser: true }, // Updated to object format as required
  },
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};

module.exports = {
  experimental: {
    serverActions: true, // Should be a boolean within an object
  },
};
module.exports = nextConfig;
