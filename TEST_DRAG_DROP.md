# 🧪 Test Drag & Drop - Étape 1.5

## ✅ Corrections Appliquées

**Date** : 2025-10-11  
**Bugs corrigés** : 
1. ❌ Photo introuvable lors du drag & drop entre pièces
2. ❌ Double-clic nécessaire avant que le drag fonctionne

**Fichiers modifiés** :
- `/components/RoomValidationStepV2.tsx`
- `/apps/web/components/RoomValidationStepV2.tsx`

---

## 📋 Checklist de Test

### **Préparation**
```bash
# Terminal 1 : Backend
cd backend
pnpm dev

# Terminal 2 : Frontend
npm run dev

# Terminal 3 : AI Mock
node ai-mock-server.js
```

### **Étape 1 : Uploader des photos**
1. ✅ Ouvrir http://localhost:3001
2. ✅ Uploader 6-10 photos
3. ✅ Attendre la classification automatique

---

### **Étape 2 : Tester le Drag & Drop**

#### **Test 1 : Déplacement simple**
- [ ] Glisser une photo du **Salon** vers la **Cuisine**
- [ ] Vérifier dans la console : 
  ```
  🔍 Photo trouvée dans salon
  🗑️ Photo XXX retirée de salon (3 → 2)
  ✅ Photo XXX déplacée vers cuisine (2 photos)
  ```
- [ ] ✅ **Résultat attendu** : Photo déplacée, pièce source mise à jour

#### **Test 2 : Feedback visuel**
- [ ] Commencer à glisser une photo
- [ ] ✅ Vérifier : La photo devient **semi-transparente** (opacity 30%)
- [ ] Survoler une pièce cible
- [ ] ✅ Vérifier : Bordure bleue + message "📥 Déposer ici"
- [ ] Passer sur les photos à l'intérieur de la pièce
- [ ] ✅ Vérifier : Le feedback visuel **ne clignote PAS**

#### **Test 3 : Drop dans la même pièce**
- [ ] Glisser une photo **dans sa propre pièce**
- [ ] Vérifier dans la console :
  ```
  ℹ️ Photo déjà dans la pièce salon, aucune action
  ```
- [ ] ✅ **Résultat attendu** : Aucun changement, pas de bug

#### **Test 4 : Pièces vides**
- [ ] Créer une **nouvelle pièce vide** (bouton "Créer une nouvelle pièce")
- [ ] Glisser une photo dedans
- [ ] ✅ **Résultat attendu** : Photo ajoutée, message "Glissez des photos ici" disparaît
- [ ] Supprimer toutes les photos d'une pièce (en les déplaçant ailleurs)
- [ ] ✅ **Résultat attendu** : La pièce vide est **automatiquement supprimée**

#### **Test 5 : Multiple drops**
- [ ] Déplacer **5 photos consécutives** entre différentes pièces
- [ ] ✅ **Résultat attendu** : Toutes les photos arrivent correctement, aucune erreur

#### **Test 6 : Validation finale**
- [ ] Réorganiser les photos comme souhaité
- [ ] Cliquer "Valider et continuer"
- [ ] ✅ **Résultat attendu** : Passage à l'étape suivante avec les bonnes pièces

---

## 🐛 Erreurs à Surveiller

### ❌ **Avant le fix**
```
❌ Photo XXX non trouvée dans les groupes ni dans le tableau photos !
```

### ✅ **Après le fix**
```
🔍 Photo trouvée dans salon
✅ Photo XXX déplacée vers cuisine (2 photos)
```

---

## 🔍 Console DevTools

**Ouvrir la console (F12)** et surveiller :

1. ✅ **Pas de messages d'erreur** en rouge
2. ✅ Messages de debug verts avec emoji ✅
3. ✅ Logs détaillés du déplacement :
   - `🔍 movePhotoToRoom: photoId=...`
   - `🔍 Photo trouvée dans...`
   - `🗑️ Photo retirée de...`
   - `✅ Photo déplacée vers...`

---

## 📊 Résultat Attendu

| Test | Avant Fix | Après Fix |
|------|-----------|-----------|
| Drop simple | ❌ Photo perdue | ✅ Fonctionne |
| Feedback visuel | ⚠️ Clignote | ✅ Stable |
| Drop même pièce | ❌ Erreur console | ✅ Ignoré proprement |
| Pièce vide | ✅ OK | ✅ OK |
| 5 drops consécutifs | ❌ 2-3 échouent | ✅ Tous OK |

---

## 📝 Notes

- Les logs de debug sont **temporaires** et peuvent être retirés une fois validé
- Si un problème persiste, vérifier que les deux fichiers sont bien synchronisés
- Le drag & drop utilise l'API HTML5 native + Framer Motion pour les animations

---

## ✅ Validation

Une fois tous les tests passés :
- [ ] Marquer le todo #4 comme `completed`
- [ ] Commit les changements
- [ ] Tester en production si nécessaire

