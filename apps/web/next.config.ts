import type { NextConfig } from 'next';

const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH ?? '/api';
const apiProxyTarget = process.env.API_PROXY_TARGET;

if (!apiProxyTarget) {
  throw new Error('API_PROXY_TARGET is not set. Copy apps/web/.env.example to apps/web/.env.local (npm run env).');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: `${apiBasePath}/:path*`, destination: `${apiProxyTarget}/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
