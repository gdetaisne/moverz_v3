#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration des variables d\'environnement...\n');

// Template des variables d'environnement
const envTemplate = `# Configuration de base
NODE_ENV=development
PORT=3001

# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5432/demenagement_app"

# APIs IA - Remplacez par vos vraies clés
OPENAI_API_KEY=your-openai-key-here
CLAUDE_API_KEY=your-claude-key-here

# Google Cloud (optionnel)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_VISION_API_KEY=your-google-vision-key
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# AWS (optionnel)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Cache et performance
CACHE_TTL=300000
MAX_CACHE_SIZE=100
MAX_CONCURRENT_ANALYSES=5
REQUEST_TIMEOUT=30000

# Image processing
MAX_IMAGE_SIZE=10485760
IMAGE_TARGET_SIZE=1024

# Logging
LOG_LEVEL=info

# JWT (pour l'authentification)
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# AI Service (pour les tests)
AI_SERVICE_URL=http://localhost:8000
`;

// Vérifier si .env existe déjà
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  Le fichier .env existe déjà.');
  console.log('   Supprimez-le d\'abord si vous voulez le recréer.\n');
  process.exit(0);
}

// Créer le fichier .env
try {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Fichier .env créé avec succès !');
  console.log('📝 Éditez le fichier .env pour ajouter vos vraies clés API.\n');
  
  console.log('🔑 Variables à configurer :');
  console.log('   - OPENAI_API_KEY');
  console.log('   - CLAUDE_API_KEY');
  console.log('   - GOOGLE_VISION_API_KEY (optionnel)');
  console.log('   - AWS_ACCESS_KEY_ID (optionnel)');
  console.log('   - AWS_SECRET_ACCESS_KEY (optionnel)');
  console.log('   - DATABASE_URL (si différent)');
  
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier .env:', error.message);
  process.exit(1);
}
