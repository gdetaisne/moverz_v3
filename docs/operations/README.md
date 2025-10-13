# 🔧 Guide des Opérations - Moverz v3.1

Guide pour l'administration et la maintenance quotidienne de Moverz.

---

## 🎯 Interfaces d'Administration

### 1. Back-Office Principal (Configuration IA)

**URL** : Cliquer sur **"🔧 Back-office"** depuis la page d'accueil

- **Production** : https://movers-test.gslv.cloud/ → Bouton "🔧 Back-office"
- **Local** : http://localhost:3001 → Bouton "🔧 Back-office"

**Fonctionnalités** :
- Configuration des modèles IA (OpenAI/Claude)
- Modification des prompts
- Paramètres d'analyse (température, max tokens)
- Règles d'emballage
- Export/Import configuration JSON

**Auth** : ❌ Aucune (localStorage)

---

### 2. Page Admin (Statut Système)

**URL Direct** :
- **Production** : https://movers-test.gslv.cloud/admin
- **Local** : http://localhost:3001/admin

**Fonctionnalités** :
- Vérification statut services (IA, DB, Queues)
- Indicateurs de santé système
- Liens vers métriques détaillées

**Auth** : ❌ Aucune

---

### 3. Page Métriques (Monitoring Détaillé)

**URL** :
- **Production** : https://movers-test.gslv.cloud/admin/metrics
- **Local** : http://localhost:3001/admin/metrics

**Fonctionnalités** :
- **A/B Testing** : Comparaison variantes (7 derniers jours)
- **Batches** : Statistiques traitement
- **Queues** : État temps réel BullMQ
- Refresh automatique (30s)

**Auth** : ✅ Token admin requis

**Configuration** :
```bash
# Dans .env ou .env.local
NEXT_PUBLIC_ADMIN_BYPASS_TOKEN=votre-token-secret

# Ou via console navigateur (F12)
localStorage.setItem('admin_token', 'votre-token');
```

---

### 4. Bull Board (Dashboard Queues)

**URL** : http://localhost:3010/admin/queues

**⚠️ Local uniquement** (ne pas exposer en production)

**Fonctionnalités** :
- Statistiques temps réel des queues
- Visualisation détaillée des jobs
- Retry jobs échoués
- Nettoyage jobs complétés
- Logs et stack traces

**Auth** : ✅ Token HTTP header requis

**Démarrage** :
```bash
# Terminal 1 : App
pnpm dev

# Terminal 2 : Bull Board
pnpm bullboard

# Accès
open "http://localhost:3010/admin/queues?token=secret123"
```

---

## 🗄️ Gestion de la Base de Données

### Consultation des Données

#### Via Prisma Studio (Recommandé)

```bash
pnpm prisma:studio
# Ouvre http://localhost:5555
```

**Avantages** :
- Interface graphique intuitive
- Édition en ligne des données
- Relations visuelles entre tables
- Filtres et recherche

#### Via Scripts

```bash
# Statistiques globales
node scripts/show-db-stats.js

# Détails d'un utilisateur
node scripts/show-user-details.js <userId>
```

---

### Sauvegardes

#### Base SQLite (Dev)

```bash
# Backup manuel
cp prisma/dev.db "prisma/backup_$(date +%Y%m%d_%H%M%S).db"

# Restaurer
cp prisma/backup_YYYYMMDD_HHMMSS.db prisma/dev.db
```

#### PostgreSQL (Production)

```bash
# Via pg_dump
pg_dump $DATABASE_URL > backup.sql

# Via Neon Dashboard
# Neon → Project → Backups → Create Backup
```

**⚠️ Recommandation** : Backup automatique quotidien en production !

---

### Migrations

#### Appliquer une Migration

```bash
# Production (via DIRECT_URL)
npx prisma migrate deploy

# Dev (crée migration si changements)
npx prisma migrate dev --name nom_migration
```

#### Vérifier Statut

```bash
npx prisma migrate status
# Affiche migrations pending/appliquées
```

#### Rollback

```bash
# Marquer comme rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Puis appliquer correction
npx prisma migrate dev
```

---

## 📊 Monitoring & Métriques

### Métriques IA

**Endpoint** : `/api/ai-metrics/summary`

```bash
curl https://movers-test.gslv.cloud/inventaire-ia/api/ai-metrics/summary | jq
```

**Données disponibles** :
- Total appels IA
- Taux de succès/échec
- Latence moyenne (P50, P95, P99)
- Coût total (USD)
- Breakdown par provider/modèle

**Storage** :
- PostgreSQL : Table `AiMetric`
- JSONL : `.next/metrics/ai-metrics.jsonl` (rotation 1000 entrées)

---

### Queues BullMQ

#### Via API

```bash
# Stats globales
curl -H "x-access-token: secret123" \
  http://localhost:3010/admin/api/stats | jq

# Jobs échoués
curl -H "x-access-token: secret123" \
  "http://localhost:3010/admin/api/failed?queue=photo-analyze" | jq
```

#### Via Bull Board UI

```
http://localhost:3010/admin/queues?token=secret123
```

**Métriques** :
- Jobs waiting/active/completed/failed
- Latences moyennes
- Retry attempts
- Error logs

---

### Logs Application

#### CapRover

**Dashboard** → **App** → **Logs**

**Filtres utiles** :
```bash
# Erreurs seulement
grep "ERROR"

# Requêtes API
grep "POST /api"

# Métriques IA
grep "AI_METRIC"
```

#### Local

```bash
# Logs console (mode dev)
pnpm dev

# Niveau de log
LOG_LEVEL=debug pnpm dev
```

---

## 🚨 Tâches Courantes

### Nettoyer les Jobs Complétés

```bash
# Via API Bull Board
curl -X POST \
  -H "x-access-token: secret123" \
  -H "Content-Type: application/json" \
  -d '{"queue": "photo-analyze", "grace": 86400000}' \
  http://localhost:3010/admin/api/clean

# grace: 86400000ms = 24 heures
```

### Retry Jobs Échoués

```bash
# Tous les jobs échoués d'une queue
curl -X POST \
  -H "x-access-token: secret123" \
  -d '{"queue": "photo-analyze"}' \
  http://localhost:3010/admin/api/retry-failed
```

### Réinitialiser un Utilisateur

```bash
# Via Prisma Studio
# 1. Ouvrir http://localhost:5555
# 2. Table "User"
# 3. Trouver utilisateur
# 4. Delete (cascade sur projects/photos/rooms)
```

### Vider la Base de Données

```bash
# ⚠️ ATTENTION : Supprime TOUTES les données !
pnpm db:reset

# Avec confirmation
npx prisma db push --force-reset
```

---

## 🐛 Troubleshooting

### API Retourne 500

**Diagnostic** :
1. Vérifier logs : CapRover Dashboard → Logs
2. Vérifier DB : `npx prisma db execute --stdin <<< "SELECT 1"`
3. Vérifier API keys : `echo $OPENAI_API_KEY`

**Solutions courantes** :
```bash
# Régénérer Prisma Client
npx prisma generate

# Vérifier migrations
npx prisma migrate status

# Redémarrer app
# CapRover : Restart App
```

---

### Queues Bloquées

**Symptômes** : Jobs en "waiting" ne bougent pas

**Diagnostic** :
```bash
# Vérifier Redis
redis-cli ping
# → PONG

# Vérifier workers
ps aux | grep worker
```

**Solutions** :
```bash
# Redémarrer Redis
redis-server

# Redémarrer workers
pkill -9 -f worker.js
pnpm worker
```

---

### Analyse IA Lente

**Causes possibles** :
1. Timeout trop long (ajuster `AI_TIMEOUT_MS`)
2. Rate limiting provider
3. Images trop grandes
4. Workers surchargés

**Solutions** :
```bash
# Ajuster timeout (défaut 30s)
AI_TIMEOUT_MS=15000

# Augmenter concurrency workers
QUEUE_CONCURRENCY=4

# Réduire taille images (config)
IMAGE_TARGET_SIZE=800
```

---

### Base de Données Verrouillée (SQLite)

**Symptôme** : "database is locked"

**Solution** :
```bash
# Tuer tous les processus Node
pkill -9 node

# Vérifier aucun processus n'utilise la DB
lsof | grep dev.db

# Relancer
pnpm dev
```

---

## 🔐 Sécurité

### Rotation des Secrets

#### JWT Secret

```bash
# 1. Générer nouveau secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Mettre à jour CapRover
# Dashboard → Environment Variables → JWT_SECRET

# 3. Redémarrer app
```

#### Admin Tokens

```bash
# Changer NEXT_PUBLIC_ADMIN_BYPASS_TOKEN
# Puis informer les admins du nouveau token
```

#### API Keys IA

```bash
# Rotation OpenAI
# 1. Créer nouvelle clé sur platform.openai.com
# 2. Mettre à jour OPENAI_API_KEY
# 3. Révoquer ancienne clé
```

---

### Audit Logs

```bash
# Logs accès admin (à implémenter)
# TODO: Logger accès /admin/metrics avec userId + timestamp

# Logs modifications DB
# Via Prisma Middleware (à activer)
```

---

## 📞 Contacts & Escalation

### Support Niveaux

**Niveau 1** : Ops quotidiennes (ce guide)
**Niveau 2** : Dev team (GitHub issues)
**Niveau 3** : Infrastructure (CapRover admin)

### Incidents Critiques

**App down** :
1. Vérifier statut CapRover
2. Check logs erreurs
3. Rollback si nécessaire
4. Notifier équipe

**Data loss** :
1. **NE PAS** paniquer
2. Restaurer dernier backup
3. Analyser cause
4. Post-mortem

---

## 📚 Commandes de Référence

```bash
# Base de données
pnpm prisma:studio          # Interface DB
pnpm prisma:generate        # Régénérer client
pnpm db:push                # Appliquer schéma
pnpm db:reset               # Reset DB (⚠️)

# Queues
pnpm worker                 # Démarrer workers
pnpm bullboard              # Dashboard queues

# Monitoring
node scripts/show-db-stats.js              # Stats DB
node scripts/show-user-details.js <userId> # Détails user

# Logs
tail -f logs/app.log        # Logs app (si configuré)
```

---

**Version** : Moverz v3.1  
**Dernière mise à jour** : 12 octobre 2025

