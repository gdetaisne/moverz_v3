// config/app.ts
// Configuration centralisée de l'application

import { z } from 'zod';

// Schéma de validation pour les variables d'environnement
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // APIs
  OPENAI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  
  // Cloud APIs
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_VISION_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  
  // Cache
  CACHE_TTL: z.string().transform(Number).default('300000'), // 5 minutes
  MAX_CACHE_SIZE: z.string().transform(Number).default('100'),
  
  // Performance
  MAX_CONCURRENT_ANALYSES: z.string().transform(Number).default('5'),
  REQUEST_TIMEOUT: z.string().transform(Number).default('30000'), // 30s
  
  // Image processing
  MAX_IMAGE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  IMAGE_QUALITY: z.string().transform(Number).default('85'),
  IMAGE_TARGET_SIZE: z.string().transform(Number).default('1024'),
});

// Configuration de l'application
export const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  
  // Serveur
  port: Number(process.env.PORT) || 3001,
  
  // APIs
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 2000,
    timeout: 30000
  },
  
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: 'claude-3-5-haiku-20241022',
    temperature: 0.2,
    maxTokens: 2000,
    timeout: 30000
  },
  
  // Cloud APIs
  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    apiKey: process.env.GOOGLE_VISION_API_KEY,
    enabled: !!(process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_VISION_API_KEY)
  },
  
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  },
  
  // Cache
  cache: {
    ttl: Number(process.env.CACHE_TTL) || 300000, // 5 minutes
    maxSize: Number(process.env.MAX_CACHE_SIZE) || 100,
    enabled: true
  },
  
  // Performance
  performance: {
    maxConcurrentAnalyses: Number(process.env.MAX_CONCURRENT_ANALYSES) || 5,
    requestTimeout: Number(process.env.REQUEST_TIMEOUT) || 30000,
    enableParallelProcessing: true
  },
  
  // Image processing
  image: {
    maxSize: Number(process.env.MAX_IMAGE_SIZE) || 10485760, // 10MB
    quality: Number(process.env.IMAGE_QUALITY) || 85,
    targetSize: Number(process.env.IMAGE_TARGET_SIZE) || 1024,
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxWidth: 2048,
    maxHeight: 2048
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    correlationId: true
  }
};

// Validation des variables d'environnement au démarrage
export function validateConfig(): void {
  try {
    envSchema.parse(process.env);
    console.log('✅ Configuration validée avec succès');
  } catch (error) {
    console.error('❌ Erreur de configuration:', error);
    if (config.isProd) {
      process.exit(1);
    }
  }
}

// Fonction utilitaire pour vérifier si une API est configurée
export function isApiConfigured(api: 'openai' | 'claude' | 'google' | 'aws'): boolean {
  switch (api) {
    case 'openai':
      return !!config.openai.apiKey;
    case 'claude':
      return !!config.claude.apiKey;
    case 'google':
      return config.google.enabled;
    case 'aws':
      return config.aws.enabled;
    default:
      return false;
  }
}

// Fonction pour obtenir la configuration d'une API
export function getApiConfig(api: 'openai' | 'claude') {
  switch (api) {
    case 'openai':
      return config.openai;
    case 'claude':
      return config.claude;
    default:
      throw new Error(`API non supportée: ${api}`);
  }
}


