# 🚀 Guide de Déploiement - Moverz v3.1

Guide complet pour déployer Moverz en production (CapRover, Vercel, Docker).

---

## 📋 Prérequis Production

### Infrastructure Requise

- **PostgreSQL** : Base de données (Neon recommandé)
- **Redis** : Pour queues BullMQ (optionnel mais recommandé)
- **Node.js** : 20+ sur le serveur
- **Storage** : S3/MinIO pour fichiers (optionnel)

### Services Externes

- **API Keys IA** : OpenAI et/ou Claude (obligatoire)
- **Monitoring** : Datadog/Sentry (optionnel)

---

## 🎯 Déploiement CapRover (Recommandé)

### Étape 1 : Préparer la Base de Données

#### Option A : Neon (PostgreSQL managé)

1. Créer compte sur [neon.tech](https://neon.tech)
2. Créer un projet `moverz-prod`
3. Copier les URLs de connexion :
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`

```bash
# Exemple
DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/moverz?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/moverz?sslmode=require"
```

#### Option B : PostgreSQL sur CapRover

```bash
# Déployer PostgreSQL via One-Click Apps
# Puis utiliser :
DATABASE_URL="postgresql://postgres:PASSWORD@srv-captain--postgres:5432/moverz"
DIRECT_URL="postgresql://postgres:PASSWORD@srv-captain--postgres:5432/moverz"
```

---

### Étape 2 : Configurer les Variables d'Environnement

**Dashboard CapRover** → App → **App Configs** → **Environment Variables**

#### Variables Obligatoires ✅

```bash
# Base de données
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# APIs IA (au moins une)
OPENAI_API_KEY=sk-proj-...
CLAUDE_API_KEY=sk-ant-...

# Application
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0

# URLs publiques
NEXT_PUBLIC_API_URL=https://movers-test.gslv.cloud
NEXT_PUBLIC_APP_URL=https://movers-test.gslv.cloud

# Sécurité
JWT_SECRET=CHANGER_EN_PRODUCTION_SECRET_FORT
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://movers-test.gslv.cloud

# Base path (si reverse proxy)
BASE_PATH=/inventaire-ia
```

#### Variables Optionnelles

```bash
# Redis (pour queues)
REDIS_URL=redis://srv-captain--redis:6379
REDIS_HOST=srv-captain--redis

# S3/AWS (pour uploads directs)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=moverz-uploads
S3_REGION=us-east-1
UPLOAD_MAX_MB=50

# Features
ENABLE_AB_TESTING=true
ENABLE_METRICS=true
ENABLE_QUEUE=true

# Admin
NEXT_PUBLIC_ADMIN_BYPASS_TOKEN=secret-admin-token

# Google Cloud (optionnel)
GOOGLE_CLOUD_PROJECT_ID=...
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}

# Monitoring
LOG_LEVEL=info
```

---

### Étape 3 : Déployer l'Application

#### Via Git (Automatique)

```bash
# 1. Commit et push
git add -A
git commit -m "feat: deploy to production"
git push origin main

# 2. CapRover détecte le push et rebuild automatiquement
# (si webhook configuré)
```

#### Via CapRover CLI

```bash
# Installer CLI
npm install -g caprover

# Login
caprover login

# Déployer
caprover deploy
```

#### Via Dashboard

1. **App Configs** → **Deployment**
2. **Method** : Branch `main`
3. Cliquer **Force Rebuild**

---

### Étape 4 : Appliquer les Migrations

Les migrations sont appliquées automatiquement au démarrage via le `Dockerfile` :

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'Migration warning'; node server.js"]
```

**Si erreur** : Vérifier que `DIRECT_URL` est configurée.

---

### Étape 5 : Valider le Déploiement

#### Test 1 : Health Check

```bash
curl https://movers-test.gslv.cloud/inventaire-ia/api/ai-status
# ✅ Attendu : {"openai":{"available":true}}
```

#### Test 2 : API Rooms

```bash
# Créer une room
curl -X POST https://movers-test.gslv.cloud/inventaire-ia/api/rooms \
  -H "content-type: application/json" \
  -H "x-user-id: test-prod" \
  -d '{"name":"Test Production"}'

# ✅ Attendu : 201 Created
```

#### Test 3 : Interface Web

```bash
# Ouvrir dans navigateur
https://movers-test.gslv.cloud/inventaire-ia

# ✅ Tester upload photo + analyse
```

---

## 🐳 Docker Direct

### Build Image

```bash
docker build -t moverz:latest .
```

### Run Container

```bash
docker run -d \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e OPENAI_API_KEY="sk-..." \
  -e NODE_ENV="production" \
  --name moverz \
  moverz:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/moverz
      - DIRECT_URL=postgresql://postgres:password@db:5432/moverz
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: moverz
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## ☁️ Vercel (Alternative)

### Configuration

**`vercel.json`** :

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "DIRECT_URL": "@direct-url",
    "OPENAI_API_KEY": "@openai-key",
    "NODE_ENV": "production"
  }
}
```

### Déploiement

```bash
# Installer CLI
npm i -g vercel

# Deploy
vercel --prod
```

**⚠️ Limitations Vercel** :
- Timeout : 10s (Hobby), 60s (Pro)
- Pas de workers BullMQ
- Redis externe requis (Upstash)

---

## 🔐 Sécurité Production

### Checklist

- [ ] **JWT_SECRET** : Secret fort (32+ caractères aléatoires)
- [ ] **DATABASE_URL** : SSL activé (`sslmode=require`)
- [ ] **API Keys** : Jamais dans le code, uniquement en ENV
- [ ] **CORS** : `CORS_ORIGIN` configuré (pas `*`)
- [ ] **Rate Limiting** : Activer sur reverse proxy
- [ ] **HTTPS** : Certificat SSL valide
- [ ] **Headers** : CSP, X-Frame-Options configurés
- [ ] **Logs** : Pas de secrets dans les logs

### Générer JWT Secret

```bash
# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📊 Monitoring Production

### Métriques à Surveiller

- **API Response Time** : <500ms P95
- **DB Query Time** : <100ms P95
- **AI Latency** : <5s P95
- **Queue Backlog** : <50 jobs waiting
- **Error Rate** : <1%
- **Uptime** : >99.9%

### Outils

**CapRover Built-in** :
- App Logs : Dashboard → Logs
- Metrics : CPU, RAM, Network

**Externes (Recommandés)** :
- **Sentry** : Error tracking
- **Datadog** : APM complet
- **UptimeRobot** : Monitoring uptime
- **PostHog** : Analytics produit

### Alerts

Configurer alertes pour :
- [ ] App down >5 min
- [ ] Error rate >5%
- [ ] DB connexion failed
- [ ] Queue jobs >100 pending
- [ ] Disk space <20%

---

## 🔄 Rollback

### Via CapRover

1. **App Configs** → **Deployment**
2. **Build Logs** → Cliquer sur un build précédent
3. **Redeploy this version**

### Via Git

```bash
# Revenir au commit précédent
git revert HEAD
git push origin main

# Ou rollback complet
git reset --hard <commit-précédent>
git push origin main --force  # ⚠️ Dangereux
```

### Base de Données

```bash
# Rollback migration Prisma
npx prisma migrate resolve --rolled-back <migration-name>
```

**⚠️ Attention** : Sauvegarder DB avant migrations importantes !

---

## 🐛 Troubleshooting Production

### App ne démarre pas

**Logs à vérifier** : CapRover → App Logs

**Causes communes** :
1. `DATABASE_URL` invalide
2. Migrations non appliquées
3. `OPENAI_API_KEY` manquante
4. Port conflict

**Solutions** :
```bash
# Vérifier variables
# Dashboard → App Configs → Environment Variables

# Forcer rebuild
# Dashboard → Deployment → Force Rebuild

# Vérifier migrations
npx prisma migrate status
```

### "Can't reach database server"

```bash
# Vérifier DATABASE_URL
echo $DATABASE_URL

# Tester connexion
npx prisma db execute --stdin <<< "SELECT 1"

# Vérifier firewall Neon (si applicable)
# Dashboard Neon → Settings → Allowed IPs
```

### 500 Error sur API

```bash
# Logs détaillés
tail -f /path/to/logs

# Ou via CapRover Dashboard → Logs

# Vérifier Prisma Client généré
npx prisma generate
```

---

## 📚 Ressources

- **Guide CapRover** : [caprover.com/docs](https://caprover.com/docs)
- **Neon PostgreSQL** : [neon.tech/docs](https://neon.tech/docs)
- **Prisma Deploy** : [prisma.io/docs/guides/deployment](https://prisma.io/docs/guides/deployment)
- **Next.js Production** : [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

**Version** : Moverz v3.1  
**Dernière mise à jour** : 12 octobre 2025

