# 🔧 Fix Base de Données Production

**Date**: 12 octobre 2025  
**Statut**: ✅ **CORRIGÉ LOCALEMENT - DÉPLOIEMENT REQUIS**

---

## 🔍 Problème Identifié

### Symptôme
```
Error validating datasource `db`: the URL must start with the protocol `file:`.
schema.prisma:10
```

### Cause Racine

**Incohérence schema.prisma vs migrations** :

| Composant | Provider | État |
|-----------|----------|------|
| `migration_lock.toml` | postgresql | ✅ |
| Migrations SQL | PostgreSQL (JSONB, TIMESTAMP) | ✅ |
| **schema.prisma** (avant fix) | **sqlite** | ❌ |

**Historique** :
- LOT 5 (8 oct) : Migration PostgreSQL appliquée en dev
- 5 migrations PostgreSQL créées
- ❌ schema.prisma resté en SQLite (probablement rollback local)
- Production essayait d'utiliser SQLite avec URL PostgreSQL → **échec**

---

## ✅ Correction Appliquée

### Fichier : `prisma/schema.prisma`

```diff
datasource db {
-  provider = "sqlite"
-  url      = env("DATABASE_URL")
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
+  directUrl = env("DIRECT_URL")
}
```

### Client Prisma Régénéré

```bash
✔ Generated Prisma Client (v6.16.3) - PostgreSQL
```

---

## 🚀 Configuration Production (CapRover)

### Étape 1 : Variables d'Environnement

**Accédez à CapRover Dashboard** :
```
https://captain.gslv.cloud/
→ Apps → moverz-test (ou votre app)
→ App Configs → Environment Variables
```

**Variables REQUISES** :

#### 1️⃣ DATABASE_URL (Runtime - Pooled)

**Si vous utilisez Neon** (recommandé) :
```bash
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[POOLER_HOST]/[DATABASE]?sslmode=require&connect_timeout=15&pool_timeout=15&pgbouncer=true
```

**Exemple** :
```bash
DATABASE_URL=postgresql://user:pwd@ep-xxx-xxx.eu-central-1.aws.neon.tech/moverz_prod?sslmode=require&connect_timeout=15&pool_timeout=15&pgbouncer=true
```

**Si vous utilisez un PostgreSQL classique** :
```bash
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DATABASE]?sslmode=require
```

#### 2️⃣ DIRECT_URL (Migrations - Direct Connection)

**Pour Neon** (connexion directe, sans pooler) :
```bash
DIRECT_URL=postgresql://[USER]:[PASSWORD]@[DIRECT_HOST]/[DATABASE]?sslmode=require&connect_timeout=15
```

**Exemple** :
```bash
DIRECT_URL=postgresql://user:pwd@ep-xxx-xxx.eu-central-1.aws.neon.tech/moverz_prod?sslmode=require&connect_timeout=15
```

**Pour PostgreSQL classique** (même URL que DATABASE_URL) :
```bash
DIRECT_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DATABASE]?sslmode=require
```

#### 3️⃣ Autres Variables (vérifier qu'elles existent)

```bash
NODE_ENV=production
PORT=3001
AI_SERVICE_URL=http://localhost:8000  # ou votre service IA
CORS_ORIGIN=https://movers-test.gslv.cloud
JWT_SECRET=[VOTRE_SECRET_PROD]  # PAS "dev-secret-change-in-production" !
JWT_EXPIRES_IN=7d
```

---

### Étape 2 : Obtenir les URLs de Connexion

#### Option A : Neon (Recommandé pour production)

1. **Aller sur** https://console.neon.tech/
2. **Créer/Sélectionner un projet**
3. **Connection Details** :
   - **Pooled connection** (avec pgbouncer) → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`
4. **Copier/coller les URLs** dans CapRover

#### Option B : PostgreSQL Existant

Si vous avez déjà un PostgreSQL sur CapRover ou ailleurs :

```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@srv-captain--postgres:5432/moverz_prod?sslmode=disable
DIRECT_URL=postgresql://postgres:[PASSWORD]@srv-captain--postgres:5432/moverz_prod?sslmode=disable
```

**Note** : Si PostgreSQL est sur le même réseau Docker CapRover, utilisez `srv-captain--[nom-service]`.

---

### Étape 3 : Migrer la Base de Données

**Si c'est une NOUVELLE base PostgreSQL vide** :

Le Dockerfile exécute automatiquement :
```bash
npx prisma db push --accept-data-loss --skip-generate
```

Cela créera les tables selon le schema.prisma.

**Si vous avez DÉJÀ une base avec des données** :

1. **Commiter les changements** :
```bash
git add prisma/schema.prisma
git commit -m "fix(db): align schema.prisma with PostgreSQL migrations"
git push origin main
```

2. **Déployer sur CapRover** (voir Étape 4)

3. **Exécuter les migrations manuellement** (si nécessaire) :
```bash
# Via CapRover SSH ou CLI
npx prisma migrate deploy
```

---

### Étape 4 : Déployer

#### Option A : Depuis CapRover UI

1. **App Configs → Deployment**
2. **Method** : Branch (main)
3. **Cliquer sur "Force Rebuild"**

#### Option B : Depuis votre machine

```bash
cd /Users/guillaumestehelin/moverz_v3-1

# Commiter les changements
git add prisma/schema.prisma PRODUCTION_DB_FIX.md
git commit -m "fix(db): correct schema.prisma to use PostgreSQL (aligned with migrations)"
git push origin main

# Déployer via CapRover CLI (si installé)
caprover deploy
```

---

### Étape 5 : Vérifier le Déploiement

#### Test 1 : Santé de l'API

```bash
curl -sS https://movers-test.gslv.cloud/api/ai-status | jq
```

**Attendu** : `200 OK` avec JSON (pas d'erreur Prisma)

#### Test 2 : Créer une Room

```bash
curl -sS -X POST https://movers-test.gslv.cloud/api/rooms \
  -H "content-type: application/json" \
  -H "x-user-id: test-prod-user" \
  -d '{"name":"Salon"}' | jq
```

**Attendu** : `201 Created` avec `{ id, name, roomType, userId }`

#### Test 3 : Lister les Rooms

```bash
curl -sS "https://movers-test.gslv.cloud/api/rooms?userId=test-prod-user" | jq
```

**Attendu** : `200 OK` avec array (peut être vide si pas de données)

#### Test 4 : Vérifier les Logs CapRover

**CapRover Dashboard** → **App Logs** :

Chercher :
- ✅ `✔ Generated Prisma Client` (au démarrage)
- ✅ Pas d'erreur `Invalid prisma.user.findUnique()`
- ✅ Connexions DB réussies

---

## 🗄️ Schéma de Migration

Migrations PostgreSQL appliquées (5 migrations) :

```
20251008061154_init_postgres_from_sqlite          (LOT 5)
20251008071731_add_ai_metrics_observability       (LOT 7.5)
20251008074600_add_asset_job_s3_upload            (LOT 8)
20251008082722_lot10_add_photo_analysis_fields    (LOT 10)
20251008084103_lot11_add_batch_orchestration      (LOT 11)
```

**Tables** : User, Room, Project, Photo, Batch, UserModification, AiMetric, Asset, Job

---

## 🔒 Sécurité Production

### ⚠️ IMPORTANT

1. **JWT_SECRET** : Changer `dev-secret-change-in-production` par un secret sécurisé
   ```bash
   # Générer un secret fort
   openssl rand -base64 32
   ```

2. **DATABASE_URL** : Ne JAMAIS exposer dans les logs ou le code
   - Utiliser les App Secrets de CapRover
   - Ne pas commiter dans Git

3. **SSL/TLS** : Activer `sslmode=require` pour Neon/PostgreSQL distant

4. **Firewall** : Configurer les IPs autorisées sur Neon (si applicable)

---

## 📊 Checklist de Validation

Avant de marquer comme résolu :

- [ ] **Schema.prisma** : `provider = "postgresql"` ✅ (fait)
- [ ] **Client Prisma** : Régénéré ✅ (fait)
- [ ] **DATABASE_URL** : Configurée sur CapRover (à faire)
- [ ] **DIRECT_URL** : Configurée sur CapRover (à faire)
- [ ] **JWT_SECRET** : Changé en production (à faire)
- [ ] **Déploiement** : Force rebuild effectué (à faire)
- [ ] **Test API** : /api/ai-status → 200 OK (à faire)
- [ ] **Test Rooms** : POST + GET fonctionnent (à faire)
- [ ] **Logs** : Pas d'erreur Prisma (à faire)

---

## 🐛 Troubleshooting

### Erreur : "Can't reach database server"

**Cause** : DATABASE_URL incorrecte ou firewall

**Solution** :
1. Vérifier l'URL de connexion (typo, mot de passe)
2. Tester la connexion depuis CapRover :
   ```bash
   # Via SSH CapRover
   npx prisma db pull
   ```

### Erreur : "SSL connection required"

**Cause** : `sslmode` manquant

**Solution** :
```bash
# Ajouter à DATABASE_URL
?sslmode=require
```

### Erreur : "Migration lock file is not in PostgreSQL"

**Cause** : Impossible (migration_lock.toml est déjà PostgreSQL)

**Si ça arrive quand même** :
```bash
# Forcer la réinitialisation (ATTENTION : perte de données)
rm -rf prisma/migrations
npx prisma migrate dev --name init_postgres
```

### Logs : "Prisma Client not generated"

**Cause** : Build Docker a échoué

**Solution** :
```bash
# Vérifier le Dockerfile (ligne 34)
RUN npx prisma generate  # ← Doit être présent
```

---

## 🎯 Résumé Exécutif

### Problème
- Schema.prisma (SQLite) désynchronisé avec migrations (PostgreSQL)
- Production échouait à démarrer

### Solution
1. ✅ **Local** : Schema.prisma corrigé → PostgreSQL
2. ⏳ **Production** : Configurer DATABASE_URL + DIRECT_URL sur CapRover
3. ⏳ **Déploiement** : Force rebuild

### Prochaines Étapes (VOUS)
1. Obtenir URL PostgreSQL (Neon recommandé)
2. Configurer variables CapRover
3. Déployer
4. Tester avec les curl ci-dessus

---

**Contact** : Si problème persistant, fournir :
- Logs CapRover complets (App Logs)
- Erreur exacte
- Variables DATABASE_URL (masquer le mot de passe !)

**Auteur** : Claude Sonnet 4.5  
**Date** : 12 octobre 2025  
**Version** : 1.0



