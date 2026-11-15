/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['3000-iokbvkkx6f3xhno4kr00g.e2b.app'],
  images: { unoptimized: true },
  async rewrites() {
    const apiOrigin = process.env.API_INTERNAL_URL || 'http://localhost:8000';
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};
module.exports = nextConfig;
