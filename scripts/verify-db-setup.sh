#!/bin/bash

# Script de vérification complète de la configuration DB
# Usage: ./scripts/verify-db-setup.sh

set -e

echo "═══════════════════════════════════════════════════════"
echo "  Vérification Configuration Base de Données"
echo "═══════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Vérifier schema.prisma
echo "📋 1. Vérification schema.prisma..."
PROVIDER=$(grep -A 2 "datasource db" prisma/schema.prisma | grep "provider" | awk '{print $3}' | tr -d '"')

if [ "$PROVIDER" = "postgresql" ]; then
  echo -e "${GREEN}✅ Provider: postgresql${NC}"
else
  echo -e "${RED}❌ Provider: $PROVIDER (devrait être postgresql)${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Vérifier directUrl
if grep -q "directUrl" prisma/schema.prisma; then
  echo -e "${GREEN}✅ directUrl configurée${NC}"
else
  echo -e "${RED}❌ directUrl manquante dans schema.prisma${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# 2. Vérifier migration_lock.toml
echo "📋 2. Vérification migration_lock.toml..."
LOCK_PROVIDER=$(grep "provider" prisma/migrations/migration_lock.toml | awk '{print $3}' | tr -d '"')

if [ "$LOCK_PROVIDER" = "postgresql" ]; then
  echo -e "${GREEN}✅ Migration lock: postgresql${NC}"
else
  echo -e "${RED}❌ Migration lock: $LOCK_PROVIDER${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# 3. Compter les migrations PostgreSQL
echo "📋 3. Vérification migrations..."
MIGRATIONS=$(find prisma/migrations -name "*.sql" | wc -l | tr -d ' ')
echo -e "${GREEN}✅ $MIGRATIONS migrations PostgreSQL trouvées${NC}"

# Lister les migrations
echo "   Migrations appliquées:"
find prisma/migrations -type d -name "2025*" | sort | while read dir; do
  echo "   - $(basename $dir)"
done

echo ""

# 4. Vérifier le client Prisma généré
echo "📋 4. Vérification Prisma Client..."
if [ -d "node_modules/.prisma/client" ]; then
  echo -e "${GREEN}✅ Prisma Client généré${NC}"
  
  # Vérifier le type de client
  if grep -q "postgresql" node_modules/.prisma/client/schema.prisma 2>/dev/null; then
    echo -e "${GREEN}✅ Client PostgreSQL${NC}"
  elif grep -q "sqlite" node_modules/.prisma/client/schema.prisma 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Client SQLite détecté (relancer: npx prisma generate)${NC}"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${YELLOW}⚠️  Type de client inconnu${NC}"
  fi
else
  echo -e "${RED}❌ Prisma Client non généré (relancer: npx prisma generate)${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# 5. Vérifier les variables d'environnement
echo "📋 5. Vérification variables d'environnement..."

if [ -f ".env" ]; then
  echo -e "${GREEN}✅ Fichier .env existe${NC}"
  
  # Vérifier DATABASE_URL
  if grep -q "^DATABASE_URL=" .env; then
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2- | tr -d '"' | tr -d "'")
    if [[ $DB_URL == postgresql://* ]]; then
      echo -e "${GREEN}✅ DATABASE_URL: postgresql://...${NC}"
    elif [[ $DB_URL == sqlite:* ]] || [[ $DB_URL == file:* ]]; then
      echo -e "${RED}❌ DATABASE_URL pointe vers SQLite${NC}"
      ERRORS=$((ERRORS + 1))
    else
      echo -e "${YELLOW}⚠️  DATABASE_URL: format inconnu${NC}"
    fi
  else
    echo -e "${RED}❌ DATABASE_URL manquante dans .env${NC}"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Vérifier DIRECT_URL
  if grep -q "^DIRECT_URL=" .env; then
    echo -e "${GREEN}✅ DIRECT_URL configurée${NC}"
  else
    echo -e "${YELLOW}⚠️  DIRECT_URL manquante (requise pour migrations)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Fichier .env absent (normal en dev si variables système)${NC}"
fi

echo ""

# 6. Vérifier le Dockerfile
echo "📋 6. Vérification Dockerfile..."

if grep -q "provider = \"postgresql\"" Dockerfile 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Dockerfile contient une référence explicite au provider (inhabituel)${NC}"
fi

if grep -q "prisma db push" Dockerfile; then
  if grep -q "prisma migrate deploy" Dockerfile; then
    echo -e "${GREEN}✅ Utilise prisma migrate deploy (recommandé)${NC}"
  else
    echo -e "${YELLOW}⚠️  Utilise prisma db push (dev only, pas prod)${NC}"
  fi
else
  echo -e "${GREEN}✅ Pas de prisma db push dans Dockerfile${NC}"
fi

echo ""

# 7. Test de connexion (si DATABASE_URL existe)
echo "📋 7. Test de connexion DB..."

if [ ! -z "$DATABASE_URL" ] || grep -q "^DATABASE_URL=" .env 2>/dev/null; then
  # Charger .env si existe
  if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
  fi
  
  # Tester la connexion via Prisma
  if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connexion DB réussie${NC}"
  else
    echo -e "${YELLOW}⚠️  Impossible de se connecter (vérifier DATABASE_URL ou DB non démarrée)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  DATABASE_URL non configurée, test de connexion ignoré${NC}"
fi

echo ""

# Résumé
echo "═══════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ SUCCÈS - Configuration PostgreSQL correcte${NC}"
  echo ""
  echo "Prochaines étapes:"
  echo "1. Configurer DATABASE_URL sur CapRover (si pas fait)"
  echo "2. git add -A && git commit -m 'fix(db): PostgreSQL setup'"
  echo "3. git push origin main"
  echo "4. Déployer sur CapRover (Force Rebuild)"
  exit 0
else
  echo -e "${RED}❌ ERREURS DÉTECTÉES ($ERRORS)${NC}"
  echo ""
  echo "Actions recommandées:"
  echo "1. Corriger les erreurs ci-dessus"
  echo "2. Relancer: npx prisma generate"
  echo "3. Relancer ce script: ./scripts/verify-db-setup.sh"
  exit 1
fi

