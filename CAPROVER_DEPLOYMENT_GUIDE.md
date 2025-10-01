# 🚀 Guide de Déploiement CapRover - Moverz

**Date**: 1er octobre 2025  
**Target**: VPS Debian avec CapRover installé

---

## 📋 **Prérequis**

### Sur votre VPS
- ✅ CapRover installé et configuré
- ✅ PostgreSQL 14+ installé
- ✅ Docker installé (par CapRover)
- ✅ Nom de domaine configuré (ex: `moverz.example.com`)

### En local
- ✅ Node.js 18+
- ✅ Git configuré
- ✅ CapRover CLI installé

---

## 🔧 **1. Configuration PostgreSQL sur VPS**

### SSH dans votre VPS
```bash
ssh root@votre-vps-ip
```

### Créer la base de données
```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans psql:
CREATE DATABASE moverz_production;
CREATE USER moverz_user WITH ENCRYPTED PASSWORD 'VOTRE_MOT_DE_PASSE_FORT';
GRANT ALL PRIVILEGES ON DATABASE moverz_production TO moverz_user;
\q
```

### Obtenir l'URL de connexion
```bash
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Exemple:
postgresql://moverz_user:votre_mot_de_passe@localhost:5432/moverz_production
```

---

## 🐳 **2. Créer l'Application CapRover**

### Via l'interface web CapRover

1. Connectez-vous à CapRover: `https://captain.votre-domaine.com`
2. **Apps** → **Create New App**
3. Nom de l'app: `moverz`
4. Cochez: **Has Persistent Data**

### Configuration de l'app

**Onglet "App Configs"**:

#### Port HTTP
- **Port**: `3001` (ou `3000` selon votre config)

#### Persistent Directories
Ajoutez ces volumes pour stocker les uploads:
```
/var/www/uploads:/app/uploads
```

---

## ⚙️ **3. Variables d'Environnement**

Dans **App Configs** → **Environment Variables**, ajoutez:

### APIs IA
```bash
OPENAI_API_KEY=sk-VOTRE_CLE_OPENAI_ICI

CLAUDE_API_KEY=sk-VOTRE_CLE_OPENAI_ICI
```

### Google Cloud Vision
```bash
GOOGLE_CLOUD_PROJECT_ID=expanded-rider-217013

# Le fichier google-credentials.json sera inclus dans le build Docker
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

### AWS Rekognition
```bash
AWS_ACCESS_KEY_ID=AKIA_VOTRE_AWS_ACCESS_KEY_ICI
AWS_SECRET_ACCESS_KEY=crBZ7Z2YZmewT2IQLQmARV5kk8ClRpahLSbWkquI
AWS_REGION=us-east-1
```

### Database (IMPORTANT: remplacez par votre URL)
```bash
DATABASE_URL=postgresql://moverz_user:votre_mot_de_passe@postgres:5432/moverz_production
```

**Note**: Utilisez `postgres` comme hostname si PostgreSQL tourne dans un autre container CapRover, sinon utilisez l'IP du VPS.

### Environnement
```bash
NODE_ENV=production
PORT=3001
```

### Stockage
```bash
UPLOADS_DIR=/app/uploads
UPLOADS_URL=/api/uploads
```

### Cache
```bash
CACHE_TTL=300000
MAX_CACHE_SIZE=100
```

### Performance
```bash
MAX_CONCURRENT_ANALYSES=5
REQUEST_TIMEOUT=30000
```

### Image Processing
```bash
MAX_IMAGE_SIZE=10485760
IMAGE_QUALITY=85
IMAGE_TARGET_SIZE=1024
```

---

## 📦 **4. Créer le Dockerfile**

Créez `/Users/guillaumestehelin/moverz_v3/Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy Google credentials (secured during build)
COPY google-credentials.json ./google-credentials.json

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/google-credentials.json ./google-credentials.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

## 📝 **5. Créer captain-definition**

Créez `/Users/guillaumestehelin/moverz_v3/captain-definition`:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

---

## ⚙️ **6. Configuration Next.js pour Production**

Mettez à jour `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
```

---

## 🚀 **7. Déploiement**

### Option A: Via Git (Recommandé)

```bash
# 1. Initialiser Git (si pas déjà fait)
cd /Users/guillaumestehelin/moverz_v3
git init
git add .
git commit -m "Initial production deployment"

# 2. Ajouter le remote CapRover
# URL fournie dans CapRover: Apps → moverz → Deployment
git remote add caprover https://git@captain.votre-domaine.com/moverz.git

# 3. Push vers CapRover
git push caprover master
```

### Option B: Via CapRover CLI

```bash
# 1. Installer CapRover CLI
npm install -g caprover

# 2. Se connecter
caprover login

# 3. Déployer
caprover deploy
```

### Option C: Via Tarball (Manuel)

```bash
# 1. Créer une archive
tar -czf moverz-deploy.tar.gz .

# 2. Upload via l'interface CapRover
# Apps → moverz → Deployment → Method: Tarball
```

---

## 🗄️ **8. Migrations Prisma**

### Après le premier déploiement

```bash
# SSH dans le container CapRover
caprover exec --appName moverz

# Dans le container:
npx prisma migrate deploy
npx prisma db seed  # Si vous avez un seed
```

### Ou via script

Créez `scripts/migrate-production.sh`:

```bash
#!/bin/bash
echo "🔄 Running production migrations..."
caprover exec --appName moverz --command "npx prisma migrate deploy"
echo "✅ Migrations completed!"
```

---

## 🌐 **9. Configuration Nginx (Optionnel)**

### Activer le serving direct des images

Dans CapRover **App Configs** → **Nginx Configurations**:

```nginx
# Serving direct des fichiers uploads
location /api/uploads/ {
    alias /var/www/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Proxy vers Next.js pour le reste
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## ✅ **10. Vérifications Post-Déploiement**

### Tests de base

```bash
# 1. Vérifier que l'app répond
curl https://moverz.votre-domaine.com/

# 2. Test API health
curl https://moverz.votre-domaine.com/api/health

# 3. Test upload
curl -X POST https://moverz.votre-domaine.com/api/photos/analyze \
  -H "x-user-id: test" \
  -F "file=@test-image.jpg"
```

### Logs

```bash
# Via CapRover CLI
caprover logs --appName moverz --follow

# Ou via interface web
# Apps → moverz → Logs
```

---

## 🔐 **11. Sécurité**

### Variables sensibles

✅ **BON**: Variables d'env dans CapRover (sécurisées)  
❌ **MAUVAIS**: Variables hardcodées dans le code

### HTTPS

- ✅ CapRover configure automatiquement Let's Encrypt
- ✅ Forcer HTTPS: Apps → moverz → Enable HTTPS

### Rate Limiting

Ajoutez dans `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map();

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const max = 100; // 100 requêtes/min

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }

  const timestamps = rateLimit.get(ip).filter((t: number) => now - t < windowMs);
  
  if (timestamps.length >= max) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  timestamps.push(now);
  rateLimit.set(ip, timestamps);

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 📊 **12. Monitoring**

### Logs Prisma

Dans `.env` production, ajoutez:
```bash
DATABASE_URL="postgresql://...?connect_timeout=30&pool_timeout=30&statement_cache_size=0"
```

### Sentry (Optionnel)

```bash
npm install @sentry/nextjs

# .env
SENTRY_DSN=https://your-sentry-dsn
```

---

## 🔄 **13. Mises à Jour**

### Déployer une nouvelle version

```bash
# 1. Commit les changements
git add .
git commit -m "Update: description"

# 2. Push vers CapRover
git push caprover master

# 3. CapRover rebuild automatiquement
```

### Rollback

```bash
# Via interface CapRover
# Apps → moverz → Deployments → Revert to Previous Version
```

---

## 🐛 **14. Troubleshooting**

### L'app ne démarre pas

```bash
# Vérifier les logs
caprover logs --appName moverz

# Erreurs communes:
# - DATABASE_URL incorrect → Vérifier la connexion PostgreSQL
# - Port incorrect → Vérifier PORT=3001
# - Prisma schema pas généré → caprover exec --appName moverz --command "npx prisma generate"
```

### Erreur Database

```bash
# Vérifier la connexion PostgreSQL depuis le container
caprover exec --appName moverz --command "psql $DATABASE_URL -c 'SELECT 1;'"
```

### Images ne s'affichent pas

```bash
# Vérifier les permissions uploads
caprover exec --appName moverz --command "ls -la /app/uploads"

# Vérifier le volume persistant
# Dans CapRover: Apps → moverz → App Configs → Persistent Directories
```

### Out of Memory

Augmentez la RAM dans **App Configs**:
- Minimum recommandé: **1GB**
- Optimal: **2GB**

---

## 📚 **15. Checklist de Déploiement**

### Avant le déploiement
- [ ] `google-credentials.json` présent dans le projet
- [ ] `.env.local` **NON** commité (dans `.gitignore`)
- [ ] Variables d'env configurées dans CapRover
- [ ] PostgreSQL créé et accessible
- [ ] `Dockerfile` créé
- [ ] `captain-definition` créé
- [ ] `next.config.ts` avec `output: 'standalone'`

### Après le déploiement
- [ ] App démarre sans erreur (check logs)
- [ ] `curl https://moverz.votre-domaine.com/` → 200 OK
- [ ] Migrations Prisma exécutées
- [ ] Test upload photo → SUCCESS
- [ ] Images servies correctement
- [ ] HTTPS activé
- [ ] Monitoring configuré

---

## 🎯 **Résumé des Commandes**

```bash
# Déploiement initial
git init
git add .
git commit -m "Initial deployment"
git remote add caprover https://git@captain.votre-domaine.com/moverz.git
git push caprover master

# Migrations
caprover exec --appName moverz --command "npx prisma migrate deploy"

# Logs
caprover logs --appName moverz --follow

# Mise à jour
git add .
git commit -m "Update"
git push caprover master

# Shell dans le container
caprover exec --appName moverz
```

---

## 📞 **Support**

**Erreurs de déploiement**: Consultez les logs CapRover  
**Erreurs Prisma**: https://www.prisma.io/docs/  
**Erreurs Next.js**: https://nextjs.org/docs/  

---

**Dernière mise à jour**: 1er octobre 2025  
**Validé pour**: CapRover 1.10+, Next.js 15, Prisma 6  
**Status**: ✅ Production Ready

