# ✅ PATCH STEP2 UI - APPLIQUÉ

**Date**: 2025-10-09  
**Objectif**: Corriger l'affichage des photos et de l'inventaire en Étape 2  
**Périmètre**: UI uniquement (aucune modification IA/queues/DB)

---

## 📦 Fichiers modifiés

### 1. `apps/web/lib/imageUrl.ts` (NOUVEAU)
**Fonctions**:
- `toAbsoluteApiUrl(pathOrUrl)` - Normalise les URLs relatives en URLs absolues
  - Détecte `/uploads/` et `/api/uploads/`
  - Utilise `window.location.origin` ou `NEXT_PUBLIC_API_URL`
  - Retourne `null` si pas de source valide

- `resolvePhotoSrc(photo)` - Résout la meilleure source d'image
  - Priorité 1: `photo.file` → blob URL (upload immédiat)
  - Priorité 2: `photo.url` ou `photo.fileUrl`
  - Priorité 3: `photo.filePath`
  - Priorité 4: `photo.photoId` ou `photo.id` → `/api/uploads/{id}.jpeg`

**Avantages**:
- ✅ Gère tous les formats possibles de photos
- ✅ Pas de dépendance à Next/Image (évite problèmes de domaines)
- ✅ Fallback robuste avec `null` si aucune source

---

### 2. `apps/web/components/PhotoCard.tsx` (REMPLACÉ)
**Changements**:
- ✅ Utilise `<img>` simple au lieu de `<Image>`
- ✅ Gestion d'erreur explicite avec `onError`
- ✅ Log console si chargement échoue (avec URL testée)
- ✅ État de chargement visible ("Chargement…")
- ✅ Fallback "Image indisponible" si erreur

**Code clé**:
```tsx
const final = toAbsoluteApiUrl(src || "");
<img
  src={final}
  onError={() => {
    setError("load-failed");
    console.warn("[PhotoCard] image load failed:", final, { photo });
  }}
/>
```

---

### 3. `apps/web/components/PhotoThumbnail.tsx` (REMPLACÉ)
**Changements**:
- ✅ Même logique que PhotoCard mais pour miniatures
- ✅ Taille paramétrable (défaut 72px)
- ✅ Fallback "—" si erreur

---

### 4. `apps/web/components/RoomInventoryCard.tsx` (REMPLACÉ)
**Changements majeurs**:
- ✅ **Mapping robuste des items**:
  ```tsx
  function getItems(analysis) {
    if (Array.isArray(analysis.items)) return analysis.items;
    if (Array.isArray(analysis.data?.items)) return analysis.data.items;
    return [];
  }
  ```

- ✅ **Support de plusieurs formats de nom**:
  ```tsx
  function getItemLabel(it) {
    return it?.label || it?.name || "Objet";
  }
  ```

- ✅ **Support de plusieurs formats de volume**:
  ```tsx
  function getItemVolume(it) {
    return it?.volume_m3 ?? it?.volume ?? it?.volumeM3;
  }
  ```

- ✅ **Affichage "—" si volume absent** (au lieu de crash ou 0.00)

**UI**:
- En-tête: Nom de pièce + compteurs (Objets: X — Volume: Y m³)
- Liste d'objets avec nom + volume individuel
- Message "Aucun objet détecté" si vide

---

### 5. `scripts/probe-image.js` (NOUVEAU)
**Usage**:
```bash
node scripts/probe-image.js <photoId>
# ou
node scripts/probe-image.js <filename.jpeg>
```

**Fonction**: Teste l'endpoint `/api/uploads` pour vérifier qu'une image est accessible.

**Test effectué**:
```bash
node scripts/probe-image.js de3af623-ccce-4e4c-831e-461c2b779ec2.jpeg
→ GET http://localhost:3001/api/uploads/de3af623-ccce-4e4c-831e-461c2b779ec2.jpeg
→ 200 image/jpeg ✅
```

---

## 🎯 Architecture préservée

### ✅ LOTS 5-18 intacts
- **LOTS 5-8**: PostgreSQL/Prisma → Aucune modification
- **LOT 9**: BullMQ/Redis queues → Aucune modification
- **LOTS 10-12**: Workers IA → Aucune modification
- **LOT 13**: SSE temps réel → Aucune modification
- **LOT 15**: A/B Testing → Aucune modification

### ✅ Périmètre strict
- **Modifié**: Rendu UI uniquement (composants React)
- **Non modifié**: Backend API, IA, DB, queues, workers

---

## 📋 Tests à effectuer

### 1. Vérifier l'affichage des photos
```bash
# 1. Serveur déjà lancé
pnpm dev  # Déjà actif sur http://localhost:3001

# 2. Ouvrir l'application
open http://localhost:3001

# 3. Aller à l'Étape 2
# 4. Ouvrir Console (F12)
# 5. Vérifier:
#    - Aucun warning "[PhotoCard] image load failed"
#    - Photos visibles (plus de vignettes noires)
```

### 2. Vérifier l'inventaire
```bash
# Dans l'UI Étape 2:
# - Voir la liste d'objets pour chaque pièce
# - Compteur "Objets: X" correct
# - Volume total affiché (ou "—" si absent)
# - Chaque item avec son volume (ou "—")
```

### 3. Test programmatique (optionnel)
```bash
# Tester un endpoint image
node scripts/probe-image.js <photoId>
# Attendu: 200 image/jpeg
```

---

## 💡 Résultats attendus

### ✅ Photos
- ✅ Affichées correctement (résolution URL robuste)
- ✅ Aucune vignette noire si fichier existe
- ✅ Message "Image indisponible" si erreur
- ✅ Log console explicite en cas d'échec

### ✅ Inventaire
- ✅ Liste d'objets affichée (≥ 1 si analysis contient items)
- ✅ Nom d'objet affiché (label OU name)
- ✅ Volume affiché si présent, sinon "—"
- ✅ Compteurs corrects (objets + volume total)

### ⚠️ Limitations connues
- **Volume = "—"**: Normal si l'IA n'a pas retourné de dimensions
- **Pas un bug UI**: Les items sont détectés, seul le volume manque
- **Solution**: Re-uploader une photo pour nouvelle analyse IA complète

---

## 🔧 Diagnostic si problème persiste

### Symptôme: Photos toujours noires
**Causes possibles**:
1. L'URL résolue est incorrecte
   - Vérifier console: devrait être `http://localhost:3001/api/uploads/{id}.jpeg`
   - Si c'est `:3000` au lieu de `:3001` → vérifier `.env.local`

2. Le fichier n'existe pas sur disque
   ```bash
   ls -lh /Users/guillaumestehelin/moverz_v3/uploads/{id}.jpeg
   ```

3. L'endpoint retourne une erreur
   ```bash
   node scripts/probe-image.js {id}
   # Attendu: 200 image/jpeg
   ```

### Symptôme: Inventaire vide
**Causes possibles**:
1. Aucune photo en DB avec analysis
   ```bash
   node scripts/diagnose-step2.mjs
   ```

2. L'analysis existe mais sans items
   - Vérifier dans la console: `[RoomInventoryCard] photo`
   - Si `hasItems: false` → l'IA n'a pas détecté d'objets

3. Problème de rendu composant
   - Vérifier que `RoomInventoryCard` reçoit bien les props
   - Ouvrir React DevTools

### Symptôme: Volume = 0 ou "—"
**Explication**:
- ✅ **Normal** si l'analysis ne contient pas de `volume_m3` ou `volume`
- ❌ **Pas un bug UI**
- 💡 **Solution**: L'IA doit retourner des dimensions lors de l'analyse

---

## 📊 État actuel des données

D'après le diagnostic précédent:
- ✅ 1 photo en DB
- ✅ Analysis présente avec 1 item
- ⚠️ Item sans volume: `{ name: "Meuble", category: "mobilier", fragile: false, dismountable: true }`

**Résultat attendu avec ce patch**:
- ✅ Photo affichée correctement
- ✅ Inventaire: "Meuble" listé
- ✅ Volume: "—" (normal car absent de l'analysis)

---

## ✅ Validation finale

### Checklist avant validation
- [x] Patch appliqué sans erreur
- [x] Endpoint image testé (200 OK)
- [x] Fichiers créés/modifiés listés
- [x] Architecture LOTS 5-18 préservée
- [x] Documentation complète fournie

### Prochaines étapes
1. Rafraîchir http://localhost:3001 + Étape 2
2. Vérifier console (F12) pour logs/erreurs
3. Si OK → Marquer Étape 2 comme résolu
4. Si problème → Consulter section "Diagnostic si problème persiste"

---

**Statut**: ✅ **PRÊT À TESTER**

