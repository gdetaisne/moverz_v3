# 🚀 Démarrage Rapide - Moverz v3.1

Guide complet pour démarrer avec Moverz en développement.

---

## 📋 Prérequis

- **Node.js** : 20+ (actuellement Node 24)
- **Package Manager** : pnpm (recommandé) ou npm
- **Base de données** : PostgreSQL (production) ou SQLite (dev local)
- **Redis** : Optionnel (pour queues BullMQ en dev)

---

## ⚡ Installation Rapide

### 1. Cloner et Installer

```bash
git clone https://github.com/gdetaisne/moverz_v3.git
cd moverz_v3
pnpm install
```

### 2. Configuration Environnement

Créer `.env.local` à la racine :

```bash
# Base de données (dev local - SQLite)
DATABASE_URL="file:./prisma/dev.db"

# OU PostgreSQL (production/dev distant)
DATABASE_URL="postgresql://user:pass@host:5432/moverz"
DIRECT_URL="postgresql://user:pass@host:5432/moverz"

# APIs IA (au moins une requise)
OPENAI_API_KEY="sk-..."
CLAUDE_API_KEY="sk-ant-..."

# Application
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"

# JWT (dev)
JWT_SECRET="dev-secret-local"
JWT_EXPIRES_IN="7d"

# Redis (optionnel - pour queues)
REDIS_URL="redis://localhost:6379"

# S3/AWS (optionnel)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="moverz-uploads"
```

**💡 Note** : Seules `OPENAI_API_KEY` ou `CLAUDE_API_KEY` sont **obligatoires** pour l'analyse IA.

### 3. Initialiser la Base de Données

```bash
# Appliquer le schéma
pnpm prisma generate
pnpm prisma db push

# (Optionnel) Ouvrir Prisma Studio
pnpm prisma:studio
```

### 4. Démarrer l'Application

```bash
# Mode développement
pnpm dev

# Ouvrir dans le navigateur
# http://localhost:3001
```

---

## 🎯 Vérification Post-Installation

### Test 1 : Interface Web

```bash
# Ouvrir : http://localhost:3001
# ✅ Attendu : Page d'accueil visible
```

### Test 2 : API Health Check

```bash
curl http://localhost:3001/api/ai-status
# ✅ Attendu : {"openai":{"available":true},"claude":{...}}
```

### Test 3 : Upload & Analyse

```bash
# Upload une image via l'interface
# 1. Cliquer "Sélectionner des photos"
# 2. Choisir une image
# 3. Vérifier que l'analyse se lance
# ✅ Attendu : Objets détectés affichés
```

---

## 🏗️ Structure du Projet

```
moverz_v3-1/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # Pages admin
│   └── page.tsx           # Page principale
│
├── components/            # Composants React partagés
├── lib/                   # Utilities & helpers
├── services/              # Services IA runtime
│
├── packages/              # Monorepo packages
│   ├── core/             # @moverz/core (Prisma, auth, storage)
│   ├── ai/               # @moverz/ai (Engine IA, métriques)
│   └── ui/               # @moverz/ui (Composants partagés)
│
├── prisma/
│   ├── schema.prisma     # Schéma DB
│   └── migrations/       # Migrations SQL
│
├── scripts/              # Scripts utilitaires
└── docs/                 # Documentation
```

---

## 🔧 Commandes Utiles

### Développement

```bash
pnpm dev                  # Démarrer en mode dev
pnpm build                # Build production
pnpm start                # Démarrer build production
pnpm lint                 # Linter
```

### Base de Données

```bash
pnpm prisma:generate      # Générer client Prisma
pnpm prisma:studio        # Interface visuelle DB
pnpm db:push              # Appliquer schéma sans migration
pnpm db:reset             # Réinitialiser DB (⚠️ supprime données)
```

### Tests

```bash
pnpm test                 # Tests unitaires
pnpm test:unit            # Tests unitaires (run once)
pnpm smoke:api            # Tests smoke API
```

### Workers & Queues (Optionnel)

```bash
pnpm worker               # Démarrer workers BullMQ
pnpm bullboard            # Dashboard queues (port 3010)
```

---

## 🎓 Prochaines Étapes

### Pour Développer

1. **Architecture** : Lire [`docs/architecture/README.md`](../architecture/README.md)
2. **APIs** : Consulter [`docs/architecture/api-endpoints.md`](../architecture/api-endpoints.md)
3. **Base de données** : Guide [`docs/operations/database.md`](../operations/database.md)

### Pour Déployer

1. **Production** : Lire [`docs/deployment/README.md`](../deployment/README.md)
2. **CapRover** : Guide [`docs/deployment/caprover.md`](../deployment/caprover.md)
3. **Variables** : Référence [`docs/deployment/environment-variables.md`](../deployment/environment-variables.md)

### Pour Administrer

1. **Back-office** : Guide [`docs/operations/backoffice.md`](../operations/backoffice.md)
2. **Monitoring** : Métriques [`docs/operations/monitoring.md`](../operations/monitoring.md)
3. **Troubleshooting** : FAQ [`docs/operations/troubleshooting.md`](../operations/troubleshooting.md)

---

## 🐛 Problèmes Courants

### "Module not found: Can't resolve '@prisma/client'"

```bash
pnpm install @prisma/client
pnpm prisma generate
```

### "Port 3001 already in use"

```bash
# Tuer le processus existant
lsof -ti:3001 | xargs kill -9

# Ou changer de port
PORT=3002 pnpm dev
```

### "OpenAI API key not configured"

```bash
# Vérifier .env.local
echo $OPENAI_API_KEY

# Ajouter la clé
echo "OPENAI_API_KEY=sk-..." >> .env.local
```

### Base de données verrouillée (SQLite)

```bash
# Arrêter tous les processus Node
pkill -9 node

# Puis relancer
pnpm dev
```

---

## 📞 Support

- **Documentation complète** : [`docs/`](../)
- **Issues GitHub** : [github.com/gdetaisne/moverz_v3/issues](https://github.com/gdetaisne/moverz_v3/issues)
- **Guides opérationnels** : [`docs/operations/`](../operations/)

---

**Version** : Moverz v3.1  
**Dernière mise à jour** : 12 octobre 2025

