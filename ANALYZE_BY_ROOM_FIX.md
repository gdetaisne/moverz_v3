# 🔧 FIX: Route `/api/photos/analyze-by-room` - 404 Résolu

**Date**: 9 octobre 2025  
**Statut**: ✅ RÉSOLU

---

## 🐛 Problème Initial

La route `/api/photos/analyze-by-room` retournait **404 Not Found** au lieu de traiter les requêtes POST, causant l'erreur "Aucun objet détecté" dans l'UI Étape 2.

---

## 🔍 Diagnostic Effectué

### 1. Vérification de l'existence du fichier ✅
- **Fichier**: `/app/api/photos/analyze-by-room/route.ts`
- **Statut**: Présent, 84 lignes
- **Export**: `export async function POST(req: NextRequest)` ✅

### 2. Vérification des imports ⚠️
```typescript
// LIGNE 45 - ANCIEN CODE (PROBLÉMATIQUE)
const { analyzeRoomPhotos } = await import("@ai/adapters/roomBasedAnalysis");
```

### 3. Analyse de la chaîne de dépendances
```
app/api/photos/analyze-by-room/route.ts
  └─> @ai/adapters/roomBasedAnalysis
       └─> [RE-EXPORT] @services/roomBasedAnalysis
            └─> [IMPLÉMENTATION RÉELLE] services/roomBasedAnalysis.ts (419 lignes)
```

**Problème identifié**: L'import dynamique via le re-export intermédiaire échouait dans Next.js.

### 4. Fichiers dupliqués détectés
- ✅ `/app/api/photos/analyze-by-room/route.ts` (utilisé par Next.js)
- ❌ `/apps/web/app/api/photos/analyze-by-room/route.ts` (dupliqué inutilisé)

---

## ✅ Corrections Appliquées

### 1. Import direct vers le service réel
```diff
// app/api/photos/analyze-by-room/route.ts (ligne 45)
- const { analyzeRoomPhotos } = await import("@ai/adapters/roomBasedAnalysis");
+ const { analyzeRoomPhotos } = await import("@services/roomBasedAnalysis");
```

**Raison**: Éliminer le re-export intermédiaire qui échouait lors de la résolution dynamique des modules dans Next.js.

### 2. Suppression du fichier dupliqué
```bash
rm /apps/web/app/api/photos/analyze-by-room/route.ts
```

---

## 🧪 Tests de Validation

### Test 1: Vérification que la route existe
```bash
curl -I http://localhost:3001/api/photos/analyze-by-room
```
**Résultat attendu**: `405 Method Not Allowed` (normal car c'est POST-only)  
**Résultat avant**: `404 Not Found` ❌  
**Résultat après**: `405 Method Not Allowed` ✅

### Test 2: Requête POST basique
```bash
curl -X POST http://localhost:3001/api/photos/analyze-by-room \
  -H "content-type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"roomType":"salon","photoIds":[]}'
```
**Résultat attendu**: `{"error":"No photos found"}`  
**Résultat avant**: `404` ❌  
**Résultat après**: `{"error":"No photos found"}` ✅

### Test 3: Requête POST avec photos réelles
```bash
# 1. Récupérer des IDs de photos existantes
curl -sS "http://localhost:3001/api/photos" \
  -H "x-user-id: YOUR_USER_ID" | jq -r '.[0:2] | .[].id'

# 2. Tester l'analyse
curl -X POST http://localhost:3001/api/photos/analyze-by-room \
  -H "content-type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{
    "roomType":"salon",
    "photoIds":["PHOTO_ID_1","PHOTO_ID_2"]
  }' | jq '.items | length'
```
**Résultat attendu**: Nombre d'objets détectés (ex: `5`)

---

## 📋 Checklist de Validation Complète

- [x] Route répond (pas 404)
- [x] Accepte POST avec payload minimal
- [x] Import dynamique fonctionne
- [x] Pas de fichiers dupliqués
- [ ] Test avec photos réelles (à faire par l'utilisateur)
- [ ] UI Étape 2 affiche les objets (à vérifier manuellement)

---

## 🎯 Prochaines Étapes

1. **Tester avec des photos réelles** dans l'UI:
   - Uploader 2-3 photos
   - Valider les groupes de pièces à l'Étape 2
   - Vérifier que les objets s'affichent

2. **Vérifier les logs serveur**:
   ```bash
   # Filtrer les logs d'analyse
   tail -f server.log | grep "🏠 Analyse"
   ```

3. **Si "Aucun objet détecté" persiste**, vérifier:
   - Que les photos ont bien un `photoId` en DB
   - Que le `userId` passé dans les headers correspond
   - Les logs de l'API Claude/AI

---

## 📝 Notes Techniques

### Architecture d'import corrigée
```
Next.js Route (app/api/photos/analyze-by-room/route.ts)
  └─> Import dynamique direct
       └─> @services/roomBasedAnalysis
            └─> analyzeRoomPhotos() → Claude API
```

### Alias TypeScript utilisés
```json
{
  "@/*": ["./*"],
  "@services/*": ["./services/*"],
  "@ai/*": ["./packages/ai/src/*"],
  "@core/*": ["./packages/core/src/*"]
}
```

### Pourquoi l'import dynamique ?
```typescript
// Permet d'éviter le bundling côté client
const { analyzeRoomPhotos } = await import("@services/roomBasedAnalysis");
```

---

## ✅ Statut Final

**Route fonctionnelle** : La route `/api/photos/analyze-by-room` répond correctement aux requêtes POST.

**Reste à valider** : Test end-to-end avec l'UI pour confirmer que les objets s'affichent dans l'inventaire.

---

**Commandes de redémarrage si nécessaire:**
```bash
# Arrêter le serveur
lsof -ti:3001 | xargs kill -9

# Relancer
cd /Users/guillaumestehelin/moverz_v3
npm run dev
```


