# 📊 Monitoring - Bull Board Dashboard

Guide de monitoring des workers et queues BullMQ avec Bull Board.

---

## 🎯 Vue d'ensemble

Le dashboard Bull Board permet de monitorer en temps réel:
- ✅ État des queues (`photo-analyze`, `inventory-sync`)
- ✅ Jobs en attente, actifs, complétés, échoués
- ✅ Logs et détails des jobs
- ✅ Retry et nettoyage des jobs

---

## 🚀 Installation

### Prérequis

```bash
# Installer les dépendances Bull Board
npm install @bull-board/express @bull-board/api express

# Ou avec pnpm (si workspace)
cd /path/to/root && pnpm add @bull-board/express @bull-board/api express
```

### Variables d'environnement

Ajouter à `.env` ou `.env.local` :

```bash
# Bull Board Dashboard
BULLBOARD_PORT=3010
BULLBOARD_TOKEN=your-secret-token-here

# Redis (si non défini)
REDIS_URL=redis://localhost:6379
```

⚠️ **Important** : Changer `BULLBOARD_TOKEN` en production !

---

## 🏃 Démarrage

### En développement

```bash
# Terminal 1 : Workers
node scripts/worker.js

# Terminal 2 : Bull Board Dashboard
node scripts/bullboard.js

# Terminal 3 : Application
npm run dev
```

**Dashboard accessible à** : http://localhost:3010/admin/queues

### Authentification

Le dashboard est protégé par token. Trois méthodes d'accès :

**1. Header HTTP** (recommandé) :
```bash
curl -H "x-access-token: your-secret-token-here" \
  http://localhost:3010/admin/api/stats
```

**2. Query param** (navigateur) :
```
http://localhost:3010/admin/queues?token=your-secret-token-here
```

**3. Dev mode** (sans token) :
```bash
# Si NODE_ENV=development ET BULLBOARD_TOKEN non défini
# → Accès libre (dev uniquement)
```

---

## 📊 Interface Web

### Accès au dashboard

Ouvrir dans le navigateur :
```
http://localhost:3010/admin/queues?token=your-token
```

### Fonctionnalités UI

**Vue d'ensemble des queues** :
- 📊 Statistiques en temps réel (waiting, active, completed, failed)
- 🔄 Auto-refresh toutes les 5 secondes
- 📈 Graphiques de progression

**Détails des jobs** :
- 🔍 Inspecter les données d'entrée et sortie
- 📝 Voir les logs et stack traces
- ⏱️ Temps d'exécution et tentatives
- 🔁 Retry manuel d'un job échoué

**Actions disponibles** :
- ▶️ Retry job individuel
- 🗑️ Supprimer job
- ⏸️ Pause/Resume queue
- 🧹 Clean completed/failed jobs

---

## 🛠️ API Endpoints

Le dashboard expose également une API REST pour automation.

### GET /health

Vérifier l'état du service.

```bash
curl http://localhost:3010/health
```

**Réponse** :
```json
{
  "status": "ok",
  "timestamp": "2025-10-08T10:00:00.000Z",
  "redis": "ready",
  "queues": ["photo-analyze", "inventory-sync"]
}
```

### GET /admin/api/stats

Statistiques globales des queues.

```bash
curl -H "x-access-token: your-token" \
  http://localhost:3010/admin/api/stats
```

**Réponse** :
```json
{
  "timestamp": "2025-10-08T10:00:00.000Z",
  "stats": {
    "photo-analyze": {
      "waiting": 5,
      "active": 2,
      "completed": 1234,
      "failed": 3,
      "delayed": 0,
      "total": 1244
    },
    "inventory-sync": {
      "waiting": 0,
      "active": 1,
      "completed": 456,
      "failed": 0,
      "delayed": 0,
      "total": 457
    }
  }
}
```

### GET /admin/api/failed

Récupérer les jobs échoués récents.

```bash
# Par défaut: 10 derniers jobs de photo-analyze
curl -H "x-access-token: your-token" \
  http://localhost:3010/admin/api/failed

# Personnalisé
curl -H "x-access-token: your-token" \
  "http://localhost:3010/admin/api/failed?queue=inventory-sync&limit=20"
```

**Réponse** :
```json
{
  "queue": "photo-analyze",
  "count": 3,
  "jobs": [
    {
      "id": "123",
      "name": "analyze",
      "data": { "photoId": "photo-123", "userId": "user-1" },
      "failedReason": "AI_TIMEOUT",
      "stacktrace": ["..."],
      "attemptsMade": 3,
      "timestamp": 1696776000000,
      "processedOn": 1696776100000,
      "finishedOn": 1696776200000
    }
  ]
}
```

### POST /admin/api/retry-failed

Réessayer tous les jobs échoués d'une queue.

```bash
# Retry photo-analyze (défaut)
curl -X POST \
  -H "x-access-token: your-token" \
  http://localhost:3010/admin/api/retry-failed

# Retry queue spécifique
curl -X POST \
  -H "x-access-token: your-token" \
  -H "Content-Type: application/json" \
  -d '{"queue": "inventory-sync"}' \
  http://localhost:3010/admin/api/retry-failed
```

**Réponse** :
```json
{
  "queue": "photo-analyze",
  "total": 3,
  "retried": 3,
  "message": "Retried 3/3 failed jobs"
}
```

### POST /admin/api/clean

Nettoyer les jobs terminés anciens.

```bash
# Clean jobs > 1 heure (défaut)
curl -X POST \
  -H "x-access-token: your-token" \
  http://localhost:3010/admin/api/clean

# Clean jobs > 24 heures
curl -X POST \
  -H "x-access-token: your-token" \
  -H "Content-Type: application/json" \
  -d '{"queue": "photo-analyze", "grace": 86400000}' \
  http://localhost:3010/admin/api/clean
```

**Réponse** :
```json
{
  "queue": "photo-analyze",
  "cleaned": 1234,
  "message": "Cleaned 1234 completed jobs older than 3600000ms"
}
```

---

## 🐳 Déploiement Docker/CapRover

### Dockerfile (optionnel)

Créer `Dockerfile.bullboard` :

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY scripts/bullboard.js ./scripts/

EXPOSE 3010

CMD ["node", "scripts/bullboard.js"]
```

### CapRover

**Option 1 : Service séparé**

Dans CapRover, créer une nouvelle app `moverz-bullboard` :

```yaml
# captain-definition
{
  "schemaVersion": 2,
  "dockerfileLines": [
    "FROM node:18-alpine",
    "WORKDIR /app",
    "COPY package*.json ./",
    "RUN npm install --production",
    "COPY scripts/bullboard.js ./scripts/",
    "EXPOSE 3010",
    "CMD [\"node\", \"scripts/bullboard.js\"]"
  ]
}
```

Variables d'environnement :
```
REDIS_URL=redis://redis:6379
BULLBOARD_TOKEN=super-secret-production-token
BULLBOARD_PORT=3010
NODE_ENV=production
```

**Option 2 : Processus dans le même container**

Ajouter dans `Dockerfile` principal :

```dockerfile
# Exposer port Bull Board
EXPOSE 3010

# Démarrer Bull Board en parallèle (supervisord ou PM2)
CMD ["sh", "-c", "node scripts/bullboard.js & npm start"]
```

---

## 🔒 Sécurité

### En production

✅ **À FAIRE** :
1. ✅ Changer `BULLBOARD_TOKEN` avec valeur forte aléatoire
2. ✅ Utiliser HTTPS (reverse proxy nginx/traefik)
3. ✅ Limiter l'accès réseau (firewall, VPN)
4. ✅ Activer rate limiting
5. ✅ Logger les accès

❌ **À ÉVITER** :
- ❌ Token par défaut en production
- ❌ Accès HTTP non chiffré
- ❌ Exposition publique sans auth supplémentaire
- ❌ Token dans URLs (logs)

### Exemple Nginx (reverse proxy)

```nginx
location /admin/queues {
    # Rate limiting
    limit_req zone=admin burst=10 nodelay;
    
    # IP whitelist
    allow 10.0.0.0/8;
    deny all;
    
    # Proxy vers Bull Board
    proxy_pass http://localhost:3010/admin/queues;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 📈 Métriques & Alerting

### Prometheus (optionnel)

Ajouter un exporter pour métriques BullMQ :

```bash
npm install bull-exporter
```

```javascript
// scripts/metrics-exporter.js
const { BullMQMetricsExporter } = require('bull-exporter');
const queues = [/* ... */];

const exporter = new BullMQMetricsExporter({
  queues,
  port: 9464,
});

exporter.start();
```

Métriques exposées :
- `bullmq_jobs_waiting`
- `bullmq_jobs_active`
- `bullmq_jobs_completed_total`
- `bullmq_jobs_failed_total`
- `bullmq_job_duration_seconds`

### Alertes (exemple)

**Alert sur échecs** :
```yaml
# Prometheus alert rule
- alert: BullMQHighFailureRate
  expr: rate(bullmq_jobs_failed_total[5m]) > 0.1
  for: 5m
  annotations:
    summary: "Queue {{ $labels.queue }} has high failure rate"
```

**Alert sur backlog** :
```yaml
- alert: BullMQJobsBacklog
  expr: bullmq_jobs_waiting > 100
  for: 10m
  annotations:
    summary: "Queue {{ $labels.queue }} has {{ $value }} waiting jobs"
```

---

## 🔍 Troubleshooting

### Dashboard ne démarre pas

**Erreur** : `Cannot find module '@bull-board/express'`

**Solution** :
```bash
npm install @bull-board/express @bull-board/api express
```

### Connexion Redis échoue

**Erreur** : `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution** :
```bash
# Vérifier Redis
redis-cli ping
# → PONG

# Vérifier REDIS_URL dans .env
echo $REDIS_URL
```

### Auth échoue

**Erreur** : `401 Unauthorized`

**Solution** :
```bash
# Vérifier le token
echo $BULLBOARD_TOKEN

# Tester avec le bon token
curl -H "x-access-token: $BULLBOARD_TOKEN" \
  http://localhost:3010/admin/api/stats
```

### Queues vides dans le dashboard

**Cause** : Workers non démarrés ou Redis différent

**Solution** :
```bash
# 1. Vérifier workers en cours
ps aux | grep worker

# 2. Vérifier REDIS_URL identique
# worker.js et bullboard.js doivent pointer vers le même Redis

# 3. Créer des jobs de test
node scripts/smoke-lot11.js
```

---

## 📚 Ressources

- [Bull Board Documentation](https://github.com/felixmosh/bull-board)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)

---

**Auteur** : Moverz Team  
**Version** : 1.0 (LOT 12.1)  
**Dernière mise à jour** : 8 octobre 2025



