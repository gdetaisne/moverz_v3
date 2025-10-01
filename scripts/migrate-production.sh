#!/bin/bash
# Script de migration Prisma en production

set -e

echo "🚀 Démarrage des migrations Prisma..."

# Vérifier que CapRover CLI est installé
if ! command -v caprover &> /dev/null; then
    echo "❌ CapRover CLI n'est pas installé"
    echo "Installez-le avec: npm install -g caprover"
    exit 1
fi

# Nom de l'app CapRover
APP_NAME="${1:-moverz}"

echo "📦 App: $APP_NAME"

# Exécuter les migrations
echo "🔄 Exécution de: prisma migrate deploy..."
caprover exec --appName "$APP_NAME" --command "npx prisma migrate deploy"

echo "✅ Migrations terminées avec succès!"
