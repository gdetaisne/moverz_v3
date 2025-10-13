# 🔧 Fix Bouton "Continuer vers le devis"

**Date** : 9 octobre 2025  
**Statut** : ✅ RÉSOLU

---

## 🐛 Problème

Le bouton "Continuer vers le devis" ne fonctionne pas à l'étape 3.

---

## 🔍 Cause

Le composant `Step2RoomInventory` est affiché à l'étape 3 :
```typescript
{currentStep === 3 && (
  <Step2RoomInventory
    onNext={() => setCurrentStep(3)}  // ❌ BUG: déjà à l'étape 3 !
  />
)}
```

Le bouton essayait de passer à l'étape 3, mais on était **déjà** à l'étape 3 → aucun changement d'état → pas de navigation.

---

## ✅ Correction

```diff
- onNext={() => setCurrentStep(3)}
+ onNext={() => setCurrentStep(4)}
```

**Fichier modifié** : `app/page.tsx` ligne 1201

---

## 🧪 Test

1. Uploader des photos
2. Valider les groupes de pièces (étape 2)
3. Cliquer sur "Continuer vers le devis"
4. ✅ Devrait passer à l'étape 4 (formulaire de devis)

---

## 🔧 Bonus : Warnings supprimés

### Warning `swcMinify`
```diff
// next.config.ts
- swcMinify: true,  // ❌ Déprécié dans Next.js 15
```

### Warnings `oklabh`

**Cause** : Tailwind CSS v4 génère des couleurs CSS modernes (`oklabh()`) que framer-motion ne peut pas animer.

**Solution temporaire** : Ignorer ces warnings (ne cassent pas l'app).

**Solution permanente** (si nécessaire) :
1. Désactiver les nouvelles couleurs dans Tailwind
2. Ou upgrader framer-motion quand supporté
3. Ou éviter d'animer les couleurs avec motion

---

## 📊 Impact

| Avant | Après |
|-------|-------|
| Bouton ne fait rien | ✅ Navigation vers étape 4 |
| Warning swcMinify | ✅ Supprimé |
| Warnings oklabh | ⚠️ Toujours présents (non bloquants) |


