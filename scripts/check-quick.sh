#!/bin/bash

# MOVERZ QUICK CHECK - Validation rapide sans build
# Usage: ./scripts/check-quick.sh
# Prérequis: DB actif, .env configuré

set -e  # Exit on error

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}⚡ MOVERZ QUICK CHECK${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check 1: Prisma
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}🗄️  Prisma${NC}"
pnpm prisma generate > /dev/null 2>&1
echo -e "${GREEN}✅ Client généré${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check 2: Database
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}🔌 Database${NC}"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => prisma.\$disconnect())
  .then(() => { console.log('${GREEN}✅ Connecté${NC}'); process.exit(0); })
  .catch((e) => { console.error('${RED}❌${NC}', e.message); process.exit(1); });
"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check 3: Redis
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}🔴 Redis${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Actif${NC}"
else
    echo -e "${YELLOW}⚠️  Non disponible${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check 4: Fichiers critiques
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📁 Fichiers Critiques${NC}"

critical_files=(
    "prisma/schema.prisma"
    "lib/flags.ts"
    "services/roomClassifier.ts"
    "packages/core/src/metrics/abDaily.ts"
    "apps/web/app/api/ab-status/route.ts"
    "apps/web/app/admin/metrics/page.tsx"
)

all_present=true
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file"
        all_present=false
    fi
done

if [ "$all_present" = true ]; then
    echo -e "${GREEN}✅ Tous les fichiers présents${NC}"
else
    echo -e "${RED}❌ Fichiers manquants${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ QUICK CHECK PASSED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Pour un check complet : ./scripts/check-all.sh"
echo "💡 Pour build production : pnpm build"
echo ""


