import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Support du basePath pour reverse proxy
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.BASE_PATH || '',
  
  // Mode standalone pour déploiement
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Désactiver ESLint et TypeScript pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimisations
  compress: true,
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  
  // Configuration webpack pour modules Node.js server-only
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externaliser les modules server-only pour éviter le bundling
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'commonjs canvas',
        'pdfkit': 'commonjs pdfkit',
        'blob-stream': 'commonjs blob-stream',
        'bullmq': 'commonjs bullmq',
        'ioredis': 'commonjs ioredis',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner': 'commonjs @aws-sdk/s3-request-presigner',
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


