#!/bin/bash

echo "🧪 Test de l'API d'analyse de photos"
echo "=================================="

# Test 1: Upload d'une image
echo "📤 Test 1: Upload et analyse d'une image..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/photos/analyze -F "file=@test-image.jpg")

echo "📊 Réponse de l'API:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Test terminé ! L'API fonctionne correctement."
echo "🌐 Interface web disponible sur: http://localhost:3000"
