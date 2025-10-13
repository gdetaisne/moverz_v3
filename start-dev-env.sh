#!/bin/bash

echo "🚀 Démarrage environnement de développement complet"
echo ""

# Fonction pour nettoyer au Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup INT TERM

# 1. Démarrer Mock AI
echo "1️⃣  Démarrage Mock AI (port 8000)..."
node ai-mock-server.js > /tmp/ai-mock.log 2>&1 &
AI_PID=$!
sleep 2

if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ Mock AI actif (PID: $AI_PID)"
else
    echo "   ⚠️  Mock AI en cours de démarrage..."
fi

echo ""

# 2. Démarrer Next.js
echo "2️⃣  Démarrage Next.js (port 3000)..."
npm run dev > /tmp/nextjs.log 2>&1 &
NEXT_PID=$!

echo "   ⏳ Attente du démarrage (15 sec)..."
sleep 15

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "   ✅ Next.js actif (PID: $NEXT_PID)"
else
    echo "   ⏳ Next.js en cours de démarrage..."
    echo "   📝 Logs: tail -f /tmp/nextjs.log"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ENVIRONNEMENT PRÊT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Services actifs :"
echo "   • Mock AI : http://localhost:8000"
echo "   • Next.js : http://localhost:3000"
echo ""
echo "📊 Tracking Analytics :"
echo "   • Dashboard : http://localhost:3000/api/analytics/dashboard"
echo "   • Explorer DB : npx prisma studio"
echo ""
echo "📝 Logs :"
echo "   • Mock AI : tail -f /tmp/ai-mock.log"
echo "   • Next.js : tail -f /tmp/nextjs.log"
echo ""
echo "🎯 Actions à faire :"
echo "   1. Ouvre http://localhost:3000"
echo "   2. Upload 2-3 photos"
echo "   3. Navigue entre les étapes"
echo "   4. Consulte http://localhost:3000/api/analytics/dashboard"
echo ""
echo "🛑 Pour arrêter : Ctrl+C"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Garder le script actif
wait

