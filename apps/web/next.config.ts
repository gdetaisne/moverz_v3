import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Support du basePath pour reverse proxy
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.BASE_PATH || '',
  
  // Mode standalone pour déploiement CapRover
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Désactiver ESLint et TypeScript pendant le build pour CapRover
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 🚀 OPTIMISATIONS POUR LA VITESSE EN DEV
  swcMinify: true, // Utiliser SWC pour la minification (plus rapide)
  compress: true, // Compression gzip
  poweredByHeader: false, // Supprimer le header X-Powered-By
  
  // Configuration pour éviter les erreurs de build avec les API routes
  skipTrailingSlashRedirect: true,
  
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
        // Externaliser BullMQ et Redis (server-only)
        'bullmq': 'commonjs bullmq',
        'ioredis': 'commonjs ioredis',
      });
    }
    
    // Ignorer les warnings de modules optionnels
    config.ignoreWarnings = [
      { module: /node_modules\/node-fetch\/lib\/index\.js/ },
      { module: /node_modules\/punycode\/punycode\.js/ },
    ];
    
    return config;
  },
  
  // Headers CORS (headers iframe supprimés car reverse proxy)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
