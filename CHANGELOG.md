# Changelog - Moverz v3.1

Toutes les modifications notables du projet sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [3.1.0] - 2025-10-12

### 🔧 Fixed

#### Database & Infrastructure
- **Correction schema.prisma** : Aligné `provider = "postgresql"` avec les migrations appliquées
- **Dockerfile** : Utilise `prisma migrate deploy` au lieu de `prisma db push`
- **Régénération Prisma Client** : Client PostgreSQL généré correctement
- Résout erreur production : `URL must start with protocol 'file:'`

#### UI/UX
- **Formulaire** : Correction texte blanc sur fond blanc (inputs maintenant visibles)
- **Contraste** : Force texte gris foncé (#1f2937) sur inputs
- Ajout styles CSS pour tous types d'inputs (text, email, select, textarea)

### 📚 Documentation
- **Consolidation** : Réorganisation complète de 87 documents markdown
- **Guides créés** : Getting Started, Architecture, Deployment, Operations
- **Archivage** : LOT 5-18, bugfixes, cleanup reports archivés dans `docs/archive/`
- **Scripts** : Ajout `scripts/verify-db-setup.sh` pour validation DB

---

## [3.0.0] - 2025-10-08

### 🚀 Major Release - Production Ready

Transformation complète de Moverz avec **12 lots fonctionnels** (LOT 5-18).

### ✨ Added

#### LOT 5 : Migration PostgreSQL
- **Base de données** : Migration SQLite → PostgreSQL (Neon)
- **Connection pooling** : Support `DATABASE_URL` + `DIRECT_URL`
- **5 migrations appliquées** : Schema production-ready
- Performance : Latence DB <100ms

#### LOT 6 : Refactor Monorepo
- **Structure** : Monorepo npm workspaces
- **3 packages** : @moverz/core, @moverz/ai, @moverz/ui
- **Build time** : Réduction de 30% (19.4s → 13.65s)
- **Maintenabilité** : Séparation concerns claire

#### LOT 7 : Renforcement (5 phases)

**7.1 - AI Robustness**
- Timeouts configurables (30s default)
- Retries exponentiels (max 2)
- Error handling robuste

**7.2 - UI Finalisation**
- 18 composants partagés (@ui/*)
- 82% coverage UI
- Design system cohérent

**7.3 - Tests**
- Vitest configuré
- 40+ tests unitaires (100% passing)
- Smoke tests automatisés

**7.4 - CI/CD**
- GitHub Actions (6 jobs)
- PostgreSQL service intégré
- Artifacts (30j retention)

**7.5 - Observability**
- **Table AiMetric** : Collecte latence, coût, tokens
- **API métriques** : `/api/ai-metrics/summary`
- **Storage double** : PostgreSQL + JSONL rotation

#### LOT 8 : Upload Direct S3
- **Presigned URLs** : Upload direct client → S3
- **Models** : Asset + Job (Prisma)
- **Pattern S3** : `userId/yyyy/mm/dd/<uuid>.<ext>`
- **Validation** : MIME + taille (max 50MB)

#### LOT 9 : Queues BullMQ
- **Redis** : Integration BullMQ pour jobs asynchrones
- **2 queues** : photo-analyze, inventory-sync
- **Workers** : Concurrency 2, retry 3x exponentiel
- **Observabilité** : Métriques durée/succès

#### LOT 10 : Pipeline IA Async
- **Architecture** : API non-bloquante (202 Accepted)
- **Workers** : Traitement asynchrone photos
- **Idempotence** : Pas de double traitement
- **Status tracking** : PENDING → PROCESSING → DONE/ERROR

#### LOT 11 : Upload Multi-Photos & Orchestration
- **Batch model** : Nouvelle entité avec compteurs agrégés
- **Upload par lot** : POST `/api/batches` avec N photos
- **Orchestration** : Trigger automatique `inventory-sync`
- **Polling agrégé** : GET `/api/batches/:id` avec progression

#### LOT 12 : Temps Réel SSE
- **Server-Sent Events** : `/api/batches/[id]/stream`
- **Hook React** : `useBatchProgress()` avec EventSource
- **UI** : `BatchProgressBar` avec couleurs dynamiques
- **Pas de polling** : Zéro requête HTTP après connexion SSE

#### LOT 12.1 : Bull Board Dashboard
- **UI Dashboard** : Interface monitoring queues (port 3010)
- **API REST** : Stats, failed jobs, retry, clean
- **Auth** : Token HTTP header
- **Real-time** : Auto-refresh 5s

#### LOT 13 : Redis Pub/Sub + Cache
- **Pub/Sub** : Workers publient changements batch
- **SSE réactif** : Latence <10ms (pas de polling DB)
- **Cache Redis** : TTL 10s, hit rate >90%
- **Métriques** : SSE_LATENCY_MS, CACHE_HIT_RATIO

#### LOT 15 : Export CSV/PDF
- **Endpoint** : `/api/batches/[id]/export?format=csv|pdf`
- **CSV** : Données brutes (batch, photos, inventaire)
- **PDF** : Document formaté avec pdfkit
- **Composant** : `<ExportButton>` React
- **Auth** : Vérification ownership

#### LOT 18 : A/B Testing
- **Feature flags** : Système complet (`lib/flags.ts`)
- **Variantes** : A (mock) vs B (IA réelle)
- **Routage** : Hash MD5 déterministe
- **Métriques** : Comparaison performance A vs B
- **Dashboard** : `/api/ab-status` pour analytics

### 🔧 Fixed

- **Alias TypeScript** : Correction @ai/* → packages/ai/src/*
- **Chemins uploads** : Correction `/api/uploads/` → `/uploads/`
- **Doublons objets** : Fix agrégation frontend
- **Image loading** : Correction décodage base64 vs URLs
- **RoomType écrasé** : Fix double setState
- **Button devis** : Fix navigation Step 2 → Step 3
- **Mock IA** : Suppression mock hardcodé (analyse réelle)
- **Sauvegarde DB** : Photos persistées correctement

### 📊 Metrics

**Performance** :
- Build time : -30% (19.4s → 13.65s)
- DB latency : <100ms (PostgreSQL)
- AI overhead : <5ms (metrics)
- Upload : Direct S3 (0 proxy)

**Code** :
- +10,000 lignes (packages, infra, tests, docs)
- 40+ tests unitaires (100% passing)
- ~30% coverage
- 25+ commits atomiques

**Infrastructure** :
- SQLite → PostgreSQL
- Monolithe → Monorepo
- Sync → Async (queues)
- 0 observability → Full telemetry

---

## [2.0.0] - 2025-10 (Avant LOT 5)

### ✨ Version Initiale

- Next.js 15 avec App Router
- SQLite pour persistence
- OpenAI GPT-4o-mini pour analyse
- Upload local de photos
- Interface web basique
- Analyse synchrone

---

## Conventions

### Types de Commits

- **feat** : Nouvelle fonctionnalité
- **fix** : Correction de bug
- **docs** : Documentation seulement
- **style** : Formatage (sans changement code)
- **refactor** : Refactoring (sans changement comportement)
- **perf** : Amélioration performance
- **test** : Ajout/modification tests
- **chore** : Tâches maintenance (deps, config)

### Versioning

Le projet suit [Semantic Versioning](https://semver.org/lang/fr/) :
- **MAJOR** : Breaking changes
- **MINOR** : Nouvelles features (backward compatible)
- **PATCH** : Bug fixes (backward compatible)

---

## Feuille de Route

### v3.2 (Q4 2025)

#### Sécurité
- [ ] JWT Auth complète (remplacement `x-user-id` header)
- [ ] Rate limiting API (10 req/s par user)
- [ ] RBAC (rôles user/admin)

#### Features
- [ ] Mobile app (React Native)
- [ ] Export Excel (XLSX)
- [ ] Webhooks pour intégrations
- [ ] Multi-tenancy

#### Performance
- [ ] CDN pour assets statiques
- [ ] Caching avancé (ISR Next.js)
- [ ] Lazy loading composants

### v4.0 (2026)

#### IA Avancée
- [ ] Custom ML models (fine-tuning)
- [ ] Reconnaissance 3D volumétrique
- [ ] OCR documents déménagement

#### Intégrations
- [ ] CRM (HubSpot, Salesforce)
- [ ] Facturation (Stripe)
- [ ] Signature électronique

---

**Maintenu par** : Équipe Moverz  
**Dernière mise à jour** : 12 octobre 2025

