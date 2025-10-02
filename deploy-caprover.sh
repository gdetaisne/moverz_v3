#!/bin/bash

# Script de déploiement CapRover avec configuration des variables d'environnement
# Usage: ./deploy-caprover.sh [app-name]

set -e

APP_NAME=${1:-"moverz-v3"}
echo "🚀 Déploiement sur CapRover pour l'app: $APP_NAME"

# Vérifier que caprover CLI est installé
if ! command -v caprover &> /dev/null; then
    echo "❌ CapRover CLI n'est pas installé"
    echo "   Installez-le avec: npm install -g caprover"
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env manquant"
    echo "   Créez-le avec: npm run setup:env"
    exit 1
fi

echo "📋 Configuration des variables d'environnement..."

# Lire le fichier .env et configurer les variables sur CapRover
while IFS='=' read -r key value; do
    # Ignorer les commentaires et lignes vides
    if [[ ! $key =~ ^[[:space:]]*# ]] && [[ -n $key ]]; then
        # Supprimer les espaces et guillemets
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs | sed 's/^"//;s/"$//')
        
        if [[ -n "$value" && "$value" != "your-*-key-here" && "$value" != "your-*-secret-here" ]]; then
            echo "   Configuring $key..."
            caprover env:set "$key=$value" -a "$APP_NAME" || echo "   ⚠️  Échec pour $key"
        else
            echo "   ⚠️  Skipping $key (valeur par défaut)"
        fi
    fi
done < .env

echo "🔨 Build et déploiement..."

# Build de l'application
npm run build

# Déploiement sur CapRover
caprover deploy -a "$APP_NAME"

echo "✅ Déploiement terminé !"
echo "🌐 Votre app est disponible sur: https://$APP_NAME.your-domain.com"

# Vérifier le statut
echo "🔍 Vérification du statut..."
caprover logs -a "$APP_NAME" --lines 10
