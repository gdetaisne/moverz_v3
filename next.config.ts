import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone pour déploiement CapRover
  output: 'standalone',
  
  // Désactiver ESLint pendant le build pour CapRover
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Headers pour permettre l'intégration iframe
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://moverz.fr https://*.moverz.fr https://www.moverz.fr https://moverz-bordeaux.gslv.cloud https://*.gslv.cloud; frame-src 'self' https://moverz.fr https://*.moverz.fr https://moverz-bordeaux.gslv.cloud https://*.gslv.cloud;",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
