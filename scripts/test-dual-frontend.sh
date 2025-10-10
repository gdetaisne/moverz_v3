#!/bin/bash

echo "🧪 Test Dual Frontend - Moverz"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL=${1:-"http://localhost"}

echo "Testing URL: $BASE_URL"
echo ""

# Test 1: Desktop user-agent
echo -n "1️⃣  Testing desktop user-agent... "
DESKTOP_RESPONSE=$(curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "$BASE_URL/" | grep -c "DOCTYPE")
if [ "$DESKTOP_RESPONSE" -gt 0 ]; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

# Test 2: Mobile user-agent (iPhone)
echo -n "2️⃣  Testing mobile user-agent (iPhone)... "
MOBILE_RESPONSE=$(curl -s -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" "$BASE_URL/" | grep -c "DOCTYPE")
if [ "$MOBILE_RESPONSE" -gt 0 ]; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

# Test 3: API route
echo -n "3️⃣  Testing API route... "
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/photos")
if [ "$API_RESPONSE" -eq 200 ] || [ "$API_RESPONSE" -eq 401 ]; then
  echo -e "${GREEN}✓ OK (HTTP $API_RESPONSE)${NC}"
else
  echo -e "${RED}✗ FAIL (HTTP $API_RESPONSE)${NC}"
fi

# Test 4: Force mobile route
echo -n "4️⃣  Testing /mobile route... "
MOBILE_FORCE=$(curl -s "$BASE_URL/mobile" | grep -c "DOCTYPE")
if [ "$MOBILE_FORCE" -gt 0 ]; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

# Test 5: Force desktop route
echo -n "5️⃣  Testing /desktop route... "
DESKTOP_FORCE=$(curl -s "$BASE_URL/desktop" | grep -c "DOCTYPE")
if [ "$DESKTOP_FORCE" -gt 0 ]; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

echo ""
echo "================================"
echo "✅ Tests completed!"
echo ""
echo "Manual test URLs:"
echo "  Desktop: $BASE_URL/desktop"
echo "  Mobile:  $BASE_URL/mobile"
echo "  API:     $BASE_URL/api/photos"

