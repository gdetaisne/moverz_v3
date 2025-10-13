# 📚 Archive - Documentation Historique

Cette archive contient la documentation technique et les rapports historiques du projet Moverz v3.

**⚠️ Note** : Ces documents sont conservés pour référence historique. Consultez la documentation principale (`/docs/`) pour les informations à jour.

---

## 📁 Structure de l'Archive

```
docs/archive/
├── lots/              # Rapports LOT 5-18 (développements majeurs)
├── bugfixes/          # Rapports de corrections bugs
├── cleanup/           # Rapports de nettoyage code
├── migration/         # Rapports migration PostgreSQL
└── [autres]/          # Documentation technique diverse
```

---

## 📊 Rapports LOT (lots/)

Développements majeurs d'octobre 2025 (LOT 5-18) :

### Infrastructure & Database

| LOT | Titre | Lignes | Description |
|-----|-------|--------|-------------|
| 5 | Migration PostgreSQL | 610 | SQLite → PostgreSQL (Neon) |
| 6 | Refactor Monorepo | 173 | Structure packages @core, @ai, @ui |

### Robustesse & Tests

| LOT | Titre | Lignes | Description |
|-----|-------|--------|-------------|
| 7.1 | AI Robustness | - | Timeouts, retries, métriques |
| 7.2 | UI Finalisation | 160 | 18 composants partagés |
| 7.3 | Tests | 242 | Vitest + 40+ tests |
| 7.4 | CI/CD | 207 | GitHub Actions |
| 7.5 | Observability | 333 | Métriques IA (AiMetric table) |

### Queues & Workers

| LOT | Titre | Lignes | Description |
|-----|-------|--------|-------------|
| 8 | Direct S3 Upload | 280 | Presigned URLs S3 |
| 9 | Queue & Workers | 312 | BullMQ + Redis integration |
| 10 | Pipeline IA Async | 713 | Traitement asynchrone complet |
| 11 | Upload Multi & Orchestration | 548 | Batch processing + events |
| 12 | Temps Réel SSE | 602 | Server-Sent Events |
| 12.1 | Bull Board Dashboard | 641 | UI monitoring queues |
| 13 | Redis Pub/Sub + Cache | 735 | Cache Redis + SSE réactif |

### Features Avancées

| LOT | Titre | Lignes | Description |
|-----|-------|--------|-------------|
| 15 | Export CSV/PDF | 604 | Export batches |
| 18 | A/B Testing | 405 | Feature flags + variantes |
| 18.1 | Monitoring Dashboard | 477 | Page /admin/metrics |

**Total** : ~8,000 lignes de documentation technique

**Accès** : `docs/archive/lots/LOT*.md`

---

## 🐛 Rapports Bugfix (bugfixes/)

Corrections de bugs majeurs :

| Fichier | Date | Problème Résolu |
|---------|------|-----------------|
| `BUGFIX_CHEMIN_UPLOADS.md` | 9 oct | Chemin `/api/uploads/` invalide |
| `BUGFIX_DOUBLONS_FRONTEND.md` | 9 oct | Doublons objets dans inventaire |
| `BUGFIX_IMAGE_LOADING.md` | 9 oct | Inventaire vide (décodage base64) |
| `BUGFIX_ROOMTYPE.md` | 9 oct | Détection pièce ne remontait pas |
| `BUGFIX_ROOMTYPE_ECRASE.md` | 9 oct | roomType écrasé par double setState |
| `FIX_BUTTON_DEVIS.md` | 9 oct | Bouton "Continuer vers devis" |
| `FIX_DOUBLONS_APPLIQUE.md` | 9 oct | Doublons backend (stockage unique) |
| `FIX_MOCK_ROOMBASED.md` | 9 oct | Mock écrasait IA réelle |
| `FIX_SAUVEGARDE_DB.md` | 11 oct | Sauvegarde photos en DB |

**Accès** : `docs/archive/bugfixes/`

---

## 🧹 Rapports Cleanup (cleanup/)

Nettoyages code et refactoring :

| Phase | Fichier | Description |
|-------|---------|-------------|
| 1 | `CLEANUP_STEP1_*.md` | Fichiers test & scripts inutilisés |
| 2 | `CLEANUP_STEP2_*.md` | Services IA & libs expérimentaux |
| 3 | `CLEANUP_STEP3_*.md` | Documentation & logs bruyants |
| 4 | `CLEANUP_STEP4_*.md` | Logger minimal + deps orphelines |

**Impact global** : Réduction ~3,000 lignes code mort

**Accès** : `docs/archive/cleanup/`

---

## 🗄️ Rapports Migration (migration/)

Documentation migration SQLite → PostgreSQL :

| Fichier | Taille | Description |
|---------|--------|-------------|
| `DB_MIGRATION_REPORT.md` | 610 | Rapport technique complet |
| `MIGRATION_CHECKLIST.md` | - | Checklist étapes migration |
| `START_HERE.md` | - | Guide migration rapide |
| `NEON_ENV_CONFIG.md` | - | Configuration Neon |
| `VALIDATION_FINALE.md` | 292 | Tests post-migration |
| `REFACTOR_PACKAGES_REPORT.md` | 173 | Monorepo refactoring |

**Accès** : `docs/archive/migration/`

---

## 📝 Documents Divers (racine archive/)

| Fichier | Description |
|---------|-------------|
| `AI_METRICS.md` | Guide métriques IA (LOT 7.5) |
| `ANALYTICS_*.md` | Setup analytics & tracking |
| `PRODUCTION_DB_FIXES_COMPLETE.md` | Fix DB production (12 oct 2025) |
| `CAPROVER_VARIABLES_VERIFIED.md` | Variables env vérifiées |
| `REVERSE_PROXY_SETUP.md` | Configuration reverse proxy |
| `RESILIENCE_FIXES.md` | Corrections résilience |
| `TRACKING_EXPLIQUE.md` | Explication tracking utilisateur |
| `README_v3.1.md` | Ancien README v3.1 |
| `README_LOTS_COMPLETS.md` | Résumé LOT 5-18 |
| `CHANGELOG_v3.1.md` | Ancien changelog |

**Accès** : `docs/archive/`

---

## 🔍 Comment Utiliser l'Archive

### Rechercher une Information

```bash
# Chercher dans tous les documents archivés
grep -r "votre-recherche" docs/archive/

# Chercher dans les LOTs
grep -r "PostgreSQL" docs/archive/lots/

# Lister tous les rapports LOT
ls docs/archive/lots/
```

### Consulter un Rapport Spécifique

```bash
# Exemple : LOT 13 (Redis Pub/Sub)
cat docs/archive/lots/LOT13_REPORT.md

# Exemple : Bugfix doublons
cat docs/archive/bugfixes/BUGFIX_DOUBLONS_FRONTEND.md
```

### Restaurer un Document

Si vous avez besoin de remettre un document à la racine :

```bash
# Copier (pas déplacer, garder archive)
cp docs/archive/lots/LOT10_AI_PIPELINE_REPORT.md ./

# Puis consulter
cat LOT10_AI_PIPELINE_REPORT.md
```

---

## 📊 Statistiques Archive

**Total documents archivés** : ~75 fichiers markdown

**Répartition** :
- Rapports LOT : 25 fichiers (~8,000 lignes)
- Bugfixes : 9 fichiers (~2,500 lignes)
- Cleanup : 6 fichiers (~2,000 lignes)
- Migration : 7 fichiers (~2,000 lignes)
- Divers : ~30 fichiers (~5,000 lignes)

**Total** : ~20,000 lignes de documentation technique

---

## ⚠️ Avertissement

### Documents Obsolètes

Certains documents archivés peuvent contenir :
- ❌ Procédures obsolètes (ex: migration SQLite déjà appliquée)
- ❌ Configurations dépassées
- ❌ Bugs déjà corrigés

### Référence Uniquement

Utilisez l'archive **uniquement** pour :
- ✅ Comprendre l'historique du projet
- ✅ Retrouver une décision d'architecture
- ✅ Débugger un comportement ancien
- ✅ Apprendre des erreurs passées

**Pour toute information à jour**, consultez :
- [`/README.md`](../../README.md) - Vue d'ensemble projet
- [`/docs/getting-started/`](../getting-started/) - Guides démarrage
- [`/docs/architecture/`](../architecture/) - Architecture actuelle
- [`/docs/deployment/`](../deployment/) - Déploiement production
- [`/docs/operations/`](../operations/) - Administration système

---

## 🗂️ Organisation des Archives

### Par Date

```bash
# LOTs : 8 octobre 2025
# Bugfixes : 9-11 octobre 2025
# Cleanup : 8 octobre 2025
# Migration : 8 octobre 2025
```

### Par Thème

**Infrastructure** :
- LOT 5, 6, 8, 9
- Rapports migration

**Features** :
- LOT 10, 11, 12, 12.1, 13, 15, 18
- Bugfixes applicatifs

**Qualité** :
- LOT 7.1-7.5
- Rapports cleanup

---

**Créé le** : 12 octobre 2025  
**Archive gelée à** : v3.1.0  
**Prochaine archive** : v4.0.0 (future)

