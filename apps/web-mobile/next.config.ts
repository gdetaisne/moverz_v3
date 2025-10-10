import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export static pour servir via nginx
  output: 'export',
  
  // Pas de trailing slash
  trailingSlash: false,
  
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
  
  // Images optimization désactivée pour export static
  images: {
    unoptimized: true,
  },
  
  // Base path pour mobile
  basePath: '',
};

export default nextConfig;

