import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/uploads/(.*)',
        destination: '/api/uploads/$1',
      },
    ];
  },
};

export default nextConfig;
