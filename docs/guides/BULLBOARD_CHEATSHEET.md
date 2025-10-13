# Bull Board Dashboard - Aide-mémoire 📋

## 🚀 Commandes Rapides

```bash
# Démarrer le dashboard
npm run bullboard

# Tester le dashboard
BULLBOARD_TOKEN=secret123 bash scripts/test-bullboard.sh

# Arrêter le dashboard
pkill -f bullboard.js
```

## 🌐 URLs

| URL | Description |
|-----|-------------|
| http://localhost:3010/health | Health check (no auth) |
| http://localhost:3010/admin/queues | UI Dashboard (auth required) |
| http://localhost:3010/admin/queues?token=secret123 | UI avec token en query param |

## 🔐 Authentification

**Via header :**
```bash
curl -H "x-access-token: secret123" http://localhost:3010/admin/api/stats
```

**Via query param :**
```bash
curl "http://localhost:3010/admin/api/stats?token=secret123"
```

**Token par défaut (dev) :** `secret123`

## 📊 API REST

### 1. Health Check
```bash
curl http://localhost:3010/health
```

### 2. Statistiques Globales
```bash
curl -H "x-access-token: secret123" \
  http://localhost:3010/admin/api/stats | jq
```

### 3. Jobs Échoués
```bash
# Queue photo-analyze
curl -H "x-access-token: secret123" \
  "http://localhost:3010/admin/api/failed?queue=photo-analyze&limit=10" | jq

# Queue inventory-sync
curl -H "x-access-token: secret123" \
  "http://localhost:3010/admin/api/failed?queue=inventory-sync&limit=10" | jq
```

### 4. Retry Jobs Échoués
```bash
curl -X POST \
  -H "x-access-token: secret123" \
  -H "Content-Type: application/json" \
  -d '{"queue": "photo-analyze"}' \
  http://localhost:3010/admin/api/retry-failed | jq
```

### 5. Nettoyer Jobs Complétés
```bash
# Grace period: 1 heure (3600000 ms)
curl -X POST \
  -H "x-access-token: secret123" \
  -H "Content-Type: application/json" \
  -d '{"queue": "photo-analyze", "grace": 3600000}' \
  http://localhost:3010/admin/api/clean | jq

# Grace period: 24 heures (86400000 ms)
curl -X POST \
  -H "x-access-token: secret123" \
  -H "Content-Type: application/json" \
  -d '{"queue": "photo-analyze", "grace": 86400000}' \
  http://localhost:3010/admin/api/clean | jq
```

## 🔧 Variables d'Environnement

```bash
# Fichier .env
REDIS_URL=redis://localhost:6379
BULLBOARD_TOKEN=secret123
BULLBOARD_PORT=3010
NODE_ENV=development
```

**Démarrer avec variables custom :**
```bash
BULLBOARD_PORT=3020 BULLBOARD_TOKEN=my-token npm run bullboard
```

## 🧪 Tests

```bash
# Test complet
BULLBOARD_TOKEN=secret123 bash scripts/test-bullboard.sh

# Test health uniquement
curl -sS http://localhost:3010/health

# Test auth (doit retourner 401)
curl -sS http://localhost:3010/admin/api/stats
```

## 🐛 Troubleshooting

### Redis non connecté
```bash
# Vérifier Redis
redis-cli ping  # → PONG

# Démarrer Redis
redis-server
# ou
brew services start redis
```

### Port déjà utilisé
```bash
# Tuer processus existant
pkill -f bullboard.js

# Ou changer de port
BULLBOARD_PORT=3020 npm run bullboard
```

### Token incorrect
```bash
# Vérifier le token défini
grep BULLBOARD_TOKEN .env

# Utiliser le bon token
curl -H "x-access-token: votre-token-ici" ...
```

## 📁 Queues Surveillées

| Queue | Description |
|-------|-------------|
| `photo-analyze` | Analyse IA des photos uploadées |
| `inventory-sync` | Synchronisation de l'inventaire |

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `QUICKSTART_BULLBOARD.md` | Démarrage rapide |
| `MONITORING.md` | Guide complet (639 lignes) |
| `LOT12.1_REPORT.md` | Rapport technique détaillé |
| `LOT12.1_DELIVERY.md` | Document de livraison |
| `LOT12.1_SUMMARY.md` | Résumé exécutif |

## 🔥 One-liners Utiles

```bash
# Stats rapides (JSON formaté)
curl -sH "x-access-token: secret123" localhost:3010/admin/api/stats | jq '.stats'

# Compter jobs échoués
curl -sH "x-access-token: secret123" "localhost:3010/admin/api/failed?queue=photo-analyze" | jq '.count'

# Watch stats (refresh 5s)
watch -n5 'curl -sH "x-access-token: secret123" localhost:3010/admin/api/stats | jq'

# Ouvrir dashboard dans navigateur (macOS)
open "http://localhost:3010/admin/queues?token=secret123"
```

## ⚡ Workflow Dev Complet

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Workers
npm run worker

# Terminal 3: Bull Board
npm run bullboard

# Terminal 4: App principale
npm run dev
```

**Accès :**
- App : http://localhost:3001
- Bull Board : http://localhost:3010/admin/queues?token=secret123

---

**Prêt !** 🎉



