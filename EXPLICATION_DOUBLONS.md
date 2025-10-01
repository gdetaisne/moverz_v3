# 🔄 Gestion des Doublons : Explication Complète

**Date:** 1 octobre 2025

---

## 📊 DEUX TYPES DE COMPTAGE

### ✅ Type 1 : Comptage Légitime (MÊME PHOTO)

**Cas d'usage :** Plusieurs objets physiques identiques visibles sur UNE photo

**Exemple :**
```
Photo : Salle à manger avec 6 chaises identiques autour d'une table
```

**Résultat attendu :**
```json
{
  "items": [
    {
      "label": "chaise",
      "quantity": 6,        // ✅ CORRECT - ce sont 6 objets physiques différents
      "dimensions_cm": { "length": 45, "width": 45, "height": 85 }
    },
    {
      "label": "table à manger",
      "quantity": 1
    }
  ]
}
```

**→ C'est ce que le COMPTAGE INTELLIGENT fait maintenant (modifications du 1er octobre).**

---

### ⚠️ Type 2 : Doublon Entre Photos (PHOTOS MULTIPLES)

**Cas d'usage :** Même objet photographié plusieurs fois depuis différents angles

**Exemple :**
```
Photo 1 (Salon - Vue Est) :
  - Canapé 3 places
  - Table basse
  - TV

Photo 2 (Salon - Vue Ouest, MÊME PIÈCE) :
  - Canapé 3 places  ← ⚠️ DOUBLON de Photo 1
  - Bibliothèque
  - Lampadaire
```

**Résultat actuel (PROBLÈME) :**
```json
{
  "photo1": {
    "items": [
      { "label": "canapé 3 places", "quantity": 1 },
      { "label": "table basse", "quantity": 1 },
      { "label": "TV", "quantity": 1 }
    ]
  },
  "photo2": {
    "items": [
      { "label": "canapé 3 places", "quantity": 1 },  // ⚠️ DOUBLON !
      { "label": "bibliothèque", "quantity": 1 },
      { "label": "lampadaire", "quantity": 1 }
    ]
  }
}
```

**Total naïf :** 2 canapés (alors qu'il n'y en a qu'un physiquement) ❌

---

## 🛠️ SYSTÈME ACTUEL

### 1. Déduplication INTRA-analyse

**Fichier :** `services/optimizedAnalysis.ts` (lignes 167-202)

**But :** Éviter que Claude ET OpenAI détectent le même objet deux fois sur la MÊME photo

```typescript
function deduplicateItems(volumineuxItems: any[], petitsItems: any[]) {
  // Créer une clé unique : label + dimensions
  const positionKey = `${label}_${length}_${width}_${height}`;
  
  // Si déjà vu sur cette photo → garder le plus confiant
  if (processedPositions.has(positionKey)) {
    // Garder celui avec la plus haute confidence
    if (item.confidence > existing.confidence) {
      deduplicatedItems[existingIndex] = item;
    }
  }
}
```

**Portée :** UNE SEULE photo (analyse Claude + OpenAI fusionnée)

**Efficace pour :** Éviter "chaise" détecté par Claude ET OpenAI = 1 entrée ✅

**N'empêche PAS :** Même chaise sur Photo1 ET Photo2 = 2 entrées ❌

---

### 2. Sélection Manuelle par Photo

**Fichier :** `app/page.tsx` (lignes 465-481)

**Fonctionnalité actuelle :**
```typescript
// Chaque photo a ses objets sélectionnés/désélectionnés
interface Photo {
  selectedItems: Set<number>;  // Indices des objets cochés
}

// Toggle checkbox
const toggleItemSelection = (photoIndex, itemIndex) => {
  if (selectedItems.has(itemIndex)) {
    selectedItems.delete(itemIndex);  // Décocher
  } else {
    selectedItems.add(itemIndex);      // Cocher
  }
};
```

**Calcul du total :**
```typescript
currentRoom.photos.forEach(photo => {
  photo.analysis.items.forEach((item, itemIndex) => {
    const isSelected = photo.selectedItems.has(itemIndex);
    if (isSelected) {
      totalVolume += item.volume_m3;
      totalItems += item.quantity;
    }
  });
});
```

**→ L'utilisateur PEUT désélectionner manuellement les doublons, mais :**
- ❌ Aucune détection automatique
- ❌ Aucun indicateur visuel "doublon potentiel"
- ❌ Pas de suggestion "cet objet ressemble à celui de Photo 1"

---

## 🎯 SOLUTION PROPOSÉE

### Option A : Détection Automatique de Doublons (RECOMMANDÉE)

**Principe :** Comparer les objets entre toutes les photos et marquer les similitudes

**Algorithme :**
```typescript
// Nouveau fichier : services/duplicateDetectionService.ts

export interface DuplicateInfo {
  photoIndex: number;
  itemIndex: number;
  similarity: number;  // 0-1
  reason: string;
}

export interface ItemWithDuplicateFlag extends TInventoryItem {
  isPotentialDuplicate?: boolean;
  duplicateOf?: DuplicateInfo[];
  autoDeselected?: boolean;  // Si désélectionné automatiquement
}

export function detectDuplicatesAcrossPhotos(photos: Photo[]): Photo[] {
  const allItems: Array<{
    photo: number;
    index: number;
    item: TInventoryItem;
    roomName: string;
  }> = [];

  // 1. Collecter tous les objets de toutes les photos
  photos.forEach((photo, photoIndex) => {
    photo.analysis?.items?.forEach((item, itemIndex) => {
      allItems.push({
        photo: photoIndex,
        index: itemIndex,
        item,
        roomName: photo.roomName || `Photo ${photoIndex + 1}`
      });
    });
  });

  // 2. Comparer chaque objet avec tous les autres
  const duplicates: Map<string, DuplicateInfo[]> = new Map();

  for (let i = 0; i < allItems.length; i++) {
    for (let j = i + 1; j < allItems.length; j++) {
      const item1 = allItems[i];
      const item2 = allItems[j];

      // Ignorer si même photo (comptage légitime)
      if (item1.photo === item2.photo) continue;

      // Calculer similarité
      const similarity = calculateSimilarity(item1.item, item2.item, item1.roomName, item2.roomName);

      // Si > 80% similaire → probablement un doublon
      if (similarity > 0.80) {
        const key = `${item2.photo}_${item2.index}`;
        if (!duplicates.has(key)) {
          duplicates.set(key, []);
        }
        duplicates.get(key)!.push({
          photoIndex: item1.photo,
          itemIndex: item1.index,
          similarity,
          reason: `Ressemble à ${item1.item.label} de ${item1.roomName} (${Math.round(similarity * 100)}% similaire)`
        });
      }
    }
  }

  // 3. Marquer les doublons dans les photos
  return photos.map((photo, photoIndex) => ({
    ...photo,
    analysis: {
      ...photo.analysis,
      items: photo.analysis?.items?.map((item, itemIndex) => {
        const key = `${photoIndex}_${itemIndex}`;
        const duplicateInfo = duplicates.get(key);
        
        if (duplicateInfo && duplicateInfo.length > 0) {
          return {
            ...item,
            isPotentialDuplicate: true,
            duplicateOf: duplicateInfo,
            // Auto-désélectionner si confiance > 90%
            autoDeselected: duplicateInfo[0].similarity > 0.90
          };
        }
        return item;
      })
    }
  }));
}

function calculateSimilarity(
  item1: TInventoryItem,
  item2: TInventoryItem,
  room1: string,
  room2: string
): number {
  let score = 0;
  let factors = 0;

  // 1. Label exact → +40%
  if (item1.label.toLowerCase() === item2.label.toLowerCase()) {
    score += 0.40;
  } else if (item1.label.toLowerCase().includes(item2.label.toLowerCase())) {
    score += 0.20;
  }
  factors++;

  // 2. Dimensions similaires (~10cm tolérance) → +30%
  const dim1 = item1.dimensions_cm;
  const dim2 = item2.dimensions_cm;
  if (dim1 && dim2) {
    const lengthDiff = Math.abs(dim1.length - dim2.length);
    const widthDiff = Math.abs(dim1.width - dim2.width);
    const heightDiff = Math.abs(dim1.height - dim2.height);
    
    if (lengthDiff < 10 && widthDiff < 10 && heightDiff < 10) {
      score += 0.30;
    } else if (lengthDiff < 20 && widthDiff < 20 && heightDiff < 20) {
      score += 0.15;
    }
  }
  factors++;

  // 3. Même pièce détectée → +20%
  if (room1.toLowerCase().includes(room2.toLowerCase()) || 
      room2.toLowerCase().includes(room1.toLowerCase())) {
    score += 0.20;
  }
  factors++;

  // 4. Catégorie identique → +10%
  if (item1.category === item2.category) {
    score += 0.10;
  }
  factors++;

  return score;
}
```

---

### Interface Utilisateur Améliorée

**Modification :** `app/page.tsx`

```tsx
// Affichage avec badge "Doublon potentiel"
{photo.analysis.items?.map((item: ItemWithDuplicateFlag, itemIndex: number) => {
  const isSelected = isItemSelected(photo, itemIndex);
  const isDuplicate = item.isPotentialDuplicate;
  
  return (
    <tr className={`
      ${!isSelected ? 'opacity-50 bg-gray-50' : ''}
      ${isDuplicate ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}
    `}>
      <td className="p-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleItemSelection(photoIndex, itemIndex)}
          className="w-4 h-4 text-blue-600"
        />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <span>{item.label}</span>
          
          {/* Badge doublon */}
          {isDuplicate && (
            <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full font-medium">
              ⚠️ Doublon potentiel
            </span>
          )}
        </div>
        
        {/* Explication du doublon */}
        {isDuplicate && item.duplicateOf && (
          <div className="mt-1 text-xs text-yellow-700">
            {item.duplicateOf[0].reason}
          </div>
        )}
      </td>
      {/* ... autres colonnes ... */}
    </tr>
  );
})}
```

**Résultat visuel :**
```
Photo 1 (Salon - Vue Est)
☑ Canapé 3 places       200x90x80cm    1.44 m³

Photo 2 (Salon - Vue Ouest)
☐ Canapé 3 places       200x90x80cm    1.44 m³
  ⚠️ Doublon potentiel
  Ressemble à canapé 3 places de Photo 1 (95% similaire)
```

---

### Option B : Mode Manuel Amélioré

**Plus simple mais moins automatique :**

1. **Bouton "Marquer comme doublon"** sur chaque objet
2. **Groupe visuel** : Relier les objets marqués comme doublons
3. **Un seul compte** dans le total final

```tsx
<button 
  onClick={() => markAsDuplicate(photoIndex, itemIndex)}
  className="text-xs text-gray-500 hover:text-blue-600"
>
  🔗 Lier à un autre objet
</button>
```

---

## 🎬 WORKFLOW UTILISATEUR IDÉAL

### Avec Détection Automatique (Option A)

1. **Upload Photo 1** (Salon vue Est)
   - ✅ Canapé détecté et coché
   - ✅ Table basse détectée et cochée

2. **Upload Photo 2** (Salon vue Ouest)
   - ⚠️ Canapé détecté MAIS marqué "Doublon potentiel"
   - ⚠️ Automatiquement décoché (si similarité > 90%)
   - ✅ Bibliothèque détectée et cochée (nouvel objet)

3. **Validation utilisateur**
   - Vérifie les objets marqués "doublon"
   - Si erreur (pas vraiment un doublon) → Recoche manuellement
   - Si correct → Valide l'inventaire

4. **Résultat final**
   ```
   Total : 1 canapé, 1 table basse, 1 bibliothèque
   (et non 2 canapés)
   ```

---

## 🚀 IMPLÉMENTATION RECOMMANDÉE

### Phase 1 : Détection Automatique Basique (1-2 jours)

**Fichiers à créer :**
1. ✅ `services/duplicateDetectionService.ts` - Logique de détection
2. ✅ Modifier `app/page.tsx` - Appeler la détection après chaque analyse
3. ✅ Modifier UI - Ajouter badge "Doublon potentiel"

**Critères simples :**
- Label exact identique
- Dimensions similaires (±10cm)
- → Si 2 critères OK → Doublon probable (80%+)

### Phase 2 : Amélioration Visuelle (1 jour)

**Ajouts UI :**
- Badge jaune "⚠️ Doublon potentiel"
- Texte explicatif "Ressemble à X de Photo Y"
- Auto-décocher si confiance > 90%

### Phase 3 : Intelligence Avancée (optionnel, 2-3 jours)

**Améliorer la détection avec :**
- Comparaison visuelle (hashing d'image)
- Utiliser roomType détecté (même pièce = doublon plus probable)
- Historique utilisateur (si l'user recoche → apprendre)

---

## 📝 EXEMPLE DE CODE À AJOUTER

### 1. Dans `app/page.tsx` après analyse

```typescript
// Après processPhotoAsync()
const processPhotoAsync = async (photoIndex, file, photoId) => {
  // ... analyse existante ...
  
  // NOUVEAU : Détecter doublons après analyse
  const photosWithDuplicates = detectDuplicatesAcrossPhotos(currentRoom.photos);
  
  setCurrentRoom(prev => ({
    ...prev,
    photos: photosWithDuplicates
  }));
};
```

### 2. Schéma de données étendu

```typescript
// lib/schemas.ts - Ajouter au InventoryItem
export const InventoryItem = z.object({
  // ... champs existants ...
  
  // NOUVEAUX champs pour doublons
  isPotentialDuplicate: z.boolean().optional(),
  duplicateOf: z.array(z.object({
    photoIndex: z.number(),
    itemIndex: z.number(),
    similarity: z.number(),
    reason: z.string()
  })).optional(),
  autoDeselected: z.boolean().optional(),
  userConfirmedNotDuplicate: z.boolean().optional()  // Si l'user recoche
});
```

---

## ✅ CRITÈRES D'ACCEPTATION

**Test 1 : Doublon Évident**
```
Action : Upload 2 photos du même salon (angles différents)
Attendu : Objets communs marqués "Doublon potentiel"
Résultat : Total ne compte qu'une fois chaque objet
```

**Test 2 : Faux Positif**
```
Action : Upload photo cuisine (4 chaises) + photo salle à manger (6 chaises)
Attendu : Aucun doublon détecté (pièces différentes)
Résultat : Total = 10 chaises
```

**Test 3 : Validation Manuelle**
```
Action : Système marque un objet comme doublon → User recoche
Attendu : Objet inclus dans le total + flag "confirmé pas doublon"
Résultat : L'IA n'alerte plus sur ce type d'objet
```

---

## 🎯 RÉSUMÉ

| Situation | Comportement Actuel | Comportement Cible |
|-----------|---------------------|-------------------|
| 4 chaises sur 1 photo | quantity: 4 ✅ | quantity: 4 ✅ (comptage intelligent) |
| Même canapé sur 2 photos | 2 entrées cochées ❌ | 1 cochée, 1 décochée avec badge ⚠️ ✅ |
| Pièces différentes | OK ✅ | OK ✅ (pas de faux positif) |

**Action recommandée :** Implémenter Option A (détection automatique) en Phase 1 + 2

---

**Questions ? Besoin de précisions ?** 🚀


