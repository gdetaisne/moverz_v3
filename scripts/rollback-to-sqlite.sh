#!/bin/bash
# Script de rollback vers SQLite
# À utiliser en cas de problème avec la migration Postgres

set -e

echo "🔄 Rollback vers SQLite..."
echo ""

# 1. Backup du schema.prisma actuel
echo "📦 Backup schema.prisma actuel..."
cp prisma/schema.prisma prisma/schema.prisma.postgres.backup
echo "✅ Backup créé: prisma/schema.prisma.postgres.backup"

# 2. Restaurer le datasource SQLite
echo ""
echo "🔧 Restauration datasource SQLite..."
cat > prisma/schema.prisma.tmp << 'EOF'
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
EOF

# Lire le reste du schema (models)
tail -n +13 prisma/schema.prisma >> prisma/schema.prisma.tmp
mv prisma/schema.prisma.tmp prisma/schema.prisma

echo "✅ Schema SQLite restauré"

# 3. Régénérer le client Prisma
echo ""
echo "🔨 Régénération du client Prisma..."
npx prisma generate

echo ""
echo "✅ Rollback terminé avec succès"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Supprimer/renommer votre .env (avec URLs Postgres)"
echo "   2. Redémarrer l'application: npm run dev"
echo "   3. Vérifier que prisma/dev.db existe"
echo ""

