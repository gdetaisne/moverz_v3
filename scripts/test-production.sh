#!/bin/bash

# Script de test de production pour https://movers-test.gslv.cloud/
# Teste les APIs critiques et l'infrastructure

# Note: on ne met pas set -e car on veut continuer même si un test échoue

BASE_URL="https://movers-test.gslv.cloud"
TEST_USER_ID="test-user-prod-$(date +%s)"

echo "🧪 Tests de Production - Moverz v3.1"
echo "====================================="
echo "URL: $BASE_URL"
echo "Test User ID: $TEST_USER_ID"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Fonction de test
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="${5:-}"
    
    echo -n "Testing $name... "
    
    if [ -z "$data" ]; then
        http_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "x-user-id: $TEST_USER_ID" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        http_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "x-user-id: $TEST_USER_ID" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

test_health_check() {
    local name="$1"
    local endpoint="$2"
    
    echo -n "Health check $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1) || true
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
        echo -e "${GREEN}✓ UP${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (HTTP $http_code)"
        TESTS_WARNING=$((TESTS_WARNING + 1))
        return 1
    fi
}

echo "1️⃣  Tests d'Infrastructure"
echo "----------------------------"

# Test de base - site accessible
test_health_check "Site principal" "/"

# Test API Health
test_health_check "AI Status" "/api/ai-status"
test_health_check "AB Status" "/api/ab-status"

echo ""
echo "2️⃣  Tests des APIs Rooms"
echo "----------------------------"

# Test création de room
test_endpoint "POST /api/rooms" "POST" "/api/rooms" "201" '{"name":"Salon Test","roomType":"living_room"}'

# Test liste des rooms
test_endpoint "GET /api/rooms" "GET" "/api/rooms" "200"

echo ""
echo "3️⃣  Tests des APIs Photos"
echo "----------------------------"

# Test liste photos (peut être vide)
test_endpoint "GET /api/photos" "GET" "/api/photos" "200"

# Test reset photos
test_endpoint "POST /api/photos/reset" "POST" "/api/photos/reset" "200"

echo ""
echo "4️⃣  Tests des APIs Room Groups"
echo "----------------------------"

# Test liste room groups
test_endpoint "GET /api/room-groups" "GET" "/api/room-groups" "200"

# Note: POST /api/room-groups n'existe pas (groupes générés automatiquement)

echo ""
echo "5️⃣  Tests des APIs Projects"
echo "----------------------------"

# Test liste projects (pour obtenir un projectId)
test_endpoint "GET /api/projects" "GET" "/api/projects" "200"

echo ""
echo "6️⃣  Tests Upload S3"
echo "----------------------------"

# Test signature upload (nécessite userId dans le body)
test_endpoint "POST /api/upload/sign" "POST" "/api/upload/sign" "200" "{\"filename\":\"test.jpg\",\"mime\":\"image/jpeg\",\"userId\":\"$TEST_USER_ID\"}"

echo ""
echo "7️⃣  Tests Admin"
echo "----------------------------"

# Test métriques (peut nécessiter auth)
test_health_check "Admin Metrics" "/api/admin/metrics/batches"
test_health_check "AI Metrics" "/api/ai-metrics/summary"

echo ""
echo "======================================"
echo "📊 Résultats des Tests"
echo "======================================"
echo -e "✓ Passés:    ${GREEN}$TESTS_PASSED${NC}"
echo -e "✗ Échoués:   ${RED}$TESTS_FAILED${NC}"
echo -e "⚠ Warnings:  ${YELLOW}$TESTS_WARNING${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Tous les tests critiques sont passés !${NC}"
    exit 0
else
    echo -e "${RED}✗ Certains tests ont échoué${NC}"
    exit 1
fi

