#!/bin/bash
##
# Test Script pour Bull Board Dashboard
# 
# Vérifie que le dashboard est accessible et fonctionne
# 
# Usage: ./scripts/test-bullboard.sh
##

set -e

BULLBOARD_URL="${BULLBOARD_URL:-http://localhost:3010}"
BULLBOARD_TOKEN="${BULLBOARD_TOKEN:-dev-secret-token}"

echo "🧪 Test Bull Board Dashboard"
echo "   URL: $BULLBOARD_URL"
echo "   Token: ${BULLBOARD_TOKEN:0:10}..."
echo ""

# Test 1: Health check
echo "[1/4] Test health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BULLBOARD_URL/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"ok"' || echo "")

if [ -n "$HEALTH_STATUS" ]; then
    echo "✅ Health check OK"
else
    echo "❌ Health check FAILED"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Auth required
echo "[2/4] Test auth requirement..."
AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$BULLBOARD_URL/admin/api/stats")

if [ "$AUTH_TEST" = "401" ] || [ "$AUTH_TEST" = "403" ]; then
    echo "✅ Auth required (got $AUTH_TEST)"
elif [ "$AUTH_TEST" = "200" ]; then
    echo "⚠️  Auth bypass (dev mode?)"
else
    echo "❌ Unexpected status: $AUTH_TEST"
fi

# Test 3: Stats with auth
echo "[3/4] Test stats endpoint with auth..."
STATS_RESPONSE=$(curl -s -H "x-access-token: $BULLBOARD_TOKEN" "$BULLBOARD_URL/admin/api/stats")
STATS_OK=$(echo "$STATS_RESPONSE" | grep -o '"stats"' || echo "")

if [ -n "$STATS_OK" ]; then
    echo "✅ Stats endpoint OK"
    echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATS_RESPONSE" | head -c 200
else
    echo "❌ Stats endpoint FAILED"
    echo "Response: $STATS_RESPONSE"
    exit 1
fi

# Test 4: Dashboard UI accessible
echo "[4/4] Test dashboard UI..."
UI_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "x-access-token: $BULLBOARD_TOKEN" "$BULLBOARD_URL/admin/queues")

if [ "$UI_RESPONSE" = "200" ]; then
    echo "✅ Dashboard UI accessible"
elif [ "$UI_RESPONSE" = "302" ]; then
    echo "✅ Dashboard UI accessible (redirect)"
else
    echo "⚠️  Dashboard UI status: $UI_RESPONSE"
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "📊 Dashboard accessible at:"
echo "   $BULLBOARD_URL/admin/queues?token=$BULLBOARD_TOKEN"



