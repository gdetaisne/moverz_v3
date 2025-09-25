#!/bin/bash

# Script de test pour vérifier le build Docker
echo "🔨 Test du build Docker pour CapRover..."

# Build de l'image Docker
echo "Building Docker image..."
docker build -t movers-v3-test .

if [ $? -eq 0 ]; then
    echo "✅ Build Docker réussi !"
    
    # Test du container
    echo "🧪 Test du container..."
    docker run --rm -p 3001:80 -e OPENAI_API_KEY=test-key movers-v3-test &
    CONTAINER_PID=$!
    
    # Attendre que le container démarre
    sleep 5
    
    # Test de l'endpoint
    curl -f http://localhost:3001/ > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Container fonctionne correctement !"
    else
        echo "❌ Container ne répond pas"
    fi
    
    # Arrêter le container
    kill $CONTAINER_PID 2>/dev/null
    
else
    echo "❌ Build Docker échoué !"
    exit 1
fi

echo "🎉 Test terminé !"
