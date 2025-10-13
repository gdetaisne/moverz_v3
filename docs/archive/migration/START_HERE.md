# 🎯 Migration PostgreSQL — COMMENCEZ ICI

## ⚡ TL;DR (5 minutes)

```bash
# 1. Créer compte Neon
open https://console.neon.tech/

# 2. Configurer .env avec URLs Neon
cat > .env << 'EOF'
DATABASE_URL="postgresql://[COPIER_POOLED_URL]?sslmode=require&connect_timeout=15&pool_timeout=15&pgbouncer=true"
DIRECT_URL="postgresql://[COPIER_DIRECT_URL]?sslmode=require&connect_timeout=15"
AI_SERVICE_URL="http://localhost:8000"
PORT=3001
NODE_ENV="development"
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
EOF

# 3. Migrer
npm run check:neon      # Valide config
npm run migrate:neon    # Migre DB
npm run prisma:studio   # Vérifie tables

# 4. Tester
npm run dev
bash scripts/test-postgres-migration.sh
```

---

## 📚 Documentation

**Quel document lire ?**

| Besoin | Document | Durée |
|--------|----------|-------|
| 🚀 Migrer maintenant | [MIGRATION_QUICKSTART.md](MIGRATION_QUICKSTART.md) | 5 min |
| ✅ Checklist détaillée | [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) | 15 min |
| 📊 Rapport complet | [DB_MIGRATION_REPORT.md](DB_MIGRATION_REPORT.md) | 30 min |
| 🔧 Config .env | [NEON_ENV_CONFIG.md](NEON_ENV_CONFIG.md) | 2 min |
| 📦 Résumé LOT 5 | [LOT5_RESUME.md](LOT5_RESUME.md) | 10 min |
| 📂 Index complet | [MIGRATION_INDEX.md](MIGRATION_INDEX.md) | 3 min |

---

## ✅ État

### Complété ✅
- Schema Prisma → PostgreSQL
- Scripts npm ajoutés
- Documentation livrée (6 fichiers)
- API corrigée (roomType)
- Rollback automatique prêt

### En Attente ⏳
- **Credentials Neon** (vous)
- Migration DB
- Tests validation

---

## 🧯 Rollback

```bash
# Retour SQLite en 1 commande
bash scripts/rollback-to-sqlite.sh
```

---

**Durée totale** : 15 minutes  
**Prochain fichier** : [MIGRATION_QUICKSTART.md](MIGRATION_QUICKSTART.md) 🚀

