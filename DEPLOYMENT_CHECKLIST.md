# ✅ Checklist de Déploiement Production - Moverz

**Date**: 1er octobre 2025  
**Cible**: CapRover (VPS Debian)

---

## 📋 **1. Prérequis Serveur**

### Sur le VPS
- [ ] **CapRover installé** → https://caprover.com/docs/get-started.html
- [ ] **PostgreSQL 14+** → `sudo apt install postgresql-14`
- [ ] **Domaine configuré** → Ex: `moverz.example.com`
- [ ] **DNS pointant vers VPS** → Type A record

### Base de données PostgreSQL
```bash
# SSH dans le VPS
ssh root@votre-vps-ip

# Créer la DB
sudo -u postgres psql
CREATE DATABASE moverz_production;
CREATE USER moverz_user WITH ENCRYPTED PASSWORD 'MOT_DE_PASSE_FORT_ICI';
GRANT ALL PRIVILEGES ON DATABASE moverz_production TO moverz_user;
\q
```

**Notez votre DATABASE_URL**:
```
postgresql://moverz_user:MOT_DE_PASSE@localhost:5432/moverz_production
```

---

## 📦 **2. Fichiers de Déploiement**

### Fichiers déjà créés ✅
- [x] `Dockerfile` → Build multi-stage optimisé
- [x] `captain-definition` → Configuration CapRover
- [x] `.dockerignore` → Optimisation build
- [x] `next.config.ts` → Output standalone activé
- [x] `google-credentials.json` → Credentials Google Cloud
- [x] `scripts/migrate-production.sh` → Script de migration

### À vérifier
- [ ] `.gitignore` contient `.env.local` et `google-credentials.json`
- [ ] `package.json` a les bons scripts build
- [ ] `prisma/schema.prisma` est à jour

---

## 🚀 **3. Configuration CapRover**

### Créer l'application
1. Ouvrir: `https://captain.votre-domaine.com`
2. **Apps** → **Create New App**
3. Nom: `moverz`
4. Cocher: **Has Persistent Data**

### Persistent Directories
Ajouter dans **App Configs**:
```
/var/www/uploads:/app/uploads
```

### Environment Variables
Copier ces variables dans **App Configs** → **Environment Variables**:

```bash
# APIs IA
OPENAI_API_KEY=sk-VOTRE_CLE_OPENAI_ICI

CLAUDE_API_KEY=sk-VOTRE_CLE_OPENAI_ICI

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=expanded-rider-217013
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# AWS
AWS_ACCESS_KEY_ID=AKIA_VOTRE_AWS_ACCESS_KEY_ICI
AWS_SECRET_ACCESS_KEY=crBZ7Z2YZmewT2IQLQmARV5kk8ClRpahLSbWkquI
AWS_REGION=us-east-1

# Database (⚠️ REMPLACER PAR VOTRE URL)
DATABASE_URL=postgresql://moverz_user:VOTRE_PASSWORD@postgres:5432/moverz_production

# App
NODE_ENV=production
PORT=3001
UPLOADS_DIR=/app/uploads
UPLOADS_URL=/api/uploads

# Performance
CACHE_TTL=300000
MAX_CACHE_SIZE=100
MAX_CONCURRENT_ANALYSES=5
REQUEST_TIMEOUT=30000

# Images
MAX_IMAGE_SIZE=10485760
IMAGE_QUALITY=85
IMAGE_TARGET_SIZE=1024
```

### Configurer le Port
**App Configs** → **Port HTTP**: `3001`

### Activer HTTPS
**App Configs** → **Enable HTTPS** → Cocher

---

## 🔧 **4. Déploiement**

### Via Git (Recommandé)

```bash
# 1. Initialiser Git
cd /Users/guillaumestehelin/moverz_v3
git init
git add .
git commit -m "Production deployment"

# 2. Ajouter remote CapRover
# (URL dans CapRover: Apps → moverz → Deployment → Method: Git)
git remote add caprover https://git@captain.votre-domaine.com/moverz.git

# 3. Déployer
git push caprover master

# 4. Attendre le build (5-10 min)
# Suivre les logs dans CapRover: Apps → moverz → Logs
```

### Via CapRover CLI

```bash
# 1. Installer CLI
npm install -g caprover

# 2. Login
caprover login

# 3. Déployer
caprover deploy
```

---

## 🗄️ **5. Migrations Database**

### Après le premier déploiement

```bash
# Méthode 1: Script automatique
./scripts/migrate-production.sh moverz

# Méthode 2: Manuel
caprover exec --appName moverz --command "npx prisma migrate deploy"
```

### Vérifier les tables

```bash
# SSH dans le container
caprover exec --appName moverz

# Dans le container:
npx prisma studio
# Ou
psql $DATABASE_URL -c "\dt"
```

---

## ✅ **6. Tests Post-Déploiement**

### Test 1: App répond
```bash
curl https://moverz.votre-domaine.com/
# Attendu: 200 OK avec HTML
```

### Test 2: API Health
```bash
curl https://moverz.votre-domaine.com/api/projects \
  -H "x-user-id: test"
# Attendu: {"projects": []}
```

### Test 3: Upload Photo
```bash
curl -X POST https://moverz.votre-domaine.com/api/photos/analyze \
  -H "x-user-id: test" \
  -F "file=@test-image.jpg"
# Attendu: JSON avec analyse
```

### Test 4: Image Serving
```bash
# Upload une photo (noter le photo_id)
# Puis:
curl -I https://moverz.votre-domaine.com/api/uploads/[photo_id].jpg
# Attendu: 200 OK, Content-Type: image/jpeg
```

---

## 📊 **7. Monitoring**

### Logs en temps réel
```bash
caprover logs --appName moverz --follow
```

### Métriques CapRover
- **CPU/RAM**: Apps → moverz → Metrics
- **Deployments**: Apps → moverz → Deployments

### Alertes (Optionnel)
Configurer Sentry:
```bash
npm install @sentry/nextjs
# Ajouter SENTRY_DSN dans les variables d'env
```

---

## 🔄 **8. Mises à Jour**

### Déployer une nouvelle version

```bash
# 1. Commit les changements
git add .
git commit -m "Fix: description"

# 2. Push
git push caprover master

# 3. Migrations si nécessaire
./scripts/migrate-production.sh moverz
```

### Rollback en cas de problème

**Via CapRover**:
1. Apps → moverz → Deployments
2. Cliquer sur "Revert to Previous Version"

---

## 🐛 **9. Troubleshooting**

### Erreur: "Cannot connect to database"

```bash
# Vérifier DATABASE_URL
caprover exec --appName moverz --command "echo \$DATABASE_URL"

# Tester la connexion
caprover exec --appName moverz --command "psql \$DATABASE_URL -c 'SELECT 1;'"
```

### Erreur: "Prisma Client not generated"

```bash
caprover exec --appName moverz --command "npx prisma generate"
caprover restart --appName moverz
```

### Erreur: "Images not found (404)"

```bash
# Vérifier le volume persistant
# Dans CapRover: Apps → moverz → App Configs → Persistent Directories
# Doit contenir: /var/www/uploads:/app/uploads

# Vérifier les permissions
caprover exec --appName moverz --command "ls -la /app/uploads"
```

### App lente ou timeout

```bash
# Augmenter la RAM dans App Configs
# Recommandé: 2GB minimum

# Augmenter les workers
# Ajouter: WEB_CONCURRENCY=4 dans les variables d'env
```

---

## 🔐 **10. Sécurité**

### Variables d'environnement
- [x] Clés API **uniquement** dans CapRover (pas dans le code)
- [x] `.env.local` dans `.gitignore`
- [x] `google-credentials.json` dans `.gitignore`

### HTTPS
- [x] Let's Encrypt activé dans CapRover
- [x] Redirect HTTP → HTTPS activé

### Rate Limiting
À implémenter dans `middleware.ts` (voir guide détaillé)

### Backups
```bash
# Backup automatique de la DB
caprover exec --appName moverz --command "pg_dump \$DATABASE_URL > /app/uploads/backup_\$(date +%Y%m%d).sql"

# Télécharger le backup
# Via l'interface CapRover ou SFTP
```

---

## 📞 **11. Support & Maintenance**

### Commandes utiles

```bash
# Logs
caprover logs --appName moverz --follow

# Restart
caprover restart --appName moverz

# Shell
caprover exec --appName moverz

# Rebuild
git commit --allow-empty -m "Rebuild"
git push caprover master
```

### Documentation
- CapRover: https://caprover.com/docs/
- Next.js: https://nextjs.org/docs/
- Prisma: https://www.prisma.io/docs/

### Contacts
- **CapRover Support**: https://github.com/caprover/caprover/issues
- **Moverz Issues**: Créer un issue dans votre repo Git

---

## 🎯 **Récapitulatif Final**

### ✅ Fichiers de déploiement créés
- `Dockerfile`
- `captain-definition`
- `.dockerignore`
- `scripts/migrate-production.sh`
- `CAPROVER_DEPLOYMENT_GUIDE.md`
- `DEPLOYMENT_CHECKLIST.md`

### ✅ Corrections apportées
- Next.js 15: `params` asynchrones corrigés
- Routes API: `/api/photos/[id]`, `/api/projects/[id]`, `/api/uploads/[filename]`

### ✅ Configuration requise
- PostgreSQL database créée
- Variables d'env dans CapRover
- Volume persistant pour `/uploads`
- HTTPS activé

### 🚀 Prêt à déployer !

```bash
git init
git add .
git commit -m "Production deployment"
git remote add caprover https://git@captain.votre-domaine.com/moverz.git
git push caprover master
./scripts/migrate-production.sh moverz
```

---

**Dernière mise à jour**: 1er octobre 2025  
**Status**: ✅ Production Ready  
**Temps de déploiement estimé**: 15-30 minutes

