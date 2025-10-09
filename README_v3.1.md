# Moverz v3.1 - Inventaire par Pièce avec Carrousel

![CI](https://github.com/guillaumestehelin/moverz_v3/actions/workflows/ci.yml/badge.svg)

## 🎯 Nouvelles Fonctionnalités

### ✨ Workflow Optimisé
1. **Étape 1** : Upload des photos → Détection automatique de pièce
2. **Étape 1.5** : Validation/Classification des pièces (NOUVEAU)
3. **Étape 2** : Inventaire par pièce avec carrousel (REFACTORISÉ)
4. **Étape 3** : Génération du devis

### 🏠 Inventaire par Pièce
- **Regroupement intelligent** : Photos groupées par type de pièce
- **Carrousel de photos** : Navigation fluide entre les photos d'une pièce
- **Inventaire consolidé** : Objets regroupés par pièce, pas par photo
- **Interface intuitive** : Même taille de photos, navigation claire

### 🎠 Composants Carrousel
- `RoomPhotoCarousel` : Navigation avec flèches et miniatures
- `RoomInventoryCard` : Carte complète d'inventaire par pièce
- `RoomValidationStep` : Interface de validation des classifications
- `Step2RoomInventory` : Étape 2 refactorisée

### 🔧 Améliorations Techniques
- **Suppression détection doublons** : Plus nécessaire avec l'analyse par pièce
- **API optimisée** : Correction des erreurs 403 sur PATCH /api/photos/[id]
- **Types cohérents** : Interfaces TypeScript optimisées
- **Performance** : Analyse par groupe de photos plus efficace

## 🚀 Installation

```bash
# Cloner le repository
git clone https://github.com/gdetaisne/moverz_v3.1.git
cd moverz_v3.1

# Installer les dépendances
pnpm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés API

# Initialiser la base de données
pnpm db:push
pnpm db:generate

# Lancer en développement
pnpm dev --port 4000
```

## 🧪 Tests

```bash
# Test des APIs
curl -X POST http://localhost:4000/api/photos/analyze \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-image.jpg" \
  -F "userId=test-user"

# Vérifier le statut des IA
curl http://localhost:4000/api/ai-status

# Test du monitoring (LOT 18.1)
ADMIN_BYPASS_TOKEN=your-token node scripts/smoke-metrics.js
```

## 📊 Monitoring Lite (LOT 18.1)

### 🎯 Dashboard Admin

Accédez au dashboard de monitoring : `http://localhost:3001/admin/metrics`

**Configuration requise :**
```bash
# .env ou variables d'environnement
ADMIN_BYPASS_TOKEN=votre-token-secret-ici
```

Le dashboard affiche en temps réel :
- 📊 **A/B Room Classifier** : Comparaison variantes A vs B (success rate, latency, volume)
- 📦 **Batches** : Tendance 7 jours (créés, complétés, partiels, échoués)
- ⚡ **Queues BullMQ** : État actuel (waiting, active, completed, failed)

**Rafraîchissement automatique** : Toutes les 30 secondes

### 🔌 API Endpoints

Tous les endpoints nécessitent le header `x-admin-token` avec le token configuré.

#### GET /api/admin/metrics/ab-daily

Métriques A/B Room Classifier agrégées par jour.

```bash
# Résumé (7 derniers jours)
curl http://localhost:3001/api/admin/metrics/ab-daily?summary=true \
  -H "x-admin-token: your-token"

# Détails (14 derniers jours par défaut)
curl http://localhost:3001/api/admin/metrics/ab-daily?days=14 \
  -H "x-admin-token: your-token"
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "variant": "A",
      "totalCalls": 900,
      "successRate": 0.95,
      "avgLatencyMs": 50,
      "p95LatencyMs": 120
    },
    {
      "variant": "B",
      "totalCalls": 100,
      "successRate": 0.92,
      "avgLatencyMs": 1200,
      "p95LatencyMs": 2500
    }
  ]
}
```

#### GET /api/admin/metrics/batches

Métriques des batches (tendance 7 jours).

```bash
# Résumé
curl http://localhost:3001/api/admin/metrics/batches?summary=true \
  -H "x-admin-token: your-token"

# Détails par jour
curl http://localhost:3001/api/admin/metrics/batches?days=7 \
  -H "x-admin-token: your-token"
```

**Réponse (summary) :**
```json
{
  "success": true,
  "data": {
    "totalBatches": 150,
    "completed": 120,
    "partial": 20,
    "failed": 10,
    "completionRate": 0.8,
    "partialRate": 0.13,
    "failedRate": 0.07
  }
}
```

#### GET /api/admin/metrics/queues

Snapshot temps réel des queues BullMQ.

```bash
curl http://localhost:3001/api/admin/metrics/queues \
  -H "x-admin-token: your-token"
```

**Réponse :**
```json
{
  "success": true,
  "available": true,
  "timestamp": "2025-10-08T15:30:00.000Z",
  "queues": [
    {
      "name": "photo-analyze",
      "waiting": 5,
      "active": 2,
      "completedLastHour": 150,
      "failedLastHour": 3
    },
    {
      "name": "inventory-sync",
      "waiting": 0,
      "active": 1,
      "completedLastHour": 45,
      "failedLastHour": 0
    }
  ]
}
```

### 🔒 Sécurité

- Token admin requis pour tous les endpoints (header `x-admin-token`)
- Configuré via `ADMIN_BYPASS_TOKEN` dans les variables d'environnement
- Accès refusé (401) si token absent ou invalide
- Token stocké en localStorage côté client

### 🧪 Smoke Test

Validez l'installation complète :

```bash
# Avec token en variable d'environnement
ADMIN_BYPASS_TOKEN=test-token node scripts/smoke-metrics.js

# Le script va :
# 1. Insérer des métriques factices (AiMetric, Batch)
# 2. Tester tous les endpoints
# 3. Afficher les résultats
# 4. Nettoyer les données de test
```

**Résultat attendu :**
```
✅ Tous les tests passés (5/5)
💡 Accédez au dashboard: http://localhost:3001/admin/metrics
```

### 📈 Performance

- Endpoints < 300ms sur jeux de données modestes
- Agrégats calculés via SQL optimisé (percentiles, groupby)
- Indexes recommandés sur `AiMetric.ts`, `Batch.createdAt`
- Pas de dépendance lourde (charting maison SVG)

### ⚠️ Troubleshooting

**Erreur "Token admin requis"**
```bash
# Vérifiez que ADMIN_BYPASS_TOKEN est défini
echo $ADMIN_BYPASS_TOKEN

# Ou ajoutez dans .env
echo "ADMIN_BYPASS_TOKEN=mon-token-secret" >> .env
```

**Queues "non disponible"**
- BullMQ/Redis non démarré → Vérifiez `REDIS_URL`
- Aucun impact sur les autres widgets (A/B, Batches)

## 📱 Interface Utilisateur

### Étape 1.5 - Validation des Pièces
- Classification automatique des photos par pièce
- Interface de validation/correction
- Drag & drop pour réorganiser les photos
- Suggestions intelligentes

### Étape 2 - Inventaire par Pièce
- **Carrousel de photos** : Navigation fluide
- **Résumé par pièce** : Nombre d'objets, volumes
- **Inventaire détaillé** : Groupé par catégorie
- **Modification de pièce** : Changement de type possible

## 🔄 Migration depuis v3.0

Les changements sont rétrocompatibles :
- Base de données : Aucun changement de schéma
- APIs : Endpoints existants conservés
- Interface : Nouvelles étapes ajoutées

## 🎯 Prochaines Étapes

- [ ] Tests automatisés pour les nouveaux composants
- [ ] Optimisation des performances du carrousel
- [ ] Export PDF par pièce
- [ ] Interface mobile optimisée

## 📊 Statistiques

- **22 fichiers modifiés**
- **1797 lignes ajoutées**
- **673 lignes supprimées**
- **8 nouveaux composants**
- **1 service supprimé** (détection doublons)

## 🤝 Contribution

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

## 📚 Documentation Archivée

La documentation technique legacy (guides de déploiement, rapports de sprints, analyses historiques) a été déplacée vers `docs/archive/` pour réduire le bruit en racine du projet. Cette documentation reste accessible pour consultation mais n'est plus maintenue activement.

**Localisation** : `docs/archive/` (70 fichiers)  
**Raison** : Historique/obsolète - La documentation à jour se trouve dans README_v3.1.md et CHANGELOG_v3.1.md

---

**Repository** : [https://github.com/gdetaisne/moverz_v3.1](https://github.com/gdetaisne/moverz_v3.1)
**Version** : 3.1.0
**Dernière mise à jour** : Octobre 2025



