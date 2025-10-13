# 📊 AI Metrics - Observability v1

**Version**: 1.0  
**Mise en place**: LOT 7.5  
**Objectif**: Mesurer, diagnostiquer, et optimiser les appels aux modèles IA

## 🎯 Vue d'Ensemble

Système d'observabilité centralisé pour tous les appels IA (Claude, OpenAI) avec:
- **Collecte automatique** (latence, succès/échec, tokens, coût)
- **Stockage double** (PostgreSQL + JSONL)
- **API de consultation** (summary, recent)
- **Overhead minimal** (< 5ms par appel)

## 📊 Schéma de Données

### Table `AiMetric` (PostgreSQL)

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Identifiant unique |
| `ts` | DateTime | Timestamp de l'appel |
| `provider` | String | 'anthropic' \| 'openai' \| 'mock' \| 'other' |
| `model` | String | Nom du modèle (ex: 'claude-3-5-haiku') |
| `operation` | String | Type d'opération ('analyzePhoto', 'detectRoom', etc.) |
| `latencyMs` | Int | Latence en millisecondes |
| `success` | Boolean | Succès ou échec |
| `errorType` | String? | Type d'erreur ('TIMEOUT', 'RATE_LIMIT', etc.) |
| `retries` | Int | Nombre de retries |
| `tokensIn` | Int? | Tokens d'entrée (estimés ou réels) |
| `tokensOut` | Int? | Tokens de sortie (estimés ou réels) |
| `costUsd` | Decimal(10,6) | Coût estimé en USD |
| `meta` | Json? | Métadonnées (userId, projectId, roomType, etc.) |

### Indexes
- `@@index([ts])` - Requêtes par période
- `@@index([provider, model])` - Breakdown par provider/model
- `@@index([success])` - Taux d'erreur
- `@@index([operation])` - Métriques par opération

## 🔧 Variables d'Environnement

```bash
# Activation (default: true)
AI_METRICS_ENABLED=true

# Configuration queue
AI_METRICS_QUEUE_MAX=1000          # Max events en mémoire
AI_METRICS_FLUSH_MS=2000           # Intervalle flush (ms)

# JSONL (dev uniquement)
AI_METRICS_DIR=.next/metrics       # Dossier JSONL
```

## 📡 API Endpoints

### `GET /api/ai-metrics/summary`

**Agrégations sur 24h glissantes**

**Query params**:
- `from` (ISO date, optionnel)
- `to` (ISO date, optionnel)

**Réponse**:
```json
{
  "range": { "from": "...", "to": "..." },
  "total": 150,
  "success": 142,
  "failed": 8,
  "successRate": 94.67,
  "latency": { "p50": 1200, "p95": 3500, "max": 5200 },
  "retriesAvg": 0.15,
  "tokensAvg": { "in": 1500, "out": 400 },
  "costTotal": 0.45,
  "byProvider": { "anthropic": { "count": 100, "cost": 0.30 }, ... },
  "byModel": { "claude-3-5-haiku": { "count": 80, "cost": 0.20 }, ... },
  "byOperation": { "analyzePhoto": { "count": 100, "avgLatency": 1500, "successRate": 95 }, ... }
}
```

### `GET /api/ai-metrics/recent?limit=100`

**Derniers événements**

**Query params**:
- `limit` (max 500, default 100)

**Réponse**:
```json
{
  "count": 100,
  "limit": 100,
  "events": [
    {
      "id": "cm...",
      "ts": "2025-10-08T10:00:00Z",
      "provider": "anthropic",
      "model": "claude-3-5-haiku",
      "operation": "analyzePhoto",
      "latencyMs": 1200,
      "success": true,
      "errorType": null,
      "retries": 0,
      "tokensIn": 1500,
      "tokensOut": 400,
      "costUsd": 0.0012
    }
  ]
}
```

### `POST /api/dev-tools/simulate-ai-call`

**Simulation d'appels IA (dev-only)**

**Body**:
```json
{ "count": 20 }
```

**Réponse**:
```json
{
  "success": true,
  "simulated": 20,
  "sample": [ ... ]
}
```

## 📈 Calculs

### Estimation Tokens
- **Méthode**: ~4 caractères par token (borne basse conservative)
- **Formule**: `tokens = ceil(text.length / 4)`
- **Source**: Si le provider ne retourne pas les compteurs réels

### Estimation Coût
**Table de pricing (USD per 1K tokens)**:

| Modèle | Input | Output |
|--------|-------|--------|
| claude-3-5-sonnet | $3.00 | $15.00 |
| claude-3-5-haiku | $0.25 | $1.25 |
| gpt-4o | $5.00 | $15.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4-turbo | $10.00 | $30.00 |

**Formule**:
```
costUsd = (tokensIn / 1000) * inputPer1K + (tokensOut / 1000) * outputPer1K
```

## 🔍 Utilisation

### Simuler des appels
```bash
curl -X POST http://localhost:3001/api/dev-tools/simulate-ai-call \
  -H "content-type: application/json" \
  -d '{"count":20}'
```

### Consulter le summary
```bash
curl "http://localhost:3001/api/ai-metrics/summary" | jq .
```

### Consulter les récents
```bash
curl "http://localhost:3001/api/ai-metrics/recent?limit=10" | jq .
```

## 📂 Fichiers JSONL (Dev)

**Emplacement**: `.next/metrics/ai-metrics-YYYY-MM-DD.jsonl`

**Format**: 1 ligne JSON par événement
```json
{"ts":1759908665600,"provider":"anthropic","model":"claude-3-5-haiku","operation":"analyzePhoto","success":true,"latency_ms":1200,"retries":0,"input_tokens":1500,"output_tokens":400,"cost_usd":0.0012}
```

**Rotation**: Quotidienne (nouveau fichier chaque jour)  
**Limite**: 10 MB par fichier (best-effort)

## 🚀 Monitoring Production

### KPIs Clés
- **RPS**: `total / window_seconds`
- **Success Rate**: `(success / total) * 100`
- **p95 Latency**: Latence au 95e percentile
- **Cost/Call**: `costTotal / total`

### Alertes Recommandées
- Success rate < 90% → Incident
- p95 latency > 5s → Warning
- Cost/day > threshold → Budget alert
- Retry rate > 20% → Investigation

## 🔒 Sécurité

### Dev-Only Endpoints
- `/api/ai-metrics/*` désactivés en production (par défaut)
- Activation production: `ENABLE_AI_METRICS=true`

### Données Sensibles
- `meta` field exclue de l'endpoint `recent` (masquée)
- Pas de logs de contenu/images
- Uniquement métriques techniques

## 📊 Overhead

**Mesure locale** (dev):
- Collecte métrique: **< 1ms**
- Enqueue (mémoire): **< 0.1ms**
- Write DB (async): **Non bloquant**
- Write JSONL: **Non bloquant**

**Total overhead par appel IA**: **< 5ms** ✅

## 🧯 Rollback

### Désactiver complètement
```bash
AI_METRICS_ENABLED=false
```

### Supprimer la table
```bash
npx prisma migrate dev --create-only
# Éditer la migration pour DROP TABLE "AiMetric"
npx prisma migrate deploy
```

## 📚 Ressources

- **Migration**: `prisma/migrations/20251008071731_add_ai_metrics_observability/`
- **Collector**: `packages/ai/src/metrics/collector.ts`
- **Middleware**: `packages/ai/src/middleware/withAiMetrics.ts`
- **Tests**: `packages/ai/src/__tests__/{tokenEstimator,cost}.test.ts`
