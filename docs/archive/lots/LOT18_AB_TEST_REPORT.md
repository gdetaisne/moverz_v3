# LOT 18 - A/B Test du Classifieur de Pièces

## 📋 Vue d'ensemble

Système d'A/B testing pour tester une nouvelle version du classifieur de pièces (Room Classification) avec routage expérimental, télémétrie complète et kill-switch immédiat.

## 🎯 Objectifs atteints

✅ **Feature flags dynamiques** avec variables d'environnement  
✅ **Routage A/B déterministe** basé sur hash MD5 du userId/batchId  
✅ **Variante B (candidate)** utilisant Claude/OpenAI pour classification réelle  
✅ **Fallback automatique** B→A en cas d'erreur  
✅ **Télémétrie complète** avec métriques par variante  
✅ **Endpoint d'observabilité** `/api/ab-status`  
✅ **Tests unitaires** complets (flags, façade, fallback)  
✅ **Script smoke test** pour valider le routage  

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Feature Flags (lib/flags.ts)        │
│  ROOM_CLASSIFIER_AB_ENABLED (default: false)│
│  ROOM_CLASSIFIER_AB_SPLIT (default: 10)     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Façade Unifiée (services/roomClassifier.ts)│
│  - chooseVariant(seed) → A|B                │
│  - Routage automatique                       │
│  - Fallback B→A si erreur                    │
│  - Enregistrement métriques                  │
└──────┬──────────────────────┬────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────────────┐
│ Variante A   │      │ Variante B (nouveau) │
│ (baseline)   │      │ - Claude Haiku       │
│ - Mock       │      │ - OpenAI GPT-4       │
│ - Stable     │      │ - Normalisation      │
└──────────────┘      └──────────────────────┘
       │                      │
       └──────────┬───────────┘
                  ▼
┌─────────────────────────────────────────────┐
│   Télémétrie (packages/ai/src/metrics.ts)   │
│  - Variant (A|B)                             │
│  - Latency, confidence, success              │
│  - Fallback tracking                         │
│  - Agrégation 24h                            │
└─────────────────────────────────────────────┘
```

## 📦 Fichiers créés/modifiés

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `lib/flags.ts` | Feature flags, configuration, logique de routage déterministe |
| `services/roomClassifierV2.ts` | Nouvelle implémentation candidate (variante B) |
| `services/roomClassifier.ts` | Façade unifiée avec routage A/B et fallback |
| `apps/web/app/api/ab-status/route.ts` | Endpoint d'observabilité (GET /api/ab-status) |
| `lib/__tests__/flags.test.ts` | Tests unitaires des feature flags |
| `services/__tests__/roomClassifier.test.ts` | Tests unitaires de la façade |
| `scripts/smoke-lot18.js` | Script de validation smoke test |

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `packages/ai/src/metrics.ts` | Ajout métriques spécifiques room classifier avec variant A/B |
| `packages/ai/src/adapters/roomDetection.ts` | Intégration de la façade A/B |

## 🔧 Configuration

### Variables d'environnement

```bash
# Feature flag A/B test (défaut: false)
ROOM_CLASSIFIER_AB_ENABLED=true

# Pourcentage de trafic en variante B (défaut: 10)
# Valeur entre 0 et 100
ROOM_CLASSIFIER_AB_SPLIT=10
```

### Exemples de configuration

**Mode désactivé (production safe) :**
```bash
# Pas de variable ou
ROOM_CLASSIFIER_AB_ENABLED=false
# → 100% variante A (baseline)
```

**Test avec 10% en B :**
```bash
ROOM_CLASSIFIER_AB_ENABLED=true
ROOM_CLASSIFIER_AB_SPLIT=10
# → ~10% variante B, ~90% variante A
```

**Test avec 100% en B (validation) :**
```bash
ROOM_CLASSIFIER_AB_ENABLED=true
ROOM_CLASSIFIER_AB_SPLIT=100
# → 100% variante B
```

## 🧪 Tests

### Tests unitaires

```bash
# Exécuter les tests du LOT 18
pnpm test lib/__tests__/flags.test.ts
pnpm test services/__tests__/roomClassifier.test.ts
```

**Coverage des tests :**
- ✅ Feature flags (enabled/disabled, split 0-100, valeurs invalides)
- ✅ Routage déterministe (même seed → même variante)
- ✅ Distribution statistique (~10% B avec split=10)
- ✅ Fallback B→A en cas d'erreur
- ✅ Métriques enregistrées avec variant, latency, confidence

### Smoke test

```bash
# Lancer le smoke test complet
node scripts/smoke-lot18.js
```

**Tests effectués :**
1. Routage A/B avec split=10 → ~10% B
2. Déterminisme du choix de variante
3. Flag désactivé → toujours A
4. Cas limites (split=0, split=100)
5. Endpoint /api/ab-status accessible

## 📊 Observabilité

### Endpoint /api/ab-status

**GET /api/ab-status**

Retourne l'état du test A/B et les statistiques des dernières 24h.

**Réponse JSON :**
```json
{
  "enabled": true,
  "split": 10,
  "counts": {
    "A": 900,
    "B": 100,
    "fallbackToA": 5,
    "errorsA": 2,
    "errorsB": 8
  },
  "avgLatency": {
    "A": 450,
    "B": 1200
  },
  "avgConfidence": {
    "A": 0.8,
    "B": 0.85
  },
  "period": "24h",
  "timestamp": "2025-10-08T14:30:00.000Z"
}
```

### Métriques collectées

Pour chaque classification, les métriques suivantes sont enregistrées :

| Champ | Description |
|-------|-------------|
| `variant` | 'A' ou 'B' |
| `success` | true/false |
| `latencyMs` | Temps de réponse en ms |
| `roomType` | Type de pièce classifié |
| `confidence` | Score de confiance (0-1) |
| `userId` | Identifiant utilisateur (optionnel) |
| `batchId` | Identifiant batch (optionnel) |
| `photoId` | Identifiant photo (optionnel) |
| `fallback` | true si B→A fallback |
| `errorCode` | Message d'erreur si échec |
| `timestamp` | Date ISO 8601 |

## 🚀 Utilisation

### Appel de la façade

```typescript
import { classifyRoom } from '@/services/roomClassifier';

// Classification avec A/B test automatique
const result = await classifyRoom(
  { 
    buffer: imageBuffer,
    // ou imageUrl: 'data:image/jpeg;base64,...'
  },
  {
    userId: 'user-123',      // Pour routage déterministe
    batchId: 'batch-456',    // Optionnel
    photoId: 'photo-789',    // Optionnel
  }
);

console.log(result);
// {
//   variant: 'A',          // ou 'B'
//   roomType: 'salon',
//   confidence: 0.85,
//   meta: { ... }
// }
```

### Intégration existante

L'adapter `packages/ai/src/adapters/roomDetection.ts` a été mis à jour pour utiliser automatiquement la façade A/B :

```typescript
import { detectRoomType } from '@ai/adapters/roomDetection';

// Utilise automatiquement le système A/B
const roomType = await detectRoomType(imageBuffer, {
  userId: 'user-123'
});
```

## 🔒 Sécurité & Résilience

### Kill-switch immédiat

Si `ROOM_CLASSIFIER_AB_ENABLED=false` (ou non défini) :
- ✅ 100% du trafic en variante A (baseline)
- ✅ Aucun appel à la variante B
- ✅ Comportement identique à avant le LOT 18

### Fallback automatique

Si la variante B échoue :
1. ✅ Tentative automatique avec variante A
2. ✅ Métrique `fallback: true` enregistrée
3. ✅ Utilisateur ne voit aucune erreur

Si les deux variantes échouent :
1. ✅ Retour `roomType: "autre"` avec `confidence: 0.3`
2. ✅ Métrique `success: false` enregistrée
3. ✅ Pas de crash de l'application

### Protection des bornes

- Split < 0 → cappé à 0
- Split > 100 → cappé à 100
- Valeur invalide → default 10

### Timeouts

Les timeouts existants du système sont respectés (pas de timeout spécifique A/B).

## 📈 Critères d'acceptation

| Critère | Status |
|---------|--------|
| Flag off → 100% A | ✅ Validé |
| Flag on + split=10 → ~10% B | ✅ Validé |
| Fallback B→A opérationnel | ✅ Validé |
| /api/ab-status expose statut | ✅ Validé |
| Build OK, lint OK | ✅ Validé |
| Tests unitaires OK | ✅ Validé |
| Smoke test OK | ✅ Validé |

## 🔄 Workflow de déploiement

### 1. Test en local
```bash
# Activer l'A/B test avec 10% B
export ROOM_CLASSIFIER_AB_ENABLED=true
export ROOM_CLASSIFIER_AB_SPLIT=10

# Lancer l'app
pnpm dev

# Tester l'endpoint
curl http://localhost:3001/api/ab-status
```

### 2. Déploiement staging (10% B)
```bash
ROOM_CLASSIFIER_AB_ENABLED=true
ROOM_CLASSIFIER_AB_SPLIT=10
```

### 3. Monitoring
- Surveiller `/api/ab-status` (counts, erreurs, latency)
- Comparer confidence A vs B
- Surveiller fallbackToA

### 4. Augmentation progressive
```bash
# Si les métriques sont bonnes
ROOM_CLASSIFIER_AB_SPLIT=25  # 25% B
ROOM_CLASSIFIER_AB_SPLIT=50  # 50% B
ROOM_CLASSIFIER_AB_SPLIT=100 # 100% B (validation finale)
```

### 5. Rollout complet
- Si B validé : remplacer A par B dans le code
- Supprimer le système A/B
- Cleanup des feature flags

### 6. Rollback immédiat
```bash
# En cas de problème
ROOM_CLASSIFIER_AB_ENABLED=false
# → Retour instantané à 100% A
```

## 🐛 Troubleshooting

### Problème : Variante B toujours en erreur

**Symptômes :**
- Métrique `fallbackToA` élevée
- `errorsB` > 0

**Solutions :**
1. Vérifier les clés API (Claude/OpenAI) configurées
2. Vérifier les logs du provider IA
3. Désactiver temporairement : `ROOM_CLASSIFIER_AB_ENABLED=false`

### Problème : Split non respecté

**Symptômes :**
- Distribution A/B différente du split configuré

**Solutions :**
1. Vérifier `ROOM_CLASSIFIER_AB_SPLIT` bien défini
2. Vérifier l'échantillon suffisant (>100 classifications)
3. Exécuter le smoke test : `node scripts/smoke-lot18.js`

### Problème : /api/ab-status retourne 500

**Symptômes :**
- Erreur lors de l'accès à l'endpoint

**Solutions :**
1. Vérifier les imports dans `apps/web/app/api/ab-status/route.ts`
2. Vérifier que `@ai/metrics` est accessible
3. Consulter les logs serveur

## 📝 Notes techniques

### Déterminisme du routage

Le choix de variante est **déterministe** :
- Même `seed` (userId/batchId) → toujours même variante
- Hash MD5 du seed → pourcentage 0-99
- Si pourcentage < split → variante B, sinon A

**Avantages :**
- ✅ Expérience cohérente pour un même utilisateur
- ✅ Reproductibilité des tests
- ✅ Pas de stockage d'état nécessaire

### Performance

**Variante A (baseline) :**
- Mock simple
- Latency ~50ms

**Variante B (candidate) :**
- Appel Claude/OpenAI
- Latency ~800-1500ms
- Coût par classification : ~$0.001-0.003

### Compatibilité

- ✅ Node 24+
- ✅ Next.js App Router
- ✅ TypeScript strict
- ✅ Aucune migration DB requise
- ✅ Pas de dépendances additionnelles

## 🎓 Références

- **Code review :** Tous les fichiers sont lintés et testés
- **Documentation :** Ce fichier + commentaires inline
- **Tests :** `lib/__tests__/flags.test.ts`, `services/__tests__/roomClassifier.test.ts`
- **Smoke test :** `scripts/smoke-lot18.js`

---

**Date de livraison :** 8 octobre 2025  
**Version :** v4.0 - LOT 18  
**Status :** ✅ Complété et validé



