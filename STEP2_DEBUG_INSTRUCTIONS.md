# 🔍 Instructions de Debug - Étape 2

## ✅ Ce qui fonctionne
- ✅ Photo en DB avec analysis
- ✅ Fichier image sur disque
- ✅ Endpoint `/api/uploads/{filename}` retourne 200 OK
- ✅ 1 item détecté dans l'analysis

## ⚠️ Problème identifié
L'item dans l'analysis **n'a pas de volume** (`volume_m3` ou `volume`):

```json
{
  "name": "Meuble",
  "category": "mobilier",
  "fragile": false,
  "dismountable": true
  // ❌ Pas de volume !
}
```

## 🎯 Actions correctives appliquées

### 1. Debug activé dans `lib/imageUrl.ts`
- `const debug = true` pour voir les URLs résolues dans la console

### 2. Instrumentation renforcée dans `RoomInventoryCard.tsx`
- Affiche l'analysis complète de chaque photo
- Affiche les items avec leurs volumes
- Comptage des items avec/sans volume

### 3. Support des deux formats de nom d'item
- `item.label` OU `item.name`

## 📋 Étapes pour tester

### 1. Ouvrir la console navigateur (F12)
```
http://localhost:3001
```

### 2. Aller à l'Étape 2 et observer les logs:

Rechercher ces logs dans la console:
```
[resolvePhotoSrc] photo: { id, url, filePath, ... }
[RoomInventoryCard] photo: { hasAnalysis, itemsLength, analysis }
[RoomInventoryCard] items détaillés: [ { name, volume, hasVolume } ]
[RoomInventoryCard] salon - RÉSUMÉ: { itemsCount, totalVolume, itemsWithVolume }
```

### 3. Vérifier l'affichage des photos

Si les photos sont **toujours noires**:
- Vérifier que l'URL dans la console est: `http://localhost:3001/api/uploads/{id}.jpeg`
- Tester cette URL directement dans un nouvel onglet
- Vérifier qu'elle affiche bien l'image

Si l'URL est incorrecte (ex: `http://localhost:3000` au lieu de `3001`):
- Vérifier `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Redémarrer le serveur Next.js

### 4. Vérifier l'inventaire

Si l'inventaire est **vide**:
- Vérifier dans les logs: `itemsCount` doit être > 0
- Vérifier: `hasItems: true`

Si `itemsCount > 0` mais aucun affichage:
- Le problème est dans le composant `InventoryItemInline`
- Vérifier qu'il accepte `item.label` ou `item.name`

Si `totalVolume: 0.00` mais items présents:
- **Normal si les items n'ont pas de volume dans la DB**
- L'IA n'a pas retourné de volumes pour ces items
- Solution: Re-uploader une photo ou corriger l'analyse IA

## 🔧 Si les données DB sont incorrectes

### Option A: Re-uploader une photo
1. Aller à l'Étape 1
2. Uploader une nouvelle photo
3. Vérifier que l'analyse retourne bien des items avec volumes

### Option B: Vérifier la config IA
Les clés IA sont dans `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```

### Option C: Inspecter la photo en DB
```bash
node scripts/diagnose-step2.mjs
```

Cela affichera:
- Les photos en DB
- Leur analysis complète
- Les fichiers sur disque
- L'état de l'endpoint

## 🎯 Résultat attendu

Dans la console navigateur:
```
[resolvePhotoSrc] résolu depuis url: http://localhost:3001/api/uploads/de3af623-...jpeg
[RoomInventoryCard] salon - RÉSUMÉ: {
  itemsCount: 1,
  totalVolume: "0.00" (ou > 0 si volumes présents),
  itemsWithVolume: 0 (ou 1 si volumes présents)
}
```

Dans l'UI:
- ✅ Photos visibles (plus de noir)
- ✅ Liste d'objets affichée (≥ 1 item)
- ⚠️ Volume peut être 0 si l'IA n'a pas retourné de dimensions

## 💡 Note importante

Si `volume = 0`, ce n'est **pas un bug UI**, c'est que l'**analyse IA n'a pas calculé les volumes**.
Les items sont bien détectés, mais sans dimensions.

Pour avoir des volumes réels:
- L'IA doit analyser correctement la photo
- Elle doit retourner `dimensions_cm` et `volume_m3` pour chaque item
- Vérifier que les prompts IA demandent explicitement les volumes
