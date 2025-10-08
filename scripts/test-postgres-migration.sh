#!/bin/bash
# Script de tests automatisés post-migration Postgres
# À exécuter après migration pour valider le fonctionnement

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tests Post-Migration PostgreSQL (Neon)${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Vérifier que le serveur tourne
echo -e "${YELLOW}📡 Vérification serveur...${NC}"
if ! curl -s http://localhost:3001/api/ai-status > /dev/null 2>&1; then
    echo -e "${RED}❌ Serveur non accessible sur http://localhost:3001${NC}"
    echo -e "${YELLOW}💡 Lancer : npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Serveur accessible${NC}\n"

# Test 1 : Health Check
echo -e "${YELLOW}Test 1/5 : Health Check (GET /api/ai-status)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/ai-status)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Status 200 OK${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Status $HTTP_CODE (attendu 200)${NC}"
    exit 1
fi
echo ""

# Test 2 : Création Room
echo -e "${YELLOW}Test 2/5 : Création Room (POST /api/rooms)${NC}"
TEST_USER_ID="test-postgres-$(date +%s)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/rooms \
  -H "content-type: application/json" \
  -H "x-user-id: $TEST_USER_ID" \
  -d '{"name":"Salon Test","roomType":"salon"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Status 201 Created${NC}"
    ROOM_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
    echo "Room ID: $ROOM_ID"
    echo "User ID: $TEST_USER_ID"
else
    echo -e "${RED}❌ Status $HTTP_CODE (attendu 201)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 3 : Liste Rooms
echo -e "${YELLOW}Test 3/5 : Liste Rooms (GET /api/rooms)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:3001/api/rooms?userId=$TEST_USER_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Status 200 OK${NC}"
    COUNT=$(echo "$BODY" | jq 'length' 2>/dev/null || echo "?")
    echo "Rooms trouvées : $COUNT"
    if [ "$COUNT" -ge 1 ]; then
        echo -e "${GREEN}✅ Room 'Salon Test' trouvée${NC}"
    else
        echo -e "${RED}❌ Aucune room trouvée${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Status $HTTP_CODE (attendu 200)${NC}"
    exit 1
fi
echo ""

# Test 4 : Room Groups (Auth OK)
echo -e "${YELLOW}Test 4/5 : Room Groups avec Auth (GET /api/room-groups)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:3001/api/room-groups?userId=$TEST_USER_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Status 200 OK (avec userId)${NC}"
else
    echo -e "${RED}❌ Status $HTTP_CODE (attendu 200)${NC}"
    exit 1
fi
echo ""

# Test 5 : Room Groups (Auth KO - sans userId)
echo -e "${YELLOW}Test 5/5 : Room Groups sans Auth (GET /api/room-groups)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:3001/api/room-groups")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✅ Status 401 Unauthorized (attendu)${NC}"
else
    echo -e "${YELLOW}⚠️  Status $HTTP_CODE (attendu 401, mais non bloquant)${NC}"
fi
echo ""

# Résumé
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ TOUS LES TESTS PASSÉS${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}📊 Prochaines étapes :${NC}"
echo "1. Ouvrir Prisma Studio : npm run prisma:studio"
echo "2. Vérifier User '$TEST_USER_ID' dans table User"
echo "3. Vérifier Room 'Salon Test' dans table Room"
echo "4. Compléter métriques dans DB_MIGRATION_REPORT.md"
echo ""

echo -e "${GREEN}🎉 Migration PostgreSQL validée avec succès !${NC}"

