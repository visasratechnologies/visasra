import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    agentUpgrade: 'security',
  } as any,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/book-slot', destination: '/' },
      { source: '/bookslot', destination: '/' },
      { source: '/orders', destination: '/' },
      { source: '/cart', destination: '/' },
      { source: '/wallet', destination: '/' },
      { source: '/profile', destination: '/' },
      { source: '/categories', destination: '/' },
      { source: '/live-shopping', destination: '/' },
    ];
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
