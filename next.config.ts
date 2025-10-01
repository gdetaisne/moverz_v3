import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone pour déploiement CapRover
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Désactiver ESLint pendant le build pour CapRover
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuration webpack pour PDFKit et modules Node.js
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configuration pour les modules Node.js utilisés par PDFKit
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'commonjs canvas',
        // Externaliser PDFKit pour qu'il utilise directement node_modules
        'pdfkit': 'commonjs pdfkit',
        'blob-stream': 'commonjs blob-stream',
      });
    }
    
    // Ignorer les warnings de modules optionnels
    config.ignoreWarnings = [
      { module: /node_modules\/node-fetch\/lib\/index\.js/ },
      { module: /node_modules\/punycode\/punycode\.js/ },
    ];
    
    return config;
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
