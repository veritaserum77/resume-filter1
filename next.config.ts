export default {
  typescript: {
    ignoreBuildErrors: false, // Resolve errors instead of ignoring them
  },
  eslint: {
    ignoreDuringBuilds: false, // Fix ESLint issues during builds
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
    serverActions: { bodyParser: true }, // Proper object format
  },
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};
