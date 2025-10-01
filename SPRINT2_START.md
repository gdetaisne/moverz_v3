# 🚀 Sprint 2 : Cohérence et Contexte - DÉMARRAGE

## 🎯 Objectifs du Sprint 2

### Impact Attendu
- **+15-20% cohérence** entre objets de la même image
- **+10% précision** globale grâce au contexte
- **Meilleure calibration** avec détection de références

---

## 📋 Améliorations à Implémenter

### 4️⃣ **Détection Améliorée d'Objets de Référence** (2 jours)
**Problème** : Détection basique des références visuelles dans calibration
**Impact** : +10% précision calibration

**Ce qui sera fait** :
- Prompt GPT-4 Vision spécialisé pour détecter portes/prises/carrelage
- Extraction précise des dimensions en pixels
- Validation de la qualité des références détectées
- Hiérarchie de confiance (porte > carrelage > prise)

**Fichiers à créer** :
- `services/referenceObjectDetector.ts` (NOUVEAU)
- Améliorer `services/imageCalibrationService.ts`

---

### 5️⃣ **Analyse Contextuelle Multi-Objets** (3-4 jours)
**Problème** : Chaque objet analysé indépendamment
**Impact** : +15% cohérence entre objets

**Ce qui sera fait** :
- Analyser tous les objets avant calcul dimensions
- Détecter relations spatiales (à côté de, sur, sous)
- Calculer échelle globale à partir de plusieurs objets
- Ajuster mesures selon le contexte

**Fichiers à créer** :
- `services/contextualAnalysisService.ts` (NOUVEAU)
- `services/spatialRelationsDetector.ts` (NOUVEAU)
- `lib/scaleCalculator.ts` (NOUVEAU)

---

## 🏗️ Architecture Sprint 2

```
┌─────────────────────────────────────────┐
│   API /api/photos/analyze               │
└─────────────────┬───────────────────────┘
                  │
         ┌────────▼─────────┐
         │ optimizedAnalysis │
         │  + Calibration ✨ │
         │  + Context ✨     │
         └────────┬──────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼──────────┐   ┌────────▼────────┐
│ Reference      │   │ Contextual      │
│ Object         │   │ Analysis        │
│ Detector ✨    │   │ Service ✨      │
└─────┬──────────┘   └────────┬────────┘
      │                       │
      └───────────┬───────────┘
                  │
         ┌────────▼─────────┐
         │ Spatial Relations│
         │ Detector ✨      │
         └──────────────────┘
```

---

## 📊 Plan de Travail Sprint 2

### Jour 1-2 : Détection de Références (MAINTENANT)
1. ✅ Créer `referenceObjectDetector.ts`
   - Prompt spécialisé GPT-4 Vision
   - Détection portes, prises, carrelage
   - Extraction dimensions en pixels

2. ✅ Améliorer `imageCalibrationService.ts`
   - Intégrer le détecteur
   - Validation qualité références
   - Calcul échelle multi-références

### Jour 3-4 : Analyse Contextuelle
1. ⏳ Créer `spatialRelationsDetector.ts`
   - Détection proximité objets
   - Relations (devant/derrière, à côté)

2. ⏳ Créer `contextualAnalysisService.ts`
   - Analyse globale image
   - Calcul échelle contextuelle
   - Ajustement cohérent

### Jour 5 : Intégration & Tests
1. ⏳ Intégrer dans `optimizedAnalysis.ts`
2. ⏳ Tests de cohérence
3. ⏳ Validation amélioration

---

## 💡 Concepts Clés

### 1. Détection de Références
```typescript
// Au lieu de chercher manuellement
const references = [
  { type: 'door', pixels: 200, realSize: 80cm },
  { type: 'tile', pixels: 60, realSize: 30cm }
];

// Calcul échelle
scale = (80/200 + 30/60) / 2 = 0.4 cm/pixel
```

### 2. Relations Spatiales
```typescript
const relations = {
  'fauteuil': {
    near: ['table basse'],
    inFrontOf: ['TV'],
    expectedSize: 'medium'
  }
};

// Ajustement cohérent
if (fauteuil.width > TV.width) {
  // Incohérent ! Ajuster
}
```

### 3. Échelle Contextuelle
```typescript
// Utiliser plusieurs objets pour valider
const scales = [
  fromObject('door'): 0.4 cm/px,
  fromObject('chair'): 0.38 cm/px,
  fromObject('table'): 0.42 cm/px
];

// Moyenne pondérée
globalScale = weightedAverage(scales) = 0.4 cm/px
```

---

## 🎯 Métriques Sprint 2

### Avant Sprint 2
- Cohérence inter-objets : 70%
- Échelle précise : 60%
- Relations détectées : 0%

### Après Sprint 2 (Attendu)
- Cohérence inter-objets : **85-90%** (+15-20%)
- Échelle précise : **80-85%** (+20-25%)
- Relations détectées : **60-70%** (nouveau !)

---

## 🚀 Démarrage

**On commence par l'amélioration #4 : Détection de Références**

Prêt ? 🎯
