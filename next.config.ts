import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone pour déploiement CapRover
  output: 'standalone',
  
  // Désactiver ESLint pendant le build pour CapRover
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
