# 🗄️ Implémentation de la Persistance des Données

## ✅ Fonctionnalités Implémentées

### 1. **Sauvegarde Automatique des Photos**
- Chaque photo uploadée est **automatiquement sauvegardée en DB** (PostgreSQL)
- Format : **Base64** (stockage temporaire, à optimiser vers fichiers locaux plus tard)
- Inclut : **roomType**, **analysis IA complète**, **metadata**

### 2. **Auto-Sauvegarde avec Recalcul des Volumes**
- **Debounce de 3 secondes** après chaque modification
- **Recalcul automatique** des volumes emballés quand :
  - Toggle **fragile** → recalcule `packaged_volume_m3`
  - Toggle **démontable** → recalcule `packaged_volume_m3`
  - Modifications d'inventaire → met à jour les totaux
- Sauvegarde silencieuse en DB via `PATCH /api/photos/[id]`

### 3. **Architecture Implémentée**

```
Frontend (app/page.tsx)
  ↓
  useEffect (debounce 3s)
  ↓
  Recalcule volumes emballés (calculatePackagedVolume)
  ↓
  PATCH /api/photos/[id]
  ↓
  PostgreSQL (table Photo)
```

## 📂 Fichiers Modifiés/Créés

### **Schema Prisma** (`prisma/schema.prisma`)
```prisma
model Project {
  // ... champs existants
  customerName    String?
  customerEmail   String?
  customerPhone   String?
  customerAddress String?
  moveDate        DateTime?
  currentStep     Int      @default(1)
}
```

### **Route API Photos** (`app/api/photos/analyze/route.ts`)
- ✨ **NOUVEAU** : Sauvegarde en DB après analyse IA
- Renvoie `photo_id` pour les updates ultérieurs

### **Route API Update** (`app/api/photos/[id]/route.ts`)
- `PATCH /api/photos/[id]` : met à jour `analysis` et `roomType`
- `GET /api/photos/[id]` : récupère une photo

### **Helper Storage** (`lib/storage.ts`)
- Fonction `savePhotoToDatabase()` :
  - Crée un projet par défaut si nécessaire
  - Sauvegarde photo en DB (Base64 pour l'instant)
  - Gère les upserts (update or create)

### **Frontend** (`app/page.tsx`)
- useEffect avec debounce :
  - Surveille `currentRoom.photos`
  - Recalcule volumes emballés
  - Envoie PATCH à `/api/photos/[id]`

## 🧪 Tests Effectués

### ✅ Upload Photo
```bash
curl -X POST http://localhost:3001/api/photos/analyze \
  -H "x-user-id: test-user-123" \
  -F "file=@test-image.jpg"
# → Renvoie photo_id
```

### ✅ Update Photo
```bash
curl -X PATCH http://localhost:3001/api/photos/[id] \
  -H "x-user-id: test-user-123" \
  -H "Content-Type: application/json" \
  -d '{"analysis":{"test":"updated"}}'
# → { "success": true }
```

### ✅ Get Photo
```bash
curl http://localhost:3001/api/photos/[id] \
  -H "x-user-id: test-user-123"
# → Renvoie photo complète
```

## 🎯 Ce qui est Sauvegardé Automatiquement

| Donnée | Où | Quand |
|--------|-----|-------|
| **Photo Base64** | `Photo.url` | À l'upload |
| **roomType** | `Photo.roomType` | À l'upload |
| **Analyse IA** | `Photo.analysis` | À l'upload |
| **Toggle fragile** | `Photo.analysis.items[].fragile` | 3s après modif |
| **Toggle démontable** | `Photo.analysis.items[].dismountable` | 3s après modif |
| **Volumes emballés** | `Photo.analysis.items[].packaged_volume_m3` | 3s après modif (recalculé) |
| **Totaux** | `Photo.analysis.totals` | 3s après modif (recalculé) |

## 💡 Impact du Toggle Fragile

**Avant** :
```json
{
  "label": "canapé",
  "volume_m3": 2.5,
  "fragile": false,
  "packaged_volume_m3": 2.625  // +5% (meuble non fragile)
}
```

**Après toggle fragile** (3 secondes) :
```json
{
  "label": "canapé",
  "volume_m3": 2.5,
  "fragile": true,
  "packaged_volume_m3": 5.0  // ×2 (objet fragile)
}
```

→ **Recalcul automatique** + **sauvegarde silencieuse en DB**

## 📊 Structure JSON Sauvegardée

```typescript
Photo.analysis = {
  items: [
    {
      label: "canapé",
      volume_m3: 2.5,
      fragile: true,                    // ← Modifié par user
      dismountable: false,              // ← Modifié par user
      packaged_volume_m3: 5.0,          // ← Recalculé auto
      packaging_display: "5.000 M³ emballés",
      is_small_object: false,
      packaging_calculation_details: "...",
      dimensions_cm: { length: 200, width: 90, height: 80 },
      category: "furniture"
    }
  ],
  totals: {
    total_volume_m3: 15.8,
    total_packaged_m3: 18.5,           // ← Recalculé auto
    total_items: 12
  },
  roomDetection: {
    roomType: "salon",
    confidence: 0.95
  }
}
```

## 🔄 Workflow Complet

1. **User upload photo** → Sauvegarde immédiate en DB
2. **IA analyse** → Update DB avec analyse complète
3. **User toggle fragile** (étape 2 ou 4) :
   - State React mis à jour instantanément
   - Attente 3 secondes (debounce)
   - Recalcul volumes emballés
   - Sauvegarde DB silencieuse
4. **User change formulaire** (étape 3) :
   - localStorage (déjà existant)
   - TODO : Sauvegarder aussi en `Project` table

## 🚀 Prochaines Optimisations

### Phase 2 (Recommandé)
- [ ] **Stockage fichiers sur VPS** au lieu de Base64
  - Créer `/uploads` sur serveur
  - Sauvegarder `Photo.filePath = /uploads/[uuid].jpg`
  - `Photo.url = https://moverz.fr/uploads/[uuid].jpg`
- [ ] **Sauvegarder formulaire dans `Project`**
  - `customerName`, `customerEmail`, etc.
  - `currentStep` pour reprendre où on s'est arrêté
- [ ] **Récupération au reload**
  - `GET /api/projects?userId=xxx` au chargement
  - Hydrater state React avec données DB

### Phase 3 (Avancé)
- [ ] **Authentification email** (optionnel)
- [ ] **Multi-projets** (plusieurs devis en parallèle)
- [ ] **Partage de devis** (lien public)

## 🛠️ Maintenance

### Migration Prisma
```bash
npx prisma migrate dev --name [nom_migration]
npx prisma generate
```

### Voir les données
```bash
npx prisma studio
# → http://localhost:5555
```

## 📝 Notes Techniques

- **Debounce 3s** : évite trop de requêtes DB
- **Base64** : pratique mais lourd (~30% plus gros)
  - 1 photo ≈ 300 KB → Base64 ≈ 400 KB
  - OK pour MVP, optimiser en Phase 2
- **PostgreSQL** : hébergé sur VPS (même serveur que Next.js)
- **Prisma** : ORM type-safe, génère types TypeScript
- **Auth simple** : header `x-user-id` en dev, cookies en prod

## ✅ Critères d'Acceptation

- [x] Photo uploadée → sauvegardée en DB
- [x] Toggle fragile → recalcule volumes
- [x] Toggle fragile → sauvegarde DB (3s debounce)
- [x] PATCH `/api/photos/[id]` fonctionne
- [x] GET `/api/photos/[id]` fonctionne
- [x] Pas d'erreurs lint
- [x] Tests curl passent

---

**Date** : 2025-10-01  
**Auteur** : IA Assistant  
**Version** : 1.0  
**Status** : ✅ Implémenté et testé


