# 🏗️ Architecture Moverz v3.1

Documentation technique de l'architecture système.

---

## 📊 Vue d'Ensemble

Moverz v3.1 est une application **Next.js 15** avec **App Router**, structurée en **monorepo** et utilisant **PostgreSQL** pour la production.

### Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Framework** | Next.js | 15.5.4 |
| **Runtime** | Node.js | 20-24 |
| **Package Manager** | pnpm | latest |
| **Base de données** | PostgreSQL / SQLite | - |
| **ORM** | Prisma | 6.16.3 |
| **Queue** | BullMQ + Redis | 5.x |
| **IA** | OpenAI + Anthropic Claude | - |
| **UI** | React 19 + Tailwind CSS 4 | - |
| **Storage** | AWS S3 / Local | - |

---

## 🏛️ Structure Monorepo

### Packages

```
packages/
├── core/               # @moverz/core
│   ├── db.ts          # Prisma client singleton
│   ├── auth.ts        # Auth middleware
│   ├── storage.ts     # File storage abstraction
│   ├── s3Client.ts    # S3/MinIO client
│   └── schemas.ts     # Zod validation schemas
│
├── ai/                 # @moverz/ai
│   ├── engine.ts      # AI facade (unified interface)
│   ├── adapters/      # Provider adapters
│   │   ├── claude.ts
│   │   ├── openai.ts
│   │   └── roomBasedAnalysis.ts
│   ├── metrics/       # AI metrics collection
│   │   ├── collector.ts
│   │   └── cost.ts
│   └── middleware/
│       └── withAiMetrics.ts
│
└── ui/                 # @moverz/ui
    └── src/           # 18 shared components
        ├── Button.tsx
        ├── Card.tsx
        └── ...
```

### Application

```
app/
├── api/               # API Routes (App Router)
│   ├── photos/
│   │   ├── analyze/
│   │   └── analyze-by-room/
│   ├── rooms/
│   ├── batches/
│   ├── upload/
│   ├── ai-metrics/
│   └── admin/
│
├── admin/             # Pages admin
│   ├── page.tsx
│   └── metrics/
│
├── batches/           # Pages batches
│   └── [id]/
│
├── page.tsx           # Page principale
├── layout.tsx         # Layout root
└── globals.css        # Styles globaux
```

---

## 🗄️ Base de Données

### Provider

- **Développement** : SQLite (`prisma/dev.db`)
- **Production** : PostgreSQL (Neon ou autre)

### Modèles Prisma

| Table | Description | Relations |
|-------|-------------|-----------|
| `User` | Utilisateurs | → projects, rooms, modifications |
| `Room` | Pièces détectées | → user |
| `Project` | Projets déménagement | → user, photos, batches |
| `Photo` | Photos uploadées | → project, batch |
| `Batch` | Lots d'analyse | → project, photos |
| `UserModification` | Modifications manuelles | → user |
| `AiMetric` | Métriques IA (observabilité) | - |
| `Asset` | Fichiers S3 | - |
| `Job` | Jobs asynchrones | - |

### Migrations

```bash
prisma/migrations/
├── 20251008061154_init_postgres_from_sqlite/          # LOT 5
├── 20251008071731_add_ai_metrics_observability/       # LOT 7.5
├── 20251008074600_add_asset_job_s3_upload/            # LOT 8
├── 20251008082722_lot10_add_photo_analysis_fields/    # LOT 10
└── 20251008084103_lot11_add_batch_orchestration/      # LOT 11
```

**Total** : 5 migrations appliquées

---

## 🤖 Moteur IA

### Architecture

```
┌─────────────────────────────────────────────┐
│          Application Layer                  │
│  (API Routes, Components)                   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│        @ai/engine (Facade)                  │
│  - analyzePhoto()                           │
│  - detectRoomType()                         │
│  - classifyRoom()                           │
└──────────────┬──────────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐      ┌──────────┐
│ Claude   │      │ OpenAI   │
│ Adapter  │      │ Adapter  │
└──────────┘      └──────────┘
      │                 │
      ▼                 ▼
┌─────────────────────────────┐
│   AI Metrics Collector      │
│   (latency, cost, tokens)   │
└─────────────────────────────┘
```

### Providers

**Claude (Anthropic)** :
- Modèle : `claude-3-5-haiku-20241022`
- Usage : Analyse photos, détection pièces
- Pricing : ~$0.25 / 1M input tokens

**OpenAI** :
- Modèle : `gpt-4o-mini` (Vision)
- Usage : Fallback, analyse alternative
- Pricing : ~$0.15 / 1M input tokens

### A/B Testing

- **Variante A** : Mock classifier (pas d'IA, règles statiques)
- **Variante B** : Claude Haiku ou OpenAI GPT-4o-mini
- **Feature flag** : `ROOM_CLASSIFIER_AB_ENABLED=true`
- **Split** : `ROOM_CLASSIFIER_AB_SPLIT=10` (% trafic vers B)

---

## ⚡ Queues & Workers (BullMQ)

### Architecture

```
┌──────────────┐
│   Client     │
│   (Upload)   │
└──────┬───────┘
       │ POST /api/batches
       ▼
┌─────────────────────┐
│   API Route         │
│   (Create batch)    │
└──────┬──────────────┘
       │ Enqueue jobs
       ▼
┌─────────────────────┐        ┌─────────────┐
│   Redis             │◄───────│   Workers   │
│   (BullMQ)          │        │   (Node.js) │
└──────┬──────────────┘        └──────┬──────┘
       │                              │
       │ pub/sub                      │ Process jobs
       ▼                              ▼
┌─────────────────────┐        ┌─────────────┐
│   SSE Clients       │        │  PostgreSQL │
│   (Real-time UI)    │        │  (Results)  │
└─────────────────────┘        └─────────────┘
```

### Queues

| Queue | Description | Concurrency |
|-------|-------------|-------------|
| `photo-analyze` | Analyse IA des photos | 2 |
| `inventory-sync` | Agrégation inventaire | 2 |

### Workers

**Script** : `scripts/worker.js`

**Retry Policy** :
- Max attempts : 3
- Backoff : Exponentiel (5s, 20s, 80s)

**Métriques** :
- Durée traitement
- Taux succès/échec
- Jobs pending/active

---

## 📡 API Endpoints

### Photos

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/photos/analyze` | POST | Analyser une photo (multipart) |
| `/api/photos/analyze-by-room` | POST | Analyser par pièce (JSON) |

### Rooms

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/rooms` | GET | Lister pièces par userId |
| `/api/rooms` | POST | Créer une pièce |
| `/api/room-groups` | GET | Groupes de pièces |

### Batches

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/batches` | POST | Créer un batch d'analyse |
| `/api/batches/[id]` | GET | Progress batch |
| `/api/batches/[id]/stream` | GET | SSE stream temps réel |
| `/api/batches/[id]/export` | GET | Export CSV/PDF |

### Admin

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai-status` | GET | Statut services IA |
| `/api/ai-metrics/summary` | GET | Métriques agrégées |
| `/api/ab-status` | GET | Statistiques A/B testing |

**Auth** : Header `x-user-id` requis (dev), JWT en production (TODO)

---

## 📊 Observabilité

### Métriques IA

**Table** : `AiMetric`

**Collecte** :
- Provider (openai, claude, mock)
- Modèle
- Latence (ms)
- Tokens in/out
- Coût (USD)
- Success/échec

**Rotation** : JSONL + DB (double écriture)

### SSE (Server-Sent Events)

**Endpoint** : `/api/batches/[id]/stream`

**Events** :
- `progress` : Mise à jour progression
- `heartbeat` : Keepalive (30s)
- `complete` : Batch terminé
- `error` : Erreur traitement

**Backend** : Redis Pub/Sub → SSE clients

### Bull Board

**Dashboard** : http://localhost:3010/admin/queues

**Métriques** :
- Jobs waiting/active/completed/failed
- Latences moyennes
- Retry history
- Error logs

---

## 🔐 Sécurité

### Authentification (Actuelle)

**Dev** : Header `x-user-id` (simple)

**Production (Recommandé)** :
- JWT tokens
- OAuth2 / NextAuth.js
- CORS configuré (`CORS_ORIGIN`)

### Validation

- **Schémas Zod** : Tous les inputs API
- **File upload** : Max 50MB, MIME whitelisting
- **SQL Injection** : Prisma ORM (parameterized queries)

### Environnement

- **Secrets** : Variables d'environnement (`.env`)
- **API Keys** : Jamais committées (`.gitignore`)
- **JWT Secret** : Strong random en production

---

## 🚀 Performance

### Caching

- **Redis** : Cache batch progress (TTL 10s, hit rate >90%)
- **Next.js** : Static generation + ISR où applicable

### Optimisations

- **DB** : Indexes sur `userId`, `projectId`, `batchId`, `status`
- **AI** : Timeouts (30s), retries (2x)
- **Images** : Redimensionnement avant analyse (max 1024px)
- **Upload** : Direct S3 (pas de proxy API)

### Monitoring

- **AI Latency** : P50/P95/P99 collectées
- **DB Queries** : Prisma query logs en dev
- **Queue Backlog** : Alerts si >100 jobs waiting

---

## 🔄 Flux Utilisateur

### Upload & Analyse

```
1. User upload photos
   └─> POST /api/batches
       └─> Create Batch (QUEUED)
       └─> Enqueue N jobs → photo-analyze queue

2. Workers process jobs
   └─> Fetch photo
   └─> Call AI (Claude/OpenAI)
   └─> Save analysis to DB
   └─> Update Batch counters
   └─> Publish Redis event

3. SSE client receives updates
   └─> Update UI (progress bar)
   └─> On completion: trigger inventory-sync

4. Inventory aggregation
   └─> Worker processes inventory-sync job
   └─> Aggregate results
   └─> Final batch status: COMPLETED
```

---

## 📚 Références Techniques

- **Next.js 15 App Router** : https://nextjs.org/docs/app
- **Prisma ORM** : https://www.prisma.io/docs
- **BullMQ** : https://docs.bullmq.io/
- **Anthropic Claude** : https://docs.anthropic.com/
- **OpenAI API** : https://platform.openai.com/docs

---

## 🛠️ Évolution Prévue

### Court Terme
- [ ] JWT auth complète
- [ ] Rate limiting API
- [ ] Monitoring Prometheus/Grafana

### Moyen Terme
- [ ] Multi-tenancy
- [ ] Export Excel/PDF avancé
- [ ] Webhooks pour intégrations

### Long Terme
- [ ] Mobile app (React Native)
- [ ] Marketplace connecteurs
- [ ] ML custom models

---

**Version** : Moverz v3.1  
**Dernière mise à jour** : 12 octobre 2025

