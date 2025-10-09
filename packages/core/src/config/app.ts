// App configuration
export const config = {
  app: {
    name: 'Moverz v3.1',
    version: '0.1.0',
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 2000,
    timeout: 30000
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-haiku-20241022',
    temperature: 0.2,
    maxTokens: 2000,
    timeout: 30000
  },
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
  }
};

export function getApiConfig() {
  return {
    claude: {
      apiKey: config.claude.apiKey
    },
    openai: {
      apiKey: config.openai.apiKey
    }
  };
}
