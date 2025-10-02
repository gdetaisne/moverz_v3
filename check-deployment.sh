#!/bin/bash

# Script de vérification du déploiement
# Usage: ./check-deployment.sh [app-name]

set -e

APP_NAME=${1:-"moverz-v3"}
BASE_URL="https://$APP_NAME.gslv.cloud"

echo "🔍 Vérification du déploiement: $BASE_URL"

# Test de base
echo "1. Test de connectivité..."
if curl -s --max-time 10 "$BASE_URL" > /dev/null; then
    echo "   ✅ Site accessible"
else
    echo "   ❌ Site inaccessible"
    exit 1
fi

# Test des APIs
echo "2. Test des APIs..."

# Test API status
if curl -s --max-time 10 "$BASE_URL/api/ai-status" | grep -q "success"; then
    echo "   ✅ API AI Status fonctionne"
else
    echo "   ⚠️  API AI Status problème"
fi

# Test API projects
if curl -s --max-time 10 "$BASE_URL/api/projects" | grep -q "projects"; then
    echo "   ✅ API Projects fonctionne"
else
    echo "   ⚠️  API Projects problème"
fi

# Test de l'interface
echo "3. Test de l'interface..."
if curl -s --max-time 10 "$BASE_URL" | grep -q "Analyse IA"; then
    echo "   ✅ Interface web fonctionne"
else
    echo "   ⚠️  Interface web problème"
fi

echo "🎉 Vérification terminée !"
echo "🌐 Application: $BASE_URL"
