#!/bin/bash
# Script de test pour /api/photos/analyze-by-room
# Usage: ./test-analyze-by-room.sh [USER_ID]

set -e

USER_ID="${1:-test-user-$(date +%s)}"
BASE_URL="http://localhost:3001"

echo "🧪 Test de la route /api/photos/analyze-by-room"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 User ID: $USER_ID"
echo ""

# Test 1: Vérifier que la route existe (HEAD/GET doit donner 405, pas 404)
echo "📍 Test 1: Vérification existence de la route..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/photos/analyze-by-room")
if [ "$STATUS" = "405" ]; then
  echo "✅ Route existe (405 Method Not Allowed pour GET)"
elif [ "$STATUS" = "404" ]; then
  echo "❌ ÉCHEC: Route retourne 404"
  exit 1
else
  echo "⚠️  Status inattendu: $STATUS"
fi
echo ""

# Test 2: POST avec payload vide (doit retourner 400 ou 404 avec message d'erreur)
echo "📍 Test 2: POST avec payload vide..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/photos/analyze-by-room" \
  -H "content-type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{"roomType":"salon","photoIds":[]}')

if echo "$RESPONSE" | grep -q "No photos found"; then
  echo "✅ Route fonctionne (erreur métier attendue)"
  echo "   Response: $RESPONSE"
else
  echo "❌ ÉCHEC: Response inattendue"
  echo "   Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 3: Vérifier les photos existantes
echo "📍 Test 3: Récupération des photos existantes..."
PHOTOS=$(curl -s "$BASE_URL/api/photos" -H "x-user-id: $USER_ID")
PHOTO_COUNT=$(echo "$PHOTOS" | jq -r 'length' 2>/dev/null || echo "0")

if [ "$PHOTO_COUNT" = "0" ]; then
  echo "ℹ️  Aucune photo en base pour cet utilisateur"
  echo "   Pour tester avec des photos réelles:"
  echo "   1. Uploader des photos via l'UI"
  echo "   2. Relancer: ./test-analyze-by-room.sh $USER_ID"
  echo ""
  echo "🎯 Tests de base réussis ✅"
  exit 0
fi

echo "✅ $PHOTO_COUNT photo(s) trouvée(s)"

# Récupérer les 2 premiers IDs
PHOTO_IDS=$(echo "$PHOTOS" | jq -r '.[0:2] | .[].id' 2>/dev/null | tr '\n' ',' | sed 's/,$//')
if [ -z "$PHOTO_IDS" ]; then
  echo "⚠️  Impossible d'extraire les IDs des photos"
  exit 0
fi

echo "   IDs: $PHOTO_IDS"
echo ""

# Test 4: Analyse réelle avec photos
echo "📍 Test 4: Analyse avec photos réelles..."
JSON_IDS=$(echo "$PHOTO_IDS" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')
ANALYSIS=$(curl -s -X POST "$BASE_URL/api/photos/analyze-by-room" \
  -H "content-type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d "{\"roomType\":\"salon\",\"photoIds\":[$JSON_IDS]}")

if echo "$ANALYSIS" | jq -e '.items' > /dev/null 2>&1; then
  ITEM_COUNT=$(echo "$ANALYSIS" | jq -r '.items | length')
  echo "✅ Analyse réussie"
  echo "   Objets détectés: $ITEM_COUNT"
  echo "   Temps: $(echo "$ANALYSIS" | jq -r '.processingTime')ms"
  echo ""
  echo "📦 Premiers objets détectés:"
  echo "$ANALYSIS" | jq -r '.items[0:3] | .[] | "   - \(.label) (x\(.quantity))"'
elif echo "$ANALYSIS" | jq -e '.error' > /dev/null 2>&1; then
  ERROR=$(echo "$ANALYSIS" | jq -r '.error')
  echo "❌ Erreur lors de l'analyse: $ERROR"
  echo ""
  echo "🔍 Debug info:"
  echo "$ANALYSIS" | jq .
  exit 1
else
  echo "❌ Response invalide"
  echo "$ANALYSIS"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Tous les tests sont réussis !"


