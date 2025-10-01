# 🎯 SYNTHÈSE : Création des 3 prompts spécialisés

## 📊 ANALYSE COMPARATIVE GEMINI vs GPT

### 🔴 ARMOIRES / PENDERIES

| Aspect | Gemini | GPT | **Meilleure approche** |
|--------|--------|-----|------------------------|
| **Méthode** | Hauteur d'abord (critique pour volume) | Étapes séquentielles (portes → hauteur → profondeur) | ✅ **Hybride** : Compter portes PUIS hauteur |
| **Largeur par porte** | Non explicite | 50-60 cm battante, 80 cm coulissante | ✅ **GPT** : Plus précis |
| **Profondeur** | 50-70 cm selon type | 40-65 cm selon type | ✅ **GPT** : Distingue penderie (60) vs fine (40) |
| **Hauteur** | Compare au plafond (240-250 cm) | Compare porte (200) ou plafond (250) | ✅ **Gemini** : Focus sur plafond |
| **Standards** | Tableaux détaillés | Règles if-then claires | ✅ **Gemini** : Plus complet |

**🎯 FUSION OPTIMALE** :
1. Compter portes (GPT)
2. Calculer largeur : battantes 50-60 cm/porte, coulissantes 80 cm/porte (GPT)
3. Évaluer hauteur par rapport plafond (Gemini)
4. Profondeur selon type : penderie 60 cm, fine 40-50 cm (GPT)
5. Utiliser tableau de référence (Gemini)

---

### 🟠 TABLES À MANGER

| Aspect | Gemini | GPT | **Meilleure approche** |
|--------|--------|-----|------------------------|
| **Méthode** | Capacité → Forme → Standards → Validation | Chaises → Forme → Standards → Cohérence | ✅ **Équivalent** |
| **Validation forme** | Ratio L/W + triplet (Capacité, Forme, Dim) | Ratio >1.2 = rectangulaire | ✅ **Gemini** : Plus robuste |
| **Standards 6 chaises** | Carré 140×140, Rect 160×90 | Rect 160-180×90 | ✅ **Gemini** : Distingue mieux |
| **Standards 8 chaises** | Rect 200×100 | Carré 150×150 OU Rect 200-220×100 | ✅ **GPT** : Couvre carré 8 places |
| **Hauteur** | 75 cm (standard) | 75 cm (standard) | ✅ **Identique** |

**🎯 FUSION OPTIMALE** :
1. Compter chaises (tous deux)
2. Déduire forme : coins, alignement chaises, ratio L/W (Gemini)
3. **VALIDATION MORPHOLOGIQUE** : Si ratio L/W < 1.2 = carré, sinon rectangulaire (fusion)
4. Appliquer standards selon (Capacité + Forme) - tableau complet (fusion Gemini + GPT)
5. Vérifier cohérence : nombre chaises par côté doit matcher forme (Gemini)

---

### 🟠 CANAPÉS

| Aspect | Gemini | GPT | **Meilleure approche** |
|--------|--------|-----|------------------------|
| **Méthode** | Places → Type → Profondeur → Hauteur | Places → Type → Largeur/place → Accoudoirs → Profondeur | ✅ **GPT** : Plus détaillé |
| **Largeur par place** | 60 cm/personne | 55-65 cm/personne | ✅ **GPT** : Fourchette réaliste |
| **Accoudoirs** | Formule explicite : 3×60+2×25=230 | 10-20 cm chacun (20-40 total) | ✅ **Gemini** : Formule claire |
| **Profondeur classique** | 90 cm | 85-95 cm | ✅ **GPT** : Fourchette |
| **Profondeur lounge** | 100-110 cm (détection écart mur/tapis) | 100-110 cm | ✅ **Gemini** : Méthode détection |
| **Canapé d'angle** | 250×160 (petit L) | 220-280×160-200 | ✅ **GPT** : Plus large |

**🎯 FUSION OPTIMALE** :
1. Compter places assises : 60 cm/personne (base) (tous deux)
2. Identifier type : droit, angle, méridienne (tous deux)
3. **CALCULER LARGEUR** : `Places × 60 cm + 2 × Largeur_accoudoir` (Gemini formule)
   - Accoudoirs fins : +10 cm chaque
   - Accoudoirs larges : +20-25 cm chaque
4. **PROFONDEUR** : Détecter style (GPT) + écart mur/tapis (Gemini)
   - Classique : 85-95 cm
   - Lounge : 100-110 cm
5. Hauteur : 80-90 cm standard
6. **PIÈGES** : Accoudoirs + assise visuelle ≠ place réelle (fusion)

---

## 🚀 ARCHITECTURE DES PROMPTS

### Structure commune pour les 3 prompts :

```typescript
export const [CATEGORIE]_SYSTEM_PROMPT = `
Tu es un expert en mobilier et déménagement.
Ta mission : RAISONNER comme un professionnel, pas DEVINER visuellement.

MÉTHODE OBLIGATOIRE :
1. [Étape 1 spécifique]
2. [Étape 2 spécifique]
3. [Étape 3 spécifique]
4. Valider la cohérence
5. Appliquer les standards

INTERDICTIONS :
❌ Estimation visuelle directe
❌ Dimensions hors standards sans justification
✅ Raisonnement étape par étape
✅ Standards du mobilier
`;

export const [CATEGORIE]_USER_PROMPT = `
Analyse cette photo et détecte UNIQUEMENT les [CATÉGORIE].

🔢 MÉTHODE DE RAISONNEMENT :
[Instructions détaillées étape par étape]

📏 RÈGLES DE DÉDUCTION :
[Tableau de référence fusionné Gemini + GPT]

⚠️ PIÈGES À ÉVITER :
[Liste des erreurs fréquentes]

📋 FORMAT JSON ATTENDU :
{
  "items": [
    {
      "label": "string",
      "reasoning": "string", // ⚠️ OBLIGATOIRE : Justifier le raisonnement
      "detected_features": {
        "nb_portes": 2,        // ou nb_chaises, nb_places selon catégorie
        "forme": "carré",      // pour tables
        "type": "droit"        // pour canapés
      },
      "dimensions_cm": {
        "length": 120,
        "width": 60,
        "height": 220,
        "source": "reasoned"   // Nouvelle source !
      },
      "confidence": 0.9,
      "quantity": 1
    }
  ]
}
```

---

## 📋 TODO : Implémentation

1. ✅ Analyser les réponses Gemini + GPT
2. ✅ Créer synthèse comparative
3. ⏳ Créer les 3 prompts dans `lib/specializedPrompts.ts`
4. ⏳ Créer les 3 services dans `services/` :
   - `armoiresAnalysis.ts`
   - `tablesAnalysis.ts`
   - `canapesAnalysis.ts`
5. ⏳ Modifier `services/optimizedAnalysis.ts` pour orchestrer 5 analyses
6. ⏳ Tester et mesurer amélioration

---

## 🎯 PROCHAINE ÉTAPE

**Tu veux que je crée maintenant les 3 prompts complets dans `lib/specializedPrompts.ts` ?**

