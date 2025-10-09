# 🔥 FIX CRITIQUE : Mock roomBasedAnalysis écrasait l'IA réelle

**Date:** 9 octobre 2025  
**Problème:** Volume toujours 0.00 m³, objet "Meuble" générique

---

## 🐛 Symptôme

Malgré le correctif des alias `@ai/*`, l'inventaire affichait :
- ❌ **1 objet générique "Meuble"**
- ❌ **Volume: 0.00 m³**
- ❌ Analyse instantanée (**1ms** au lieu de **2500-3000ms** pour Claude)

---

## 🔍 Cause racine

**`packages/ai/src/adapters/roomBasedAnalysis.ts`** contenait un **mock hardcodé** :

```typescript
// ❌ ANCIEN CODE (MOCK)
export async function analyzeRoomPhotos(roomType: string, photos: any[]): Promise<any> {
  // Mock implementation
  return {
    roomType,
    items: [
      { name: 'Meuble', category: 'mobilier', dismountable: true, fragile: false }
      // ❌ AUCUN volume_m3 → d'où le 0.00 m³ !
    ],
    confidence: 0.9
  };
}
```

### Séquence d'exécution (avant fix)

1. **Upload photo** → `/api/photos/analyze`
   - ✅ Appelle `@services/claudeVision` (vrai Claude)
   - ✅ Génère analyse complète avec volumes
   - ✅ Prend **9000ms** (normal)

2. **Classification automatique** → `/api/photos/analyze-by-room`
   - ❌ Appelle `@ai/adapters/roomBasedAnalysis` (mock)
   - ❌ **ÉCRASE** l'analyse réelle avec le mock
   - ❌ Prend **252ms** (instantané)
   - ❌ Retourne `{ name: 'Meuble' }` sans volume

### Logs révélateurs

```
✅ [TIMING] Analyse objets IA: 1ms - 1 objets        ← ❌ MOCK (trop rapide)
POST /api/photos/analyze 200 in 9782ms              ← ✅ VRAI (Claude)
POST /api/photos/analyze-by-room 200 in 252ms       ← ❌ MOCK (écrase)
✅ Analyse pièce "bureau" terminée: 1 objets         ← ❌ Résultat final = MOCK
```

---

## ✅ Solution appliquée

**Fichier:** `packages/ai/src/adapters/roomBasedAnalysis.ts`

```typescript
// ✅ NOUVEAU CODE (redirection vers vrai service)
// NOTE: ancien mock. Redirection vers la vraie implémentation.
// Ce fichier ne doit plus être utilisé directement.
// Tous les imports doivent pointer vers services/roomBasedAnalysis.ts

export { analyzeRoomPhotos } from '@services/roomBasedAnalysis';
```

---

## 📊 Résultat attendu (après fix)

### Séquence d'exécution (après fix)

1. **Upload photo** → `/api/photos/analyze`
   - ✅ Appelle `@services/claudeVision` (vrai Claude)
   - ✅ Génère analyse complète avec volumes
   - ✅ Prend **2500-3000ms**

2. **Classification automatique** → `/api/photos/analyze-by-room`
   - ✅ Appelle `@services/roomBasedAnalysis` (vrai service)
   - ✅ **Enrichit** l'analyse au lieu de l'écraser
   - ✅ Prend **2000-3000ms** (normal pour IA)
   - ✅ Retourne objets avec `volume_m3` > 0

### Logs attendus

```
✅ [TIMING] Analyse objets IA: 2500ms - 5 objets     ← ✅ VRAI (temps réaliste)
POST /api/photos/analyze 200 in 3500ms              ← ✅ VRAI
POST /api/photos/analyze-by-room 200 in 2800ms      ← ✅ VRAI (plus de mock)
✅ Analyse pièce "bureau" terminée: 5 objets         ← ✅ Résultat final = VRAI
```

### UI attendue

```
Bureau - 1 photo - 5 objets
Volume total: 4.25 m³

Inventaire détaillé:
- Bureau en bois massif      → 1.80 m³
- Chaise de bureau           → 0.45 m³
- Bibliothèque murale        → 1.50 m³
- Lampe de bureau            → 0.15 m³
- Poubelle                   → 0.35 m³
```

---

## 🧪 Test de validation

### 1. Upload une nouvelle photo

```bash
# Réinitialiser
curl -X POST http://localhost:3001/api/photos/reset \
  -H "x-user-id: test"

# Upload
curl -X POST http://localhost:3001/api/photos/analyze \
  -H "x-user-id: test" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-image.jpg"
```

### 2. Vérifier les logs

```
✅ [TIMING] Analyse objets IA: >2000ms     ← Doit être LENT (c'est bon signe !)
POST /api/photos/analyze-by-room ...ms     ← Doit aussi être LENT
```

### 3. Vérifier l'UI

- ✅ Plusieurs objets détectés (pas juste "Meuble")
- ✅ Volume total > 0.00 m³
- ✅ Chaque objet a un nom spécifique (ex: "Bureau en bois", "Chaise", etc.)

---

## 🎯 Fichiers modifiés au total

1. `tsconfig.json` → Alias `@ai/*` et `@services/*`
2. `app/api/photos/analyze/route.ts` → Imports `@services/*`
3. `app/api/photos/analyze-by-room/route.ts` → Imports `@ai/adapters/*`
4. `components/RoomValidationStepV2.tsx` → Imports `@ai/adapters/*`
5. `packages/ai/src/adapters/claudeVision.ts` → Redirection `@services/*`
6. `packages/ai/src/adapters/roomDetection.ts` → Redirection `@services/*`
7. **`packages/ai/src/adapters/roomBasedAnalysis.ts`** → **Redirection `@services/*` ✅**

---

## ⚡ Impact

| Avant | Après |
|-------|-------|
| ❌ Mock "Meuble" générique | ✅ Objets réels détectés |
| ❌ Volume 0.00 m³ | ✅ Volumes réalistes |
| ❌ Analyse instantanée (1ms) | ✅ Analyse lente (2500ms+) |
| ❌ 1 objet par pièce | ✅ 3-10 objets par pièce |

---

**Statut:** ✅ Fix appliqué, rebuild en cours  
**Prochaine étape:** Tester upload photo + vérifier inventaire détaillé

