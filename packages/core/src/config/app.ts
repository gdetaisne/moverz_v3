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
  }
};

export function getApiConfig() {
  return {
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    }
  };
}
