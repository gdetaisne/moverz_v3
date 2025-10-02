#!/bin/bash

# Script de déploiement avec correction des problèmes structurels
# Usage: ./deploy-fix.sh [app-name]

set -e

APP_NAME=${1:-"moverz-v3"}
echo "🔧 Déploiement avec corrections structurelles pour: $APP_NAME"

# Vérifier que caprover CLI est installé
if ! command -v caprover &> /dev/null; then
    echo "❌ CapRover CLI n'est pas installé"
    echo "   Installez-le avec: npm install -g caprover"
    exit 1
fi

echo "📋 Configuration des variables d'environnement pour CapRover..."

# Variables d'environnement pour la production
caprover env:set NODE_ENV=production -a "$APP_NAME"
caprover env:set PORT=3001 -a "$APP_NAME"
caprover env:set HOSTNAME=0.0.0.0 -a "$APP_NAME"

# Clés API (à configurer manuellement sur CapRover)
echo "⚠️  Configurez manuellement les variables suivantes sur CapRover:"
echo "   - OPENAI_API_KEY"
echo "   - CLAUDE_API_KEY"
echo "   - GOOGLE_CLOUD_PROJECT_ID"
echo "   - GOOGLE_APPLICATION_CREDENTIALS"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - AWS_REGION"
caprover env:set AWS_REGION="us-east-1" -a "$APP_NAME"

# Configuration de base
caprover env:set CORS_ORIGIN="https://$APP_NAME.gslv.cloud" -a "$APP_NAME"
caprover env:set JWT_SECRET="production-jwt-secret-key-$(date +%s)" -a "$APP_NAME"
caprover env:set JWT_EXPIRES_IN="7d" -a "$APP_NAME"

echo "🔨 Build et déploiement..."

# Build de l'application
npm run build

# Déploiement sur CapRover
caprover deploy -a "$APP_NAME"

echo "✅ Déploiement terminé !"
echo "🌐 Votre app est disponible sur: https://$APP_NAME.gslv.cloud"

# Vérifier le statut
echo "🔍 Vérification du statut..."
sleep 10
caprover logs -a "$APP_NAME" --lines 20

echo "🎉 Déploiement avec corrections structurelles terminé !"
