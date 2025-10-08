# ✅ Checklist Migration Postgres (Neon)

## 📋 Avant Migration

- [ ] **Backup SQLite existant**
  ```bash
  cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
  ls -lh prisma/dev.db*
  ```

- [ ] **Créer compte Neon**
  - Aller sur https://console.neon.tech/
  - Créer un nouveau projet (région recommandée : proche de vous)
  - Nom suggéré : `moverz-v3-dev`

- [ ] **Copier les URLs de connexion**
  - Connection pooling → `DATABASE_URL`
  - Direct connection → `DIRECT_URL`

## 🔧 Configuration

- [ ] **Créer fichier `.env`**
  ```bash
  # Créer .env à la racine (pas .env.local)
  touch .env
  ```

- [ ] **Remplir les variables** (copier depuis Neon)
  ```bash
  DATABASE_URL="postgresql://[COPIER_ICI]?sslmode=require&connect_timeout=15&pool_timeout=15&pgbouncer=true"
  DIRECT_URL="postgresql://[COPIER_ICI]?sslmode=require&connect_timeout=15"
  AI_SERVICE_URL="http://localhost:8000"
  PORT=3001
  NODE_ENV="development"
  JWT_SECRET="dev-secret-change-in-production"
  JWT_EXPIRES_IN="7d"
  CORS_ORIGIN="http://localhost:3000"
  ```

- [ ] **Vérifier la configuration**
  ```bash
  npm run check:neon
  # Attendu : ✅ Configuration valide
  ```

## 🚀 Migration

- [ ] **Exécuter la migration**
  ```bash
  npm run migrate:neon
  # Nom suggéré : "init_postgres_from_sqlite"
  ```

- [ ] **Vérifier le résultat**
  - Migration créée dans `prisma/migrations/[timestamp]_init_postgres_from_sqlite/`
  - Client Prisma régénéré
  - Aucune erreur

## ✅ Validation

- [ ] **Ouvrir Prisma Studio**
  ```bash
  npm run prisma:studio
  # Doit s'ouvrir sur http://localhost:5555
  ```

- [ ] **Vérifier les tables**
  - [ ] User
  - [ ] Room (avec contrainte `userId_roomType`)
  - [ ] Project
  - [ ] Photo
  - [ ] UserModification

- [ ] **Démarrer l'application**
  ```bash
  # Terminal 1
  node ai-mock-server.js
  
  # Terminal 2
  npm run dev
  ```

- [ ] **Test 1 : Health Check**
  ```bash
  curl -sS http://localhost:3001/api/ai-status | jq
  # Attendu : 200 OK
  ```

- [ ] **Test 2 : Création Room (POST)**
  ```bash
  curl -sS -X POST http://localhost:3001/api/rooms \
    -H "content-type: application/json" \
    -H "x-user-id: test-user-neon-456" \
    -d '{"name":"Salon","roomType":"salon"}' | jq
  # Attendu : 201 Created avec l'objet room
  ```

- [ ] **Test 3 : Liste Rooms (GET)**
  ```bash
  curl -sS "http://localhost:3001/api/rooms?userId=test-user-neon-456" | jq
  # Attendu : 200 OK avec array contenant "Salon"
  ```

- [ ] **Test 4 : Analyse par Room**
  ```bash
  curl -sS -X POST http://localhost:3001/api/photos/analyze-by-room \
    -H "content-type: application/json" \
    -H "x-user-id: test-user-neon-789" \
    -d '{"imageUrl":"http://localhost:8000/test-image.jpg","roomType":"cuisine"}' | jq
  # Attendu : 200 OK avec items
  ```

- [ ] **Test 5 : Vérifier dans Prisma Studio**
  - [ ] User `test-user-neon-456` existe
  - [ ] Room "Salon" / "salon" existe
  - [ ] User `test-user-neon-789` existe
  - [ ] Room "cuisine" existe

## 📊 Métriques (Optionnel)

- [ ] **Mesurer latences**
  ```bash
  # Avec httpie ou curl --write-out
  time curl -sS http://localhost:3001/api/ai-status
  time curl -sS "http://localhost:3001/api/rooms?userId=test-user-neon-456"
  ```

- [ ] **Compléter DB_MIGRATION_REPORT.md**
  - Section "Métriques de Migration" → "Performance"
  - Noter les temps de réponse

## 🎯 Finalisation

- [ ] **Commit les changements**
  ```bash
  git add prisma/schema.prisma package.json scripts/ *.md
  git commit -m "feat(db): migration SQLite → PostgreSQL (Neon) complète"
  ```

- [ ] **Supprimer les docs temporaires** (optionnel)
  ```bash
  # Garder uniquement DB_MIGRATION_REPORT.md
  rm MIGRATION_QUICKSTART.md MIGRATION_CHECKLIST.md NEON_ENV_CONFIG.md
  ```

- [ ] **Backup final SQLite** (avant de supprimer)
  ```bash
  # Garder pour rollback d'urgence
  mv prisma/dev.db prisma/dev.db.pre-neon.backup
  ```

## 🧯 En Cas de Problème

- [ ] **Erreur de connexion**
  - Vérifier `DATABASE_URL` et `DIRECT_URL` dans `.env`
  - Vérifier firewall Neon (doit autoriser votre IP)
  - Tester connexion directe avec `psql` (si installé)

- [ ] **Erreur de migration**
  - Vérifier que `DIRECT_URL` est utilisé (pas pooler)
  - Supprimer `prisma/migrations/` et relancer

- [ ] **Rollback complet**
  ```bash
  bash scripts/rollback-to-sqlite.sh
  ```

---

## 📚 Documentation

- **DB_MIGRATION_REPORT.md** — Rapport exhaustif
- **MIGRATION_QUICKSTART.md** — Guide rapide (5 min)
- **NEON_ENV_CONFIG.md** — Config environnement détaillée

---

## ✨ Success Criteria

✅ **Migration réussie si** :
- [ ] Tous les tests (1-5) passent à 100%
- [ ] Prisma Studio affiche les données correctement
- [ ] Latences API < 300ms (acceptable pour Neon)
- [ ] Aucune erreur dans les logs serveur

🎉 **Félicitations ! Migration terminée.**

---

**Temps estimé total** : 10-15 minutes  
**Dernière mise à jour** : 8 octobre 2025

