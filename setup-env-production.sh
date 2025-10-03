#!/bin/bash

# Script de configuration des variables d'environnement pour la production
# Usage: ./setup-env-production.sh

echo "🔧 Configuration des variables d'environnement pour la production..."

# Créer le fichier .env.local
cat > .env.local << EOF
# Configuration des services IA
OPENAI_API_KEY=your-openai-api-key-here
CLAUDE_API_KEY=your-claude-api-key-here

# Configuration Google Cloud Vision
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id",...}

# Configuration AWS Rekognition
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Configuration serveur
NODE_ENV=development
PORT=3001
HOSTNAME=0.0.0.0
CORS_ORIGIN=http://localhost:3001

# Configuration JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Configuration cache
CACHE_TTL=300000
MAX_CACHE_SIZE=100
MAX_CONCURRENT_ANALYSES=5
REQUEST_TIMEOUT=30000

# Configuration images
MAX_IMAGE_SIZE=10485760
IMAGE_TARGET_SIZE=1024
LOG_LEVEL=info

# Configuration sécurité
CSP_FRAME_ANCESTORS=self' https://moverz.fr https://*.moverz.fr https://www.moverz.fr https://moverz-bordeaux.gslv.cloud https://*.gslv.cloud https://www.bordeaux-demenageur.fr https://bordeaux-demenageur.fr http://localhost:3000 http://localhost:3001 http://localhost:3002 https://localhost:3000 https://localhost:3001 https://localhost:3002
X_FRAME_OPTIONS=ALLOWALL
EOF

echo "✅ Fichier .env.local créé avec succès"
echo "⚠️  N'oubliez pas de remplacer les valeurs 'your-*-key-here' par vos vraies clés API"
echo "🔧 Redémarrage de l'application..."

# Redémarrer l'application
pkill -f "next dev" 2>/dev/null || true
sleep 2
npm run dev &

echo "✅ Application redémarrée avec la configuration complète"
echo "🌐 Accédez à http://localhost:3001"