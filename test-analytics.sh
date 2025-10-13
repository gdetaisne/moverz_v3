#!/bin/bash

echo "📊 Test Analytics Dashboard"
echo ""
echo "🔄 Démarrage serveur en arrière-plan..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Attendre que le serveur démarre
echo "⏳ Attente du serveur (10 sec)..."
sleep 10

echo ""
echo "📈 Récupération des métriques..."
echo ""

curl -s http://localhost:3000/api/analytics/dashboard | jq '.' || curl -s http://localhost:3000/api/analytics/dashboard

echo ""
echo ""
echo "✅ Dashboard accessible sur:"
echo "   👉 http://localhost:3000/api/analytics/dashboard"
echo ""

# Arrêter le serveur
kill $SERVER_PID 2>/dev/null


