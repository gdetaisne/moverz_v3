#!/bin/bash

echo "🧪 Test Analytics en Local"
echo ""

# Fonction pour nettoyer au Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Arrêt du serveur..."
    kill $SERVER_PID 2>/dev/null
    exit 0
}
trap cleanup INT

# Démarrer le serveur en arrière-plan
echo "1️⃣  Démarrage du serveur..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

echo "⏳ Attente du serveur (10 sec)..."
sleep 10

echo ""
echo "2️⃣  Serveur prêt !"
echo ""
echo "─────────────────────────────────────────────────"
echo "📱 Ouvre l'app et fais quelques actions:"
echo "   http://localhost:3000"
echo ""
echo "   - Upload 2-3 photos"
echo "   - Navigue entre les étapes"
echo "   - Valide des pièces"
echo "   - etc."
echo ""
echo "─────────────────────────────────────────────────"
echo ""
echo "3️⃣  Puis consulte les métriques:"
echo ""
echo "   Dashboard API:"
echo "   → http://localhost:3000/api/analytics/dashboard"
echo ""
echo "   Ou en ligne de commande:"
echo "   → curl http://localhost:3000/api/analytics/dashboard | jq"
echo ""
echo "   Prisma Studio (explorer la DB):"
echo "   → npx prisma studio"
echo "     (http://localhost:5555 → table AnalyticsEvent)"
echo ""
echo "─────────────────────────────────────────────────"
echo ""
echo "💡 Le serveur tourne en arrière-plan (PID: $SERVER_PID)"
echo "   Appuie sur Ctrl+C pour l'arrêter"
echo ""

# Garder le script actif
wait $SERVER_PID

