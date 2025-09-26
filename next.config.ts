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
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.moverz.fr https://moverz.fr",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
