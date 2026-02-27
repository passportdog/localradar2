/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // TypeScript - allow builds with type errors
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint - allow builds with lint errors  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.mapbox.com',
      },
      {
        protocol: 'https',
        hostname: '*.florida.com',
      },
      {
        protocol: 'https',
        hostname: '*.fdot.gov',
      },
      {
        protocol: 'https',
        hostname: 'www.fdotmiamidad.com',
      },
    ],
    unoptimized: true, // For camera images
  },

  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/camera-proxy',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=5, stale-while-revalidate=10',
          },
        ],
      },
    ];
  },

  // Rewrites for API proxying if needed
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
