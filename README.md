# 🏠 Moverz v3.1 - Inventaire Déménagement Intelligent

Application Next.js utilisant l'IA pour analyser automatiquement les photos et créer un inventaire de déménagement détaillé.

---

## ✨ Fonctionnalités

- **📸 Upload Multiple** : Téléchargez jusqu'à 10 photos par lot
- **🤖 Analyse IA** : Détection automatique des objets avec Claude/OpenAI
- **🏠 Classification Pièces** : Reconnaissance automatique des types de pièces
- **📦 Inventaire Structuré** : Dimensions, volumes, quantités calculés
- **💾 Traitement Asynchrone** : Files d'attente BullMQ pour performance
- **📊 Temps Réel** : Suivi en direct via Server-Sent Events (SSE)
- **📄 Export** : PDF et CSV pour devis professionnels
- **🔧 Back-Office** : Configuration IA et monitoring intégrés

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** : 20+ (testé avec Node 24)
- **Package Manager** : pnpm (recommandé) ou npm
- **API IA** : Clé OpenAI ou Claude (obligatoire)

### Installation (5 minutes)

```bash
# 1. Cloner le repo
git clone https://github.com/gdetaisne/moverz_v3.git
cd moverz_v3

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local et ajouter votre OPENAI_API_KEY ou CLAUDE_API_KEY

# 4. Initialiser la base de données
pnpm prisma generate
pnpm prisma db push

# 5. Démarrer en développement
pnpm dev

# ✅ Ouvrir http://localhost:3001
```

**🎯 Guide complet** : [`docs/getting-started/README.md`](./docs/getting-started/README.md)

---

## 📚 Documentation

### Pour Démarrer

| Guide | Description |
|-------|-------------|
| [🚀 Getting Started](./docs/getting-started/README.md) | Installation et premiers pas |
| [🏗️ Architecture](./docs/architecture/README.md) | Stack technique et structure |
| [🔧 Configuration](./docs/deployment/README.md) | Variables d'environnement |

### Pour Déployer

| Guide | Description |
|-------|-------------|
| [🚢 Déploiement](./docs/deployment/README.md) | Guide production complet |
| [⚙️ CapRover](./DEPLOY_NOW.md) | Déploiement CapRover (5 min) |
| [🔐 Sécurité](./docs/deployment/README.md#-sécurité-production) | Checklist sécurité |

### Pour Administrer

| Guide | Description |
|-------|-------------|
| [🎛️ Back-Office](./BACKOFFICE_QUICKSTART.md) | Interfaces admin (4) |
| [📊 Monitoring](./docs/operations/README.md) | Métriques et logs |
| [🗄️ Base de Données](./GUIDE_DATABASE.md) | Prisma Studio et SQL |
| [🐛 Troubleshooting](./docs/operations/README.md#-troubleshooting) | Résolution problèmes |

---

## 🏗️ Architecture

### Stack Technique

```
Framework     : Next.js 15 (App Router)
Runtime       : Node.js 20-24
Database      : PostgreSQL (prod) / SQLite (dev)
ORM           : Prisma 6.16
Queue         : BullMQ + Redis
IA            : Claude 3.5 Haiku + OpenAI GPT-4o-mini
UI            : React 19 + Tailwind CSS 4
Storage       : AWS S3 / Local
```

### Monorepo Structure

```
moverz_v3-1/
├── app/                  # Next.js App Router
│   ├── api/             # API Routes
│   └── admin/           # Pages admin
├── components/          # Composants React
├── packages/            # Monorepo packages
│   ├── core/           # @moverz/core (DB, auth, storage)
│   ├── ai/             # @moverz/ai (Engine IA, métriques)
│   └── ui/             # @moverz/ui (Composants partagés)
├── prisma/             # Schéma DB + migrations
├── scripts/            # Utilitaires
└── docs/               # Documentation consolidée
```

**🔍 Détails** : [`docs/architecture/README.md`](./docs/architecture/README.md)

---

## 🌐 Déploiement Production

**URL Production** : https://movers-test.gslv.cloud/inventaire-ia

### Variables Essentielles

```bash
# Base de données (PostgreSQL requis)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# IA (au moins une clé)
OPENAI_API_KEY="sk-proj-..."
CLAUDE_API_KEY="sk-ant-..."

# Application
NODE_ENV="production"
PORT=3001
CORS_ORIGIN="https://movers-test.gslv.cloud"
JWT_SECRET="CHANGER_EN_PRODUCTION"
BASE_PATH="/inventaire-ia"
```

**📖 Guide complet** : [`DEPLOY_NOW.md`](./DEPLOY_NOW.md) (5 min)

---

## 🔧 Commandes Utiles

### Développement

```bash
pnpm dev              # Démarrer en mode dev (port 3001)
pnpm build            # Build production
pnpm start            # Démarrer build production
pnpm lint             # Linter ESLint
```

### Base de Données

```bash
pnpm prisma:studio    # Interface visuelle DB (port 5555)
pnpm prisma:generate  # Générer client Prisma
pnpm db:push          # Appliquer schéma sans migration
pnpm db:reset         # Réinitialiser DB (⚠️ supprime données)
```

### Tests

```bash
pnpm test             # Tests unitaires (watch mode)
pnpm test:unit        # Tests unitaires (run once)
pnpm smoke:api        # Tests smoke API
```

### Workers & Queues (Optionnel)

```bash
pnpm worker           # Démarrer workers BullMQ
pnpm bullboard        # Dashboard queues (port 3010)
```

---

## 📊 Fonctionnalités Avancées

### A/B Testing

Test automatique de différentes variantes d'algorithmes IA :

```bash
# Activer A/B testing
ROOM_CLASSIFIER_AB_ENABLED=true
ROOM_CLASSIFIER_AB_SPLIT=10  # 10% trafic vers variante B

# Voir statistiques
curl https://movers-test.gslv.cloud/inventaire-ia/api/ab-status
```

### Métriques IA

Observabilité complète des appels IA (latence, coût, tokens) :

```bash
# Summary métriques
curl https://movers-test.gslv.cloud/inventaire-ia/api/ai-metrics/summary

# Dashboard admin
# https://movers-test.gslv.cloud/inventaire-ia/admin/metrics
```

### Export Batch

```bash
# Export CSV
curl -O "https://movers-test.gslv.cloud/inventaire-ia/api/batches/[id]/export?format=csv"

# Export PDF
curl -O "https://movers-test.gslv.cloud/inventaire-ia/api/batches/[id]/export?format=pdf"
```

---

## 🛠️ Back-Office

### Interfaces Disponibles

1. **Configuration IA** : Bouton "🔧 Back-office" sur page d'accueil
2. **Admin** : `/admin` - Statut système
3. **Métriques** : `/admin/metrics` - Monitoring détaillé
4. **Bull Board** : `:3010/admin/queues` - Queues (local uniquement)

**📖 Guide complet** : [`BACKOFFICE_QUICKSTART.md`](./BACKOFFICE_QUICKSTART.md)

---

## 📈 Métriques & Performance

### Benchmarks

| Métrique | Cible | Actuel |
|----------|-------|--------|
| API Response Time | <500ms | ✅ |
| DB Query Time | <100ms | ✅ |
| AI Latency (Claude) | <5s | ✅ 2-3s |
| Queue Processing | 2 jobs/s | ✅ |
| Uptime | >99.9% | ✅ |

### Optimisations

- **DB Indexes** : Sur userId, projectId, status
- **Redis Cache** : TTL 10s, hit rate >90%
- **AI Timeouts** : 30s avec retry (2x)
- **Image Resize** : Max 1024px avant analyse
- **Direct S3 Upload** : Pas de proxy API

---

## 🐛 Troubleshooting

### Problèmes Courants

**"Module not found: @prisma/client"**
```bash
pnpm prisma generate
```

**"Port 3001 already in use"**
```bash
lsof -ti:3001 | xargs kill -9
```

**"OpenAI API key not configured"**
```bash
# Ajouter dans .env.local
OPENAI_API_KEY=sk-proj-...
```

**Base de données verrouillée (SQLite)**
```bash
pkill -9 node
pnpm dev
```

**📖 Guide complet** : [`docs/operations/README.md#-troubleshooting`](./docs/operations/README.md#-troubleshooting)

---

## 🔐 Sécurité

### Checklist Production

- [x] PostgreSQL avec SSL (`sslmode=require`)
- [x] JWT_SECRET fort (32+ caractères)
- [x] API Keys en variables d'environnement
- [x] CORS configuré (pas `*`)
- [x] HTTPS avec certificat valide
- [ ] Rate limiting (TODO)
- [ ] JWT auth complète (TODO - actuellement `x-user-id` header)

---

## 📦 Changelog

Voir [`CHANGELOG.md`](./CHANGELOG.md) pour l'historique des versions.

**Version actuelle** : v3.1.0

**Dernières améliorations** :
- ✅ Migration PostgreSQL (LOT 5)
- ✅ Monorepo packages (LOT 6)
- ✅ Métriques IA (LOT 7.5)
- ✅ Upload direct S3 (LOT 8)
- ✅ Queues BullMQ (LOT 9-12)
- ✅ Redis Pub/Sub (LOT 13)
- ✅ Export CSV/PDF (LOT 15)
- ✅ A/B Testing (LOT 18)

---

## 🤝 Contribution

### Développement

```bash
# 1. Fork et clone
# 2. Créer branche feature
git checkout -b feat/ma-fonctionnalite

# 3. Commit avec convention
git commit -m "feat: description"
# Types: feat, fix, docs, style, refactor, test, chore

# 4. Push et Pull Request
```

### Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/)
- **Code** : ESLint + Prettier
- **Tests** : Coverage >70% pour nouvelles features
- **Docs** : Mise à jour obligatoire

---

## 📞 Support

- **Documentation** : [`docs/`](./docs/)
- **Issues GitHub** : [github.com/gdetaisne/moverz_v3/issues](https://github.com/gdetaisne/moverz_v3/issues)
- **Production** : https://movers-test.gslv.cloud/inventaire-ia

---

## 📄 Licence

Propriétaire - © 2025 Moverz

---

**Version** : v3.1.0  
**Dernière mise à jour** : 12 octobre 2025  
**Stack** : Next.js 15 + Prisma + BullMQ + Claude/OpenAI
